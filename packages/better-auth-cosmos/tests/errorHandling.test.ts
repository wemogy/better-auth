import { CosmosClient } from '@azure/cosmos';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildCosmosAdapter } from '../src';

// Mock the @azure/cosmos module
let mockCosmosClientInstance: any;

vi.mock('@azure/cosmos', () => {
  const MockCosmosClient = class {
    databases: any;
    constructor() {
      const instance = mockCosmosClientInstance || {
        databases: {
          createIfNotExists: vi.fn(),
        },
      };
      Object.assign(this, instance);
      return instance;
    }
  };
  
  // Make it spyable
  const spyableMock = vi.fn(MockCosmosClient);

  return {
    CosmosClient: spyableMock,
  };
});

describe('Error Handling Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Adapter Creation Errors', () => {
    it('should handle missing connection string', async () => {
      await expect(
        buildCosmosAdapter({
          adapterId: 'test-adapter',
          adapterName: 'Test Adapter',
          dbCredentials: {} as any,
          dbName: 'test-db',
        }),
      ).rejects.toThrow();
    });

    it('should handle invalid database credentials', async () => {
      const invalidCredentials = { endpoint: 'invalid-endpoint', key: 'invalid-key' };

      const mockClient = {
        databases: {
          createIfNotExists: vi.fn().mockRejectedValue(new Error('Invalid credentials')),
        },
      };
      mockCosmosClientInstance = mockClient;

      await expect(
        buildCosmosAdapter({
          adapterId: 'test-adapter',
          adapterName: 'Test Adapter',
          dbCredentials: invalidCredentials,
          dbName: 'test-db',
        }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should handle database creation failure', async () => {
      const credentials = { endpoint: 'test-endpoint', key: 'test-key' };

      const mockClient = {
        databases: {
          createIfNotExists: vi.fn().mockRejectedValue(new Error('Database creation failed')),
        },
      };
      mockCosmosClientInstance = mockClient;

      await expect(
        buildCosmosAdapter({
          adapterId: 'test-adapter',
          adapterName: 'Test Adapter',
          dbCredentials: credentials,
          dbName: 'test-db',
        }),
      ).rejects.toThrow('Database creation failed');
    });

    it('should handle container creation failure', async () => {
      const credentials = { endpoint: 'test-endpoint', key: 'test-key' };

      const mockClient = {
        databases: {
          createIfNotExists: vi.fn().mockResolvedValue({
            database: {
              containers: {
                createIfNotExists: vi.fn().mockRejectedValue(new Error('Container creation failed')),
              },
            },
          }),
        },
      };
      mockCosmosClientInstance = mockClient;

      await expect(
        buildCosmosAdapter({
          adapterId: 'test-adapter',
          adapterName: 'Test Adapter',
          dbCredentials: credentials,
          dbName: 'test-db',
          usePlural: true,
        }),
      ).rejects.toThrow('Container creation failed');
    });
  });

  describe('CRUD Operation Error Handling', () => {
    let adapter: any;
    let mockContainer: any;

    beforeEach(async () => {
      mockContainer = {
        items: {
          create: vi.fn(),
          upsert: vi.fn(),
          query: vi.fn(),
          item: vi.fn(),
        },
      };

      const mockDatabase = {
        container: vi.fn().mockReturnValue(mockContainer),
        containers: {
          createIfNotExists: vi.fn().mockResolvedValue({}),
        },
      };

      const mockClient = {
        databases: {
          createIfNotExists: vi.fn().mockResolvedValue({
            database: mockDatabase,
          }),
        },
      };
      mockCosmosClientInstance = mockClient;

      const adapterFactory = await buildCosmosAdapter({
        adapterId: 'test-adapter',
        adapterName: 'Test Adapter',
        dbCredentials: { endpoint: 'test-endpoint', key: 'test-key' },
        dbName: 'test-db',
        usePlural: true,
      });
      adapter = adapterFactory({
        schema: {
          users: { id: 'string' },
          sessions: { id: 'string' },
          verifications: { id: 'string' },
          accounts: { id: 'string' },
        },
      });
    });

    describe('create operation errors', () => {
      it('should handle create operation failure', async () => {
        mockContainer.items.create.mockRejectedValue(new Error('Create operation failed'));

        await expect(adapter.create({ model: 'users', data: { id: '123', name: 'Test' } })).rejects.toThrow('Create operation failed');
      });

      it('should handle network timeout during create', async () => {
        mockContainer.items.create.mockRejectedValue(new Error('ETIMEDOUT'));

        await expect(adapter.create({ model: 'users', data: { id: '123', name: 'Test' } })).rejects.toThrow('ETIMEDOUT');
      });

      it('should handle invalid data format during create', async () => {
        // Reset mock to ensure it throws the error
        mockContainer.items.create = vi.fn().mockRejectedValue(new Error('Invalid input data'));

        await expect(adapter.create({ model: 'users', data: null as any })).rejects.toThrow('Invalid input data');
      });
    });

    describe('read operation errors', () => {
      it('should handle findOne operation failure', async () => {
        mockContainer.items.query = vi.fn().mockReturnValue({
          fetchAll: vi.fn().mockRejectedValue(new Error('Query execution failed')),
        });

        await expect(adapter.findOne({ model: 'users', where: [{ field: 'id', value: '123', operator: 'eq' }] })).rejects.toThrow(
          'Query execution failed',
        );
      });

      it('should handle findMany operation failure', async () => {
        mockContainer.items.query = vi.fn().mockReturnValue({
          fetchAll: vi.fn().mockRejectedValue(new Error('Batch query failed')),
        });

        await expect(adapter.findMany({ model: 'users', where: [{ field: 'status', value: 'active', operator: 'eq' }] })).rejects.toThrow(
          'Batch query failed',
        );
      });

      it('should handle malformed query', async () => {
        mockContainer.items.query = vi.fn().mockReturnValue({
          fetchAll: vi.fn().mockRejectedValue(new Error('Invalid query syntax')),
        });

        await expect(adapter.findMany({ model: 'users', where: [{ field: 'invalid.field', value: 'test', operator: 'eq' }] })).rejects.toThrow(
          'Invalid query syntax',
        );
      });
    });

    describe('update operation errors', () => {
      it('should handle update operation failure', async () => {
        const mockQuery = {
          fetchAll: vi.fn().mockResolvedValue({ resources: [{ id: '123', name: 'Old Name' }] }),
        };
        mockContainer.items.query = vi.fn().mockReturnValue(mockQuery);
        mockContainer.items.upsert = vi.fn().mockRejectedValue(new Error('Update operation failed'));

        await expect(
          adapter.update({
            model: 'users',
            where: [{ field: 'id', value: '123', operator: 'eq' }],
            update: { name: 'New Name' },
          }),
        ).rejects.toThrow('Update operation failed');
      });

      it('should handle updateMany operation failure', async () => {
        // Reset mocks first
        mockContainer.items.query = vi.fn().mockReturnValue({
          fetchAll: vi.fn().mockResolvedValue({
            resources: [
              { id: '1', name: 'User 1' },
              { id: '2', name: 'User 2' },
            ],
          }),
        });
        mockContainer.items.upsert = vi.fn().mockRejectedValue(new Error('Batch update failed'));

        await expect(
          adapter.updateMany({
            model: 'users',
            where: [{ field: 'status', value: 'inactive', operator: 'eq' }],
            update: { status: 'active' },
          }),
        ).rejects.toThrow('Batch update failed');
      });

      it('should handle concurrent update conflicts', async () => {
        const mockQuery = {
          fetchAll: vi.fn().mockResolvedValue({ resources: [{ id: '123', name: 'Test', _etag: '"old-etag"' }] }),
        };
        mockContainer.items.query = vi.fn().mockReturnValue(mockQuery);
        mockContainer.items.upsert = vi.fn().mockRejectedValue(new Error('PreconditionFailed'));

        await expect(
          adapter.update({
            model: 'users',
            where: [{ field: 'id', value: '123', operator: 'eq' }],
            update: { name: 'Updated' },
          }),
        ).rejects.toThrow('PreconditionFailed');
      });
    });

    describe('delete operation errors', () => {
      it('should handle delete operation failure', async () => {
        mockContainer.items.query = vi.fn().mockReturnValue({
          fetchAll: vi.fn().mockResolvedValue({ resources: [{ id: '123', name: 'Test' }] }),
        });
        const mockItem = {
          delete: vi.fn().mockRejectedValue(new Error('Delete operation failed')),
        };
        mockContainer.items.item = vi.fn().mockReturnValue(mockItem);

        await expect(adapter.delete({ model: 'users', where: [{ field: 'id', value: '123', operator: 'eq' }] })).rejects.toThrow(
          'Delete operation failed',
        );
      });

      it('should handle deleteMany operation failure', async () => {
        mockContainer.items.query = vi.fn().mockReturnValue({
          fetchAll: vi.fn().mockResolvedValue({
            resources: [
              { id: '1', name: 'User 1' },
              { id: '2', name: 'User 2' },
            ],
          }),
        });
        const mockItem = {
          delete: vi.fn().mockRejectedValue(new Error('Batch delete failed')),
        };
        mockContainer.items.item = vi.fn().mockReturnValue(mockItem);

        await expect(adapter.deleteMany({ model: 'users', where: [{ field: 'status', value: 'deleted', operator: 'eq' }] })).rejects.toThrow(
          'Batch delete failed',
        );
      });

      it('should handle deletion of non-existent item', async () => {
        const mockQuery = {
          fetchAll: vi.fn().mockResolvedValue({ resources: [] }),
        };
        mockContainer.items.query = vi.fn().mockReturnValue(mockQuery);
        const mockItem = {
          delete: vi.fn().mockRejectedValue(new Error('NotFound')),
        };
        mockContainer.items.item = vi.fn().mockReturnValue(mockItem);

        // Should not throw when item doesn't exist (graceful handling)
        await expect(adapter.delete({ model: 'users', where: [{ field: 'id', value: '999', operator: 'eq' }] })).resolves.toBeUndefined();
      });
    });

    describe('count operation errors', () => {
      it('should handle count operation failure', async () => {
        mockContainer.items.query = vi.fn().mockImplementation(() => {
          return {
            fetchAll: vi.fn().mockRejectedValue(new Error('Count query failed')),
          };
        });

        await expect(adapter.count({ model: 'users', where: [{ field: 'status', value: 'active', operator: 'eq' }] })).rejects.toThrow(
          'Count query failed',
        );
      });

      it('should handle count with complex query failure', async () => {
        mockContainer.items.query = vi.fn().mockImplementation(() => {
          return {
            fetchAll: vi.fn().mockRejectedValue(new Error('Query too complex')),
          };
        });

        await expect(
          adapter.count({
            model: 'users',
            where: [
              { field: 'status', value: 'active', operator: 'eq' },
              { field: 'role', value: ['admin', 'user'], operator: 'in', connector: 'AND' },
            ],
          }),
        ).rejects.toThrow('Query too complex');
      });
    });
  });

  describe('Connection Error Handling', () => {
    it('should handle connection timeout', async () => {
      const credentials = { endpoint: 'slow-endpoint', key: 'test-key' };

      const mockClient = {
        databases: {
          createIfNotExists: vi.fn().mockRejectedValue(new Error('Connection timeout')),
        },
      };
      mockCosmosClientInstance = mockClient;

      await expect(
        buildCosmosAdapter({
          adapterId: 'test-adapter',
          adapterName: 'Test Adapter',
          dbCredentials: credentials,
          dbName: 'test-db',
        }),
      ).rejects.toThrow('Connection timeout');
    });

    it('should handle authentication failure', async () => {
      const credentials = { endpoint: 'test-endpoint', key: 'wrong-key' };

      const mockClient = {
        databases: {
          createIfNotExists: vi.fn().mockRejectedValue(new Error('Unauthorized')),
        },
      };
      mockCosmosClientInstance = mockClient;

      await expect(
        buildCosmosAdapter({
          adapterId: 'test-adapter',
          adapterName: 'Test Adapter',
          dbCredentials: credentials,
          dbName: 'test-db',
        }),
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle network unreachable', async () => {
      const credentials = { endpoint: 'unreachable-endpoint', key: 'test-key' };

      const mockClient = {
        databases: {
          createIfNotExists: vi.fn().mockRejectedValue(new Error('ENOTFOUND')),
        },
      };
      mockCosmosClientInstance = mockClient;

      await expect(
        buildCosmosAdapter({
          adapterId: 'test-adapter',
          adapterName: 'Test Adapter',
          dbCredentials: credentials,
          dbName: 'test-db',
        }),
      ).rejects.toThrow('ENOTFOUND');
    });
  });

  describe('Data Validation Error Handling', () => {
    it('should handle invalid field names in queries', async () => {
      const mockContainer = {
        items: {
          query: vi.fn().mockReturnValue({
            fetchAll: vi.fn().mockRejectedValue(new Error('Invalid field name')),
          }),
        },
      };

      const mockClient = {
        databases: {
          createIfNotExists: vi.fn().mockResolvedValue({
            database: {
              container: vi.fn().mockReturnValue(mockContainer),
              containers: {
                createIfNotExists: vi.fn().mockResolvedValue({}),
              },
            },
          }),
        },
      };
      mockCosmosClientInstance = mockClient;

      const adapterFactory = await buildCosmosAdapter({
        adapterId: 'test-adapter',
        adapterName: 'Test Adapter',
        dbCredentials: { endpoint: 'test-endpoint', key: 'test-key' },
        dbName: 'test-db',
      });
      const adapter = adapterFactory({
        schema: {
          users: { id: 'string' },
          sessions: { id: 'string' },
          verifications: { id: 'string' },
          accounts: { id: 'string' },
        },
      });

      await expect(
        adapter.findMany({
          model: 'users',
          where: [{ field: 'invalid.field.name', value: 'test', operator: 'eq' }],
        }),
      ).rejects.toThrow('Invalid field name');
    });

    it('should handle malformed data in create operations', async () => {
      const mockContainer = {
        items: {
          create: vi.fn().mockRejectedValue(new Error('Invalid document structure')),
        },
      };

      const mockClient = {
        databases: {
          createIfNotExists: vi.fn().mockResolvedValue({
            database: {
              container: vi.fn().mockReturnValue(mockContainer),
              containers: {
                createIfNotExists: vi.fn().mockResolvedValue({}),
              },
            },
          }),
        },
      };
      mockCosmosClientInstance = mockClient;

      const adapterFactory = await buildCosmosAdapter({
        adapterId: 'test-adapter',
        adapterName: 'Test Adapter',
        dbCredentials: { endpoint: 'test-endpoint', key: 'test-key' },
        dbName: 'test-db',
      });
      const adapter = adapterFactory({
        schema: {
          users: { id: 'string' },
          sessions: { id: 'string' },
          verifications: { id: 'string' },
          accounts: { id: 'string' },
        },
      });

      await expect(
        adapter.create({
          model: 'users',
          data: { invalidField: { nested: { deep: { value: 'too deep' } } } },
        }),
      ).rejects.toThrow('Invalid document structure');
    });
  });

  describe('Debug Logging with Errors', () => {
    it('should handle debug logging configuration', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockContainer = {
        items: {
          create: vi.fn().mockRejectedValue(new Error('Test error')),
        },
      };

      const mockClient = {
        databases: {
          createIfNotExists: vi.fn().mockResolvedValue({
            database: {
              container: vi.fn().mockReturnValue(mockContainer),
              containers: {
                createIfNotExists: vi.fn().mockResolvedValue({}),
              },
            },
          }),
        },
      };
      mockCosmosClientInstance = mockClient;

      const adapterFactory = await buildCosmosAdapter({
        adapterId: 'test-adapter',
        adapterName: 'Test Adapter',
        dbCredentials: { endpoint: 'test-endpoint', key: 'test-key' },
        dbName: 'test-db',
        debugLogs: true,
      });
      const adapter = adapterFactory({
        schema: {
          users: { id: 'string' },
          sessions: { id: 'string' },
          verifications: { id: 'string' },
          accounts: { id: 'string' },
        },
      });

      await expect(adapter.create({ model: 'users', data: { id: '123', name: 'Test' } })).rejects.toThrow('Test error');

      consoleSpy.mockRestore();
    });
  });
});
