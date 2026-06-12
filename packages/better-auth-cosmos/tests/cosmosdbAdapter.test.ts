import { normalTestSuite, testAdapter } from '@better-auth/test-utils/adapter';
import { vi } from 'vitest';
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

                    // Handle both string queries and SqlQuerySpec objects
                    let sql = '';
                    const params: Record<string, unknown> = {};
                    if (typeof querySpec === 'string') {
                      sql = querySpec;
                    } else if (querySpec && typeof (querySpec as Record<string, unknown>).query === 'string') {
                      const spec = querySpec as { query: string; parameters?: { name: string; value: unknown }[] };
                      sql = spec.query;
                      for (const p of spec.parameters ?? []) {
                        params[p.name] = p.value;
                      }
                    }

                    // Evaluate a single condition fragment (e.g. "c.field >= @p0") against an item
                    const evalFragment = (fragment: string, item: Record<string, unknown>): boolean => {
                      const trimmed = fragment.trim();

                      const isNullMatch = trimmed.match(/^(NOT\s+)?IS_NULL\(c\.(\w+)\)$/i);
                      if (isNullMatch) {
                        const [, not, field] = isNullMatch;
                        const isNull = item[field] === null || item[field] === undefined;
                        return not ? !isNull : isNull;
                      }

                      const arrayContainsMatch = trimmed.match(/^(NOT\s+)?ARRAY_CONTAINS\((@\w+),\s*c\.(\w+)\)$/i);
                      if (arrayContainsMatch) {
                        const [, not, param, field] = arrayContainsMatch;
                        const values = (params[param] as unknown[]) ?? [];
                        const contained = values.some(v => String(v) === String(item[field]));
                        return not ? !contained : contained;
                      }

                      const stringFnMatch = trimmed.match(/^(CONTAINS|STARTSWITH|ENDSWITH)\(c\.(\w+),\s*(@\w+)(?:,\s*true)?\)$/i);
                      if (stringFnMatch) {
                        const [, fn, field, param] = stringFnMatch;
                        if (item[field] === null || item[field] === undefined) {
                          return false;
                        }
                        const haystack = String(item[field]).toLowerCase();
                        const needle = String(params[param]).toLowerCase();
                        if (fn.toUpperCase() === 'CONTAINS') return haystack.includes(needle);
                        if (fn.toUpperCase() === 'STARTSWITH') return haystack.startsWith(needle);
                        return haystack.endsWith(needle);
                      }

                      const comparisonMatch = trimmed.match(/^c\.(\w+)\s*(>=|<=|!=|=|>|<)\s*(@\w+)$/);
                      if (comparisonMatch) {
                        const [, field, operator, param] = comparisonMatch;
                        const itemValue = item[field];
                        const paramValue = params[param];
                        switch (operator) {
                          case '=':
                            return itemValue === paramValue || String(itemValue) === String(paramValue);
                          case '!=':
                            return !(itemValue === paramValue || String(itemValue) === String(paramValue));
                          case '>':
                            return itemValue !== undefined && itemValue !== null && (itemValue as never) > (paramValue as never);
                          case '>=':
                            return itemValue !== undefined && itemValue !== null && (itemValue as never) >= (paramValue as never);
                          case '<':
                            return itemValue !== undefined && itemValue !== null && (itemValue as never) < (paramValue as never);
                          case '<=':
                            return itemValue !== undefined && itemValue !== null && (itemValue as never) <= (paramValue as never);
                          default:
                            return false;
                        }
                      }

                      // Unknown fragment: treat as non-matching to surface parsing gaps in tests
                      return false;
                    };

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

                      // Parse WHERE clause: OR splits branches, AND combines fragments within a branch
                      const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER BY|\s+OFFSET|\s+LIMIT|$)/i);
                      if (whereMatch) {
                        const orParts = whereMatch[1].split(/\s+OR\s+/i).map(part => part.split(/\s+AND\s+/i));
                        filtered = filtered.filter(item =>
                          orParts.some(fragments => fragments.every(fragment => evalFragment(fragment, item as Record<string, unknown>))),
                        );
                      }

                      // Parse ORDER BY
                      const orderByMatch = sql.match(/ORDER BY\s+c\.(\w+)\s+(ASC|DESC)/i);
                      if (orderByMatch) {
                        const [, field, direction] = orderByMatch;
                        filtered.sort((a: unknown, b: unknown) => {
                          const aVal = (a as Record<string, unknown>)[field];
                          const bVal = (b as Record<string, unknown>)[field];
                          let comparison: number;
                          if (typeof aVal === 'number' && typeof bVal === 'number') {
                            comparison = aVal - bVal;
                          } else {
                            const aStr = String(aVal ?? '');
                            const bStr = String(bVal ?? '');
                            comparison = aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
                          }
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
                          selectFields!.forEach(field => {
                            if (field in itemRecord) {
                              selected[field] = itemRecord[field];
                            }
                          });
                          return selected;
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

// Build the adapter factory once; field/model mapping is derived from the
// better-auth options passed at each factory invocation, so reuse is safe.
const cosmosAdapterFactory = await buildCosmosAdapter({
  adapterId: 'cosmos-adapter',
  adapterName: 'Cosmos Adapter',
  dbCredentials: {
    endpoint: 'https://test.documents.azure.com:443/',
    key: 'test-key',
  },
  dbName: 'better-auth',
  usePlural: true,
  debugLogs: {
    isRunningAdapterTests: true, // Only log debug logs if a test fails.
  },
});

const { execute } = await testAdapter({
  adapter: () => cosmosAdapterFactory,
  runMigrations: () => {
    // No migrations needed: containers are created on adapter initialization
    // and the mocked Cosmos client stores data in memory.
  },
  additionalCleanups: () => {
    Object.keys(mockDataStore).forEach(key => {
      delete mockDataStore[key];
    });
  },
  tests: [normalTestSuite()],
});

execute();
