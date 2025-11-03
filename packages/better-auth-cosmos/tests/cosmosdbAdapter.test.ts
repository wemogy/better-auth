import { runAdapterTest } from 'better-auth/adapters/test';
import { describe, vi, beforeAll } from 'vitest';
import { buildCosmosAdapter } from '../src';

// Mock the @azure/cosmos module
const mockDataStore: Record<string, unknown[]> = {};

vi.mock('@azure/cosmos', () => {
  const MockCosmosClient = class {
    databases: unknown;
    constructor() {
      // Don't reset here - let beforeEach handle it

      this.databases = {
        createIfNotExists: vi.fn().mockResolvedValue({
          database: {
            container: vi.fn().mockImplementation((containerName: string) => {
              if (!mockDataStore[containerName]) {
                mockDataStore[containerName] = [];
              }

              const containerMock = {
                items: {
                  create: vi.fn().mockImplementation(async (item: unknown) => {
                    const itemRecord = item as Record<string, unknown>;
                    const resource = { ...itemRecord, id: itemRecord.id || `mock-${Date.now()}-${Math.random()}` };
                    mockDataStore[containerName].push(resource);
                    return { resource };
                  }),
                  upsert: vi.fn().mockImplementation(async (item: unknown) => {
                    const itemRecord = item as Record<string, unknown>;
                    const index = mockDataStore[containerName].findIndex((i: unknown) => (i as Record<string, unknown>).id === itemRecord.id);
                    if (index >= 0) {
                      mockDataStore[containerName][index] = {
                        ...(mockDataStore[containerName][index] as Record<string, unknown>),
                        ...itemRecord,
                      };
                    } else {
                      mockDataStore[containerName].push({
                        ...itemRecord,
                        id: itemRecord.id || `mock-${Date.now()}-${Math.random()}`,
                      });
                    }
                    const resource = mockDataStore[containerName].find((i: unknown) => (i as Record<string, unknown>).id === itemRecord.id) || item;
                    return { resource };
                  }),
                  query: vi.fn().mockImplementation((querySpec: unknown) => {
                    // Parse SQL query and filter results
                    if (!mockDataStore[containerName]) {
                      mockDataStore[containerName] = [];
                    }
                    let filtered = [...mockDataStore[containerName]];

                    // Handle both string queries and QuerySpec objects
                    let sql = '';
                    if (typeof querySpec === 'string') {
                      sql = querySpec;
                    } else if (querySpec && typeof (querySpec as Record<string, unknown>).query === 'string') {
                      sql = (querySpec as Record<string, unknown>).query as string;
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

                        // Check if there are OR connectors
                        if (conditions.includes(' OR ')) {
                          // Handle OR logic - union results from each OR branch
                          const orParts = conditions.split(/\s+OR\s+/i);
                          const orResults: unknown[] = [];
                          const allItems = [...mockDataStore[containerName]];

                          for (const orPart of orParts) {
                            let partFiltered = [...allItems];

                            // Apply filters from this OR part
                            const eqMatches = Array.from(orPart.matchAll(/c\.(\w+)\s*=\s*'([^']+)'/g));
                            for (const match of eqMatches) {
                              const [, field, value] = match;
                              partFiltered = partFiltered.filter(
                                (item: unknown) => String((item as Record<string, unknown>)[field]) === String(value),
                              );
                            }

                            const neMatches = Array.from(orPart.matchAll(/c\.(\w+)\s*!=\s*'([^']+)'/g));
                            for (const match of neMatches) {
                              const [, field, value] = match;
                              partFiltered = partFiltered.filter(
                                (item: unknown) => String((item as Record<string, unknown>)[field]) !== String(value),
                              );
                            }

                            const inMatches = Array.from(orPart.matchAll(/c\.(\w+)\s+IN\s+\(([^)]+)\)/gi));
                            for (const match of inMatches) {
                              const [, field, valuesStr] = match;
                              const values = valuesStr.split(',').map((v: string) => v.trim().replace(/^'|'$/g, ''));
                              partFiltered = partFiltered.filter((item: unknown) =>
                                values.includes(String((item as Record<string, unknown>)[field])),
                              );
                            }

                            const notInMatches = Array.from(orPart.matchAll(/c\.(\w+)\s+NOT\s+IN\s+\(([^)]+)\)/gi));
                            for (const match of notInMatches) {
                              const [, field, valuesStr] = match;
                              const values = valuesStr.split(',').map((v: string) => v.trim().replace(/^'|'$/g, ''));
                              partFiltered = partFiltered.filter(
                                (item: unknown) => !values.includes(String((item as Record<string, unknown>)[field])),
                              );
                            }

                            // Add to results (avoid duplicates)
                            partFiltered.forEach(item => {
                              const itemId = (item as Record<string, unknown>).id;
                              if (!orResults.find(r => (r as Record<string, unknown>).id === itemId)) {
                                orResults.push(item);
                              }
                            });
                          }
                          filtered = orResults;
                        } else {
                          // Process all conditions sequentially (AND by default)
                          // Parse simple equality: c.field = 'value'
                          const eqMatches = Array.from(conditions.matchAll(/c\.(\w+)\s*=\s*'([^']+)'/g));
                          for (const match of eqMatches) {
                            const [, field, value] = match;
                            filtered = filtered.filter((item: unknown) => String((item as Record<string, unknown>)[field]) === String(value));
                          }

                          // Parse != operator
                          const neMatches = Array.from(conditions.matchAll(/c\.(\w+)\s*!=\s*'([^']+)'/g));
                          for (const match of neMatches) {
                            const [, field, value] = match;
                            filtered = filtered.filter((item: unknown) => String((item as Record<string, unknown>)[field]) !== String(value));
                          }

                          // Parse IN clause: c.field IN ('val1', 'val2')
                          const inMatches = Array.from(conditions.matchAll(/c\.(\w+)\s+IN\s+\(([^)]+)\)/gi));
                          for (const match of inMatches) {
                            const [, field, valuesStr] = match;
                            const values = valuesStr.split(',').map((v: string) => v.trim().replace(/^'|'$/g, ''));
                            filtered = filtered.filter((item: unknown) => values.includes(String((item as Record<string, unknown>)[field])));
                          }

                          // Parse NOT IN
                          const notInMatches = Array.from(conditions.matchAll(/c\.(\w+)\s+NOT\s+IN\s+\(([^)]+)\)/gi));
                          for (const match of notInMatches) {
                            const [, field, valuesStr] = match;
                            const values = valuesStr.split(',').map((v: string) => v.trim().replace(/^'|'$/g, ''));
                            filtered = filtered.filter((item: unknown) => !values.includes(String((item as Record<string, unknown>)[field])));
                          }
                        }

                        // Parse CONTAINS
                        const containsMatches = Array.from(conditions.matchAll(/CONTAINS\(c\.(\w+),\s*'([^']+)'/gi));
                        for (const match of containsMatches) {
                          const [, field, value] = match;
                          filtered = filtered.filter((item: unknown) => {
                            const itemRecord = item as Record<string, unknown>;
                            return itemRecord[field] && String(itemRecord[field]).toLowerCase().includes(value.toLowerCase());
                          });
                        }

                        // Parse STARTSWITH
                        const startsWithMatches = Array.from(conditions.matchAll(/STARTSWITH\(c\.(\w+),\s*'([^']+)'/gi));
                        for (const match of startsWithMatches) {
                          const [, field, value] = match;
                          filtered = filtered.filter((item: unknown) => {
                            const itemRecord = item as Record<string, unknown>;
                            return itemRecord[field] && String(itemRecord[field]).toLowerCase().startsWith(value.toLowerCase());
                          });
                        }

                        // Parse ENDSWITH
                        const endsWithMatches = Array.from(conditions.matchAll(/ENDSWITH\(c\.(\w+),\s*'([^']+)'/gi));
                        for (const match of endsWithMatches) {
                          const [, field, value] = match;
                          filtered = filtered.filter((item: unknown) => {
                            const itemRecord = item as Record<string, unknown>;
                            return itemRecord[field] && String(itemRecord[field]).toLowerCase().endsWith(value.toLowerCase());
                          });
                        }
                      }

                      // Parse ORDER BY
                      const orderByMatch = sql.match(/ORDER BY\s+c\.(\w+)\s+(ASC|DESC)/i);
                      if (orderByMatch) {
                        const [, field, direction] = orderByMatch;
                        filtered.sort((a: unknown, b: unknown) => {
                          const aRecord = a as Record<string, unknown>;
                          const bRecord = b as Record<string, unknown>;
                          const aVal = aRecord[field];
                          const bVal = bRecord[field];
                          // Convert to comparable values for sorting
                          const aStr = String(aVal ?? '');
                          const bStr = String(bVal ?? '');
                          const comparison = aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
                          return direction.toUpperCase() === 'DESC' ? -comparison : comparison;
                        });
                      }

                      // Parse LIMIT and OFFSET (order matters - OFFSET before LIMIT in SQL)
                      const offsetMatch = sql.match(/OFFSET\s+(\d+)/i);
                      const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
                      const offset = offsetMatch ? parseInt(offsetMatch[1], 10) : 0;
                      const limit = limitMatch ? parseInt(limitMatch[1], 10) : undefined;

                      // Apply offset first
                      if (offset > 0) {
                        filtered = filtered.slice(offset);
                      }
                      // Then apply limit
                      if (limit !== undefined && limit > 0) {
                        filtered = filtered.slice(0, limit);
                      }

                      // Apply SELECT field filtering
                      if (selectFields && selectFields.length > 0) {
                        filtered = filtered.map((item: unknown) => {
                          const itemRecord = item as Record<string, unknown>;
                          const selected: Record<string, unknown> = {};
                          // Always include id if it exists
                          if (itemRecord.id !== undefined) {
                            selected.id = itemRecord.id;
                          }
                          selectFields!.forEach(field => {
                            if (field in itemRecord) {
                              selected[field] = itemRecord[field];
                            }
                          });
                          // If no fields were selected (excluding id), return the original item
                          return Object.keys(selected).length > (itemRecord.id !== undefined ? 1 : 0) ? selected : item;
                        });
                      }
                    }

                    return {
                      fetchAll: vi.fn().mockResolvedValue({
                        resources: filtered,
                      }),
                    };
                  }),
                },
                item: vi.fn().mockImplementation((id: string, partitionKey?: string) => {
                  return {
                    delete: vi.fn().mockImplementation(async () => {
                      const searchId = partitionKey || id;
                      const index = mockDataStore[containerName].findIndex((i: unknown) => (i as Record<string, unknown>).id === searchId);
                      if (index >= 0) {
                        mockDataStore[containerName].splice(index, 1);
                      }
                      return {};
                    }),
                  };
                }),
              };
              return containerMock;
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
  const spyableMock = vi.fn().mockImplementation((...args) => new MockCosmosClient(...args));

  return {
    CosmosClient: spyableMock,
  };
});

describe('My Adapter Tests', () => {
  beforeAll(() => {
    vi.clearAllMocks();
    // Reset data store before all tests
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
