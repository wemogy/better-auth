import { CosmosClient } from '@azure/cosmos';
import { runAdapterTest } from 'better-auth/adapters/test';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import { buildCosmosAdapter } from '../src';

// Mock the @azure/cosmos module
const mockDataStore: Record<string, any[]> = {};

vi.mock('@azure/cosmos', () => {
  const MockCosmosClient = class {
    databases: any;
    constructor() {
      // Don't reset here - let beforeEach handle it
      
      this.databases = {
        createIfNotExists: vi.fn().mockResolvedValue({
          database: {
            container: vi.fn().mockImplementation((containerName: string) => {
              if (!mockDataStore[containerName]) {
                mockDataStore[containerName] = [];
              }
              
              return {
                items: {
                  create: vi.fn().mockImplementation(async (item: any) => {
                    const resource = { ...item, id: item.id || `mock-${Date.now()}-${Math.random()}` };
                    mockDataStore[containerName].push(resource);
                    return { resource };
                  }),
                  upsert: vi.fn().mockImplementation(async (item: any) => {
                    const index = mockDataStore[containerName].findIndex((i: any) => i.id === item.id);
                    if (index >= 0) {
                      mockDataStore[containerName][index] = { ...mockDataStore[containerName][index], ...item };
                    } else {
                      mockDataStore[containerName].push({ ...item, id: item.id || `mock-${Date.now()}-${Math.random()}` });
                    }
                    const resource = mockDataStore[containerName].find((i: any) => i.id === item.id) || item;
                    return { resource };
                  }),
                  query: vi.fn().mockImplementation((querySpec: any) => {
                    // Parse SQL query and filter results
                    if (!mockDataStore[containerName]) {
                      mockDataStore[containerName] = [];
                    }
                    let filtered = [...mockDataStore[containerName]];
                    
                    // Handle both string queries and QuerySpec objects
                    let sql = '';
                    if (typeof querySpec === 'string') {
                      sql = querySpec;
                    } else if (querySpec && typeof querySpec.query === 'string') {
                      sql = querySpec.query;
                    }
                    
                    if (sql) {
                      // Parse SELECT clause to determine which fields to return
                      const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
                      let selectFields: string[] | null = null;
                      if (selectMatch) {
                        const selectStr = selectMatch[1].trim();
                        if (selectStr !== '*') {
                          selectFields = selectStr.split(',').map(f => f.trim().replace(/^c\./, ''));
                        }
                      }
                      
                      // Parse WHERE clauses
                      const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER BY|\s+OFFSET|\s+LIMIT|$)/i);
                      if (whereMatch) {
                        const conditions = whereMatch[1];
                        
                        // Process all conditions sequentially (AND by default)
                        // Parse simple equality: c.field = 'value'
                        const eqMatches = Array.from(conditions.matchAll(/c\.(\w+)\s*=\s*'([^']+)'/g));
                        for (const match of eqMatches) {
                          const [, field, value] = match;
                          filtered = filtered.filter((item: any) => String(item[field]) === String(value));
                        }
                        
                        // Parse != operator
                        const neMatches = Array.from(conditions.matchAll(/c\.(\w+)\s*!=\s*'([^']+)'/g));
                        for (const match of neMatches) {
                          const [, field, value] = match;
                          filtered = filtered.filter((item: any) => String(item[field]) !== String(value));
                        }
                        
                        // Parse IN clause: c.field IN ('val1', 'val2')
                        const inMatches = Array.from(conditions.matchAll(/c\.(\w+)\s+IN\s+\(([^)]+)\)/gi));
                        for (const match of inMatches) {
                          const [, field, valuesStr] = match;
                          const values = valuesStr.split(',').map((v: string) => v.trim().replace(/^'|'$/g, ''));
                          filtered = filtered.filter((item: any) => values.includes(String(item[field])));
                        }
                        
                        // Parse NOT IN
                        const notInMatches = Array.from(conditions.matchAll(/c\.(\w+)\s+NOT\s+IN\s+\(([^)]+)\)/gi));
                        for (const match of notInMatches) {
                          const [, field, valuesStr] = match;
                          const values = valuesStr.split(',').map((v: string) => v.trim().replace(/^'|'$/g, ''));
                          filtered = filtered.filter((item: any) => !values.includes(String(item[field])));
                        }
                        
                        // Parse CONTAINS
                        const containsMatches = Array.from(conditions.matchAll(/CONTAINS\(c\.(\w+),\s*'([^']+)'/gi));
                        for (const match of containsMatches) {
                          const [, field, value] = match;
                          filtered = filtered.filter((item: any) => 
                            item[field] && String(item[field]).toLowerCase().includes(value.toLowerCase())
                          );
                        }
                        
                        // Parse STARTSWITH
                        const startsWithMatches = Array.from(conditions.matchAll(/STARTSWITH\(c\.(\w+),\s*'([^']+)'/gi));
                        for (const match of startsWithMatches) {
                          const [, field, value] = match;
                          filtered = filtered.filter((item: any) => 
                            item[field] && String(item[field]).toLowerCase().startsWith(value.toLowerCase())
                          );
                        }
                        
                        // Parse ENDSWITH
                        const endsWithMatches = Array.from(conditions.matchAll(/ENDSWITH\(c\.(\w+),\s*'([^']+)'/gi));
                        for (const match of endsWithMatches) {
                          const [, field, value] = match;
                          filtered = filtered.filter((item: any) => 
                            item[field] && String(item[field]).toLowerCase().endsWith(value.toLowerCase())
                          );
                        }
                      }
                      
                      // Parse ORDER BY
                      const orderByMatch = sql.match(/ORDER BY\s+c\.(\w+)\s+(ASC|DESC)/i);
                      if (orderByMatch) {
                        const [, field, direction] = orderByMatch;
                        filtered.sort((a: any, b: any) => {
                          const aVal = a[field];
                          const bVal = b[field];
                          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                          return direction.toUpperCase() === 'DESC' ? -comparison : comparison;
                        });
                      }
                      
                      // Parse LIMIT and OFFSET (order matters - OFFSET before LIMIT in SQL)
                      const offsetMatch = sql.match(/OFFSET\s+(\d+)/i);
                      const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
                      const offset = offsetMatch ? parseInt(offsetMatch[1], 10) : 0;
                      const limit = limitMatch ? parseInt(limitMatch[1], 10) : undefined;
                      
                      if (limit !== undefined) {
                        filtered = filtered.slice(offset, offset + limit);
                      } else if (offset > 0) {
                        filtered = filtered.slice(offset);
                      }
                      
                      // Apply SELECT field filtering
                      if (selectFields && selectFields.length > 0) {
                        filtered = filtered.map((item: any) => {
                          const selected: any = {};
                          // Always include id if it exists
                          if (item.id !== undefined) {
                            selected.id = item.id;
                          }
                          selectFields!.forEach(field => {
                            if (item.hasOwnProperty(field) || item[field] !== undefined) {
                              selected[field] = item[field];
                            }
                          });
                          return Object.keys(selected).length > 0 ? selected : item;
                        });
                      }
                    }
                    
                    return {
                      fetchAll: vi.fn().mockResolvedValue({
                        resources: filtered,
                      }),
                    };
                  }),
                  item: vi.fn().mockImplementation((id: string, partitionKey: string) => {
                    return {
                      delete: vi.fn().mockImplementation(async () => {
                        const index = mockDataStore[containerName].findIndex((i: any) => i.id === id);
                        if (index >= 0) {
                          mockDataStore[containerName].splice(index, 1);
                        }
                        return {};
                      }),
                    };
                  }),
                },
              };
            }),
            containers: {
              createIfNotExists: vi.fn().mockResolvedValue({}),
            },
          },
        }),
      };
    }
  };
  
  // Make it spyable
  const spyableMock = vi.fn(MockCosmosClient);

  return {
    CosmosClient: spyableMock,
  };
});

describe('My Adapter Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset data store for each test
    Object.keys(mockDataStore).forEach(key => delete mockDataStore[key]);
  });

  runAdapterTest({
    getAdapter: async (betterAuthOptions = {}) => {
      const adapter = await buildCosmosAdapter({
        adapterId: 'cosmos-adapter',
        adapterName: 'Cosmos Adapter',
        dbCredentials: {
          endpoint: 'https://test.documents.azure.com:443/',
          key: 'test-key',
        },
        dbName: 'better-auth',
        usePlural: true,
        debugLogs: {
          // If your adapter config allows passing in debug logs, then pass this here.
          isRunningAdapterTests: true, // This is our super secret flag to let us know to only log debug logs if a test fails.
        },
      });
      return adapter(betterAuthOptions);
    },
  });
});
