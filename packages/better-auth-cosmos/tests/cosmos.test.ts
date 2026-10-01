import { CosmosClient } from '@azure/cosmos';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Cosmos } from '../src/cosmos';

// Mock the @azure/cosmos module
interface MockCosmosClientInstance {
  databases: {
    createIfNotExists: ReturnType<typeof vi.fn>;
  };
}

let mockCosmosClientInstance: MockCosmosClientInstance | undefined;

vi.mock('@azure/cosmos', () => {
  return {
    CosmosClient: vi.fn().mockImplementation(function () {
      const instance = mockCosmosClientInstance || {
        databases: {
          createIfNotExists: vi.fn(),
        },
      };
      Object.assign(this, instance);
      return this;
    }),
    Database: class {},
    Container: class {},
    Items: class {},
  };
});

describe('Cosmos Class', () => {
  let mockCosmosClient: MockCosmosClientInstance;
  let mockDatabase: {
    containers: {
      createIfNotExists: ReturnType<typeof vi.fn>;
    };
    container: ReturnType<typeof vi.fn>;
  };
  let mockContainer: {
    items: {
      create: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
      query: ReturnType<typeof vi.fn>;
      item: ReturnType<typeof vi.fn>;
    };
    item: ReturnType<typeof vi.fn>;
  };
  let mockItems: {
    create: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
    item: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Setup mocks
    mockItems = {
      create: vi.fn(),
      upsert: vi.fn(),
      query: vi.fn(),
      item: vi.fn(),
    };

    mockContainer = {
      items: mockItems,
      item: vi.fn().mockImplementation((id: string, partitionKey: string) => ({
        _partitionKey: partitionKey,
        _id: id,
        delete: vi.fn().mockResolvedValue({}),
      })),
    };

    mockDatabase = {
      containers: {
        createIfNotExists: vi.fn(),
      },
      container: vi.fn().mockReturnValue(mockContainer),
    };

    mockCosmosClient = {
      databases: {
        createIfNotExists: vi.fn(),
      },
    };

    // Set the mock instance that will be returned by the constructor
    mockCosmosClientInstance = mockCosmosClient;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('concurrent creation', () => {
    const conflict = Object.assign(new Error('Resource with specified id already exists'), { code: 409 });

    it('reads the database when another client created it at the same moment', async () => {
      const read = vi.fn().mockResolvedValue({ database: mockDatabase });
      Object.assign(mockCosmosClient, { database: vi.fn().mockReturnValue({ read }) });
      mockCosmosClient.databases.createIfNotExists.mockRejectedValue(conflict);
      mockDatabase.containers.createIfNotExists.mockResolvedValue({});

      await expect(Cosmos.create({ endpoint: 'e', key: 'k' }, 'test-db', [{ name: 'users' }])).resolves.toBeDefined();
      expect(read).toHaveBeenCalledTimes(1);
      expect(mockDatabase.containers.createIfNotExists).toHaveBeenCalledTimes(1);
    });

    it('reads the container when another client created it at the same moment', async () => {
      const read = vi.fn().mockResolvedValue({ container: mockContainer });
      mockDatabase.container.mockReturnValue({ ...mockContainer, read });
      mockCosmosClient.databases.createIfNotExists.mockResolvedValue({ database: mockDatabase });
      mockDatabase.containers.createIfNotExists.mockRejectedValue(conflict);

      await expect(Cosmos.create({ endpoint: 'e', key: 'k' }, 'test-db', [{ name: 'users' }])).resolves.toBeDefined();
      expect(read).toHaveBeenCalledTimes(1);
    });

    it('still fails on any other error', async () => {
      const forbidden = Object.assign(new Error('Forbidden'), { code: 403 });
      mockCosmosClient.databases.createIfNotExists.mockRejectedValue(forbidden);

      await expect(Cosmos.create({ endpoint: 'e', key: 'k' }, 'test-db', [{ name: 'users' }])).rejects.toBe(forbidden);
    });
  });

  describe('create', () => {
    it('should create Cosmos instance with database and containers', async () => {
      const credentials = { endpoint: 'test-endpoint', key: 'test-key' };
      const dbName = 'test-db';
      const containers = [{ name: 'users' }, { name: 'sessions', partitionKey: '/token' }];

      mockCosmosClient.databases.createIfNotExists.mockResolvedValue({
        database: mockDatabase,
      });

      mockDatabase.containers.createIfNotExists.mockResolvedValue({});

      await Cosmos.create(credentials, dbName, containers);

      expect(CosmosClient).toHaveBeenCalledWith(credentials);
      expect(mockCosmosClient.databases.createIfNotExists).toHaveBeenCalledWith({
        id: dbName,
      });
      expect(mockDatabase.containers.createIfNotExists).toHaveBeenCalledTimes(2);
      expect(mockDatabase.containers.createIfNotExists).toHaveBeenCalledWith({
        id: 'users',
        partitionKey: { paths: ['/id'] },
      });
      expect(mockDatabase.containers.createIfNotExists).toHaveBeenCalledWith({
        id: 'sessions',
        partitionKey: { paths: ['/token'] },
      });
    });

    it('should create Cosmos instance without database and containers', async () => {
      const credentials = { endpoint: 'test-endpoint', key: 'test-key' };

      await Cosmos.create(credentials);

      expect(CosmosClient).toHaveBeenCalledWith(credentials);
      expect(mockCosmosClient.databases.createIfNotExists).not.toHaveBeenCalled();
    });
  });

  describe('create operation', () => {
    let cosmos: Cosmos;

    beforeEach(async () => {
      mockCosmosClient.databases.createIfNotExists.mockResolvedValue({
        database: mockDatabase,
      });
      mockDatabase.containers.createIfNotExists.mockResolvedValue({});
      cosmos = await Cosmos.create({}, 'test-db');
    });

    it('should create item in container', async () => {
      const containerName = 'users';
      const item = { id: '123', name: 'Test User' };
      const createdResource = { ...item, _etag: 'test-etag' };

      mockItems.create.mockResolvedValue({ resource: createdResource });

      const result = await cosmos.create(containerName, item);

      expect(mockDatabase.container).toHaveBeenCalledWith(containerName);
      expect(mockItems.create).toHaveBeenCalledWith(item);
      expect(result).toEqual(createdResource);
    });

    it('should throw error when create fails', async () => {
      const containerName = 'users';
      const item = { id: '123', name: 'Test User' };

      mockItems.create.mockRejectedValue(new Error('Creation failed'));

      await expect(cosmos.create(containerName, item)).rejects.toThrow('Creation failed');
    });
  });

  describe('update operation', () => {
    let cosmos: Cosmos;

    beforeEach(async () => {
      mockCosmosClient.databases.createIfNotExists.mockResolvedValue({
        database: mockDatabase,
      });
      mockDatabase.containers.createIfNotExists.mockResolvedValue({});
      cosmos = await Cosmos.create({}, 'test-db');
    });

    it('should update item in container', async () => {
      const containerName = 'users';
      const item = { id: '123', name: 'Updated User' };
      const updatedResource = { ...item, _etag: 'new-etag' };

      mockItems.upsert.mockResolvedValue({ resource: updatedResource });

      const result = await cosmos.update(containerName, item);

      expect(mockDatabase.container).toHaveBeenCalledWith(containerName);
      expect(mockItems.upsert).toHaveBeenCalledWith(item);
      expect(result).toEqual(updatedResource);
    });

    it('should throw error when update fails', async () => {
      const containerName = 'users';
      const item = { id: '123', name: 'Updated User' };

      mockItems.upsert.mockRejectedValue(new Error('Update failed'));

      await expect(cosmos.update(containerName, item)).rejects.toThrow('Update failed');
    });
  });

  describe('findOne operation', () => {
    let cosmos: Cosmos;

    beforeEach(async () => {
      mockCosmosClient.databases.createIfNotExists.mockResolvedValue({
        database: mockDatabase,
      });
      mockDatabase.containers.createIfNotExists.mockResolvedValue({});
      cosmos = await Cosmos.create({}, 'test-db');
    });

    it('should find one item with query', async () => {
      const containerName = 'users';
      const query = "SELECT * FROM c WHERE c.id = '123'";
      const expectedResult = { id: '123', name: 'Test User' };

      const mockQuery = {
        fetchAll: vi.fn().mockResolvedValue({ resources: [expectedResult] }),
      };
      mockItems.query.mockReturnValue(mockQuery);

      const result = await cosmos.findOne(containerName, query);

      expect(mockDatabase.container).toHaveBeenCalledWith(containerName);
      expect(mockItems.query).toHaveBeenCalledWith(query);
      expect(mockQuery.fetchAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should return undefined when no items found', async () => {
      const containerName = 'users';
      const query = "SELECT * FROM c WHERE c.id = '999'";

      const mockQuery = {
        fetchAll: vi.fn().mockResolvedValue({ resources: [] }),
      };
      mockItems.query.mockReturnValue(mockQuery);

      const result = await cosmos.findOne(containerName, query);

      expect(result).toBeUndefined();
    });

    it('should throw error when query fails', async () => {
      const containerName = 'users';
      const query = 'INVALID QUERY';

      const mockQuery = {
        fetchAll: vi.fn().mockRejectedValue(new Error('Query failed')),
      };
      mockItems.query.mockReturnValue(mockQuery);

      await expect(cosmos.findOne(containerName, query)).rejects.toThrow('Query failed');
    });
  });

  describe('findMany operation', () => {
    let cosmos: Cosmos;

    beforeEach(async () => {
      mockCosmosClient.databases.createIfNotExists.mockResolvedValue({
        database: mockDatabase,
      });
      mockDatabase.containers.createIfNotExists.mockResolvedValue({});
      cosmos = await Cosmos.create({}, 'test-db');
    });

    it('should find many items with query', async () => {
      const containerName = 'users';
      const query = 'SELECT * FROM c';
      const expectedResults = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
      ];

      const mockQuery = {
        fetchAll: vi.fn().mockResolvedValue({ resources: expectedResults }),
      };
      mockItems.query.mockReturnValue(mockQuery);

      const result = await cosmos.findMany(containerName, query);

      expect(mockDatabase.container).toHaveBeenCalledWith(containerName);
      expect(mockItems.query).toHaveBeenCalledWith(query);
      expect(mockQuery.fetchAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResults);
    });

    it('should return empty array when no items found', async () => {
      const containerName = 'users';
      const query = 'SELECT * FROM c WHERE c.active = false';

      const mockQuery = {
        fetchAll: vi.fn().mockResolvedValue({ resources: [] }),
      };
      mockItems.query.mockReturnValue(mockQuery);

      const result = await cosmos.findMany(containerName, query);

      expect(result).toEqual([]);
    });
  });

  describe('delete operation', () => {
    let cosmos: Cosmos;

    beforeEach(async () => {
      mockCosmosClient.databases.createIfNotExists.mockResolvedValue({
        database: mockDatabase,
      });
      mockDatabase.containers.createIfNotExists.mockResolvedValue({});
      cosmos = await Cosmos.create({}, 'test-db');
    });

    it('should delete item using id as default partition key', async () => {
      const containerName = 'users';
      const item = { id: '123', name: 'Test User' };

      const mockItem = {
        delete: vi.fn().mockResolvedValue({}),
      };
      mockContainer.item.mockReturnValue(mockItem);

      await cosmos.delete(containerName, item);

      expect(mockDatabase.container).toHaveBeenCalledWith(containerName);
      expect(mockContainer.item).toHaveBeenCalledWith('123', '123');
      expect(mockItem.delete).toHaveBeenCalled();
    });

    it('should delete item using configured partition key field', async () => {
      mockDatabase.containers.createIfNotExists.mockResolvedValue({});
      const cosmosWithPk = await Cosmos.create({}, 'test-db', [{ name: 'sessions', partitionKey: '/token' }]);
      const item = { id: '123', token: 'session-token-abc' };

      const mockItem = {
        delete: vi.fn().mockResolvedValue({}),
      };
      mockContainer.item.mockReturnValue(mockItem);

      await cosmosWithPk.delete('sessions', item);

      expect(mockContainer.item).toHaveBeenCalledWith('123', 'session-token-abc');
      expect(mockItem.delete).toHaveBeenCalled();
    });

    it('should throw error when delete fails', async () => {
      const containerName = 'users';
      const item = { id: '123' };

      const mockItem = {
        delete: vi.fn().mockRejectedValue(new Error('Delete failed')),
      };
      mockContainer.item.mockReturnValue(mockItem);

      await expect(cosmos.delete(containerName, item)).rejects.toThrow('Delete failed');
    });

    it('should refuse to delete when the document is missing its partition key field', async () => {
      const cosmosWithPk = await Cosmos.create({}, 'test-db', [{ name: 'sessions', partitionKey: '/token' }]);
      // Document has no `token` field — deleting by id would target the wrong partition.
      const item = { id: '123' };

      const mockItem = { delete: vi.fn().mockResolvedValue({}) };
      mockContainer.item.mockReturnValue(mockItem);

      await expect(cosmosWithPk.delete('sessions', item)).rejects.toThrow(/missing partition key field "token"/);
      expect(mockItem.delete).not.toHaveBeenCalled();
    });
  });

  describe('count operation', () => {
    let cosmos: Cosmos;

    beforeEach(async () => {
      mockCosmosClient.databases.createIfNotExists.mockResolvedValue({ database: mockDatabase });
      mockDatabase.containers.createIfNotExists.mockResolvedValue({});
      cosmos = await Cosmos.create({}, 'test-db');
    });

    it('should return the count value from a COUNT query', async () => {
      mockItems.query.mockReturnValue({ fetchAll: vi.fn().mockResolvedValue({ resources: [42] }) });

      const result = await cosmos.count('users', 'SELECT VALUE COUNT(1) FROM c');

      expect(result).toBe(42);
    });

    it('should throw when the COUNT query returns no rows', async () => {
      // A SELECT VALUE COUNT(1) always yields one row; an empty result must not
      // be silently reported as a count of 0.
      mockItems.query.mockReturnValue({ fetchAll: vi.fn().mockResolvedValue({ resources: [] }) });

      await expect(cosmos.count('users', 'SELECT VALUE COUNT(1) FROM c')).rejects.toThrow(/returned no rows/);
    });
  });

  describe('ensureContainers', () => {
    let cosmos: Cosmos;

    beforeEach(async () => {
      mockCosmosClient.databases.createIfNotExists.mockResolvedValue({ database: mockDatabase });
      mockDatabase.containers.createIfNotExists.mockResolvedValue({});
      cosmos = await Cosmos.create({}, 'test-db');
      mockDatabase.containers.createIfNotExists.mockClear();
    });

    it('creates each container only once across repeated calls', async () => {
      await cosmos.ensureContainers([{ name: 'users' }, { name: 'sessions', partitionKey: '/token' }]);
      await cosmos.ensureContainers([{ name: 'users' }, { name: 'sessions', partitionKey: '/token' }]);

      expect(mockDatabase.containers.createIfNotExists).toHaveBeenCalledTimes(2);
    });

    it('rejects an invalid partition key path', async () => {
      await expect(cosmos.ensureContainers([{ name: 'users', partitionKey: 'id' }])).rejects.toThrow(/Invalid partition key path/);
    });

    it('retries creation after a transient failure instead of caching the rejection', async () => {
      mockDatabase.containers.createIfNotExists.mockRejectedValueOnce(new Error('throttled')).mockResolvedValueOnce({});

      await expect(cosmos.ensureContainers([{ name: 'users' }])).rejects.toThrow('throttled');
      // Second call must re-attempt creation rather than replay the cached rejection.
      await expect(cosmos.ensureContainers([{ name: 'users' }])).resolves.toBeUndefined();
      expect(mockDatabase.containers.createIfNotExists).toHaveBeenCalledTimes(2);
    });
  });
});
