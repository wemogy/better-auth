import { CosmosClient } from '@azure/cosmos';
import { runAdapterTest } from 'better-auth/adapters/test';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import { buildCosmosAdapter } from '../src';

// Mock the @azure/cosmos module
vi.mock('@azure/cosmos', () => {
  const MockCosmosClient = class {
    databases: any;
    constructor() {
      this.databases = {
        createIfNotExists: vi.fn().mockResolvedValue({
          database: {
            container: vi.fn().mockReturnValue({
              items: {
                create: vi.fn().mockResolvedValue({ resource: {} }),
                upsert: vi.fn().mockResolvedValue({ resource: {} }),
                query: vi.fn().mockReturnValue({
                  fetchAll: vi.fn().mockResolvedValue({ resources: [] }),
                }),
                item: vi.fn().mockReturnValue({
                  delete: vi.fn().mockResolvedValue({}),
                }),
              },
            }),
            containers: {
              createIfNotExists: vi.fn().mockResolvedValue({}),
            },
          },
        }),
      };
    }
  };

  return {
    CosmosClient: MockCosmosClient,
  };
});

describe('My Adapter Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should run adapter tests', async () => {
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

    await runAdapterTest({
      getAdapter: async (betterAuthOptions = {}) => {
        return adapter(betterAuthOptions);
      },
    });
  });
});
