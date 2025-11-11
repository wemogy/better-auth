import { CosmosClientOptions } from '@azure/cosmos';
import { createAdapterFactory, type DBAdapterDebugLogOption, type CleanedWhere, type Where } from 'better-auth/adapters';
import { Cosmos } from './cosmos';
import { CosmosAdapter } from './cosmosAdapter';
export { CosmosAdapter };

interface CosmosAdapterConfig {
  /**
   * A unique identifier for the adapter.
   */
  adapterId: string;
  /**
   * The name of the adapter.
   */
  adapterName: string;
  /**
   * Helps you debug issues with the adapter.
   */
  debugLogs?: DBAdapterDebugLogOption;
  /**
   * If the table names in the schema are plural.
   */
  usePlural?: boolean;
  /**
   * Cosmos DB credentials
   */
  dbCredentials: CosmosClientOptions;
  /**
   * Database name
   */
  dbName: string;
  /**
   * Tenant ID for multi-tenancy
   */
  tenantId?: string;
}

export const buildCosmosAdapter = async (config: CosmosAdapterConfig) => {
  const { adapterId, adapterName, dbCredentials, dbName, debugLogs = false, usePlural = false, tenantId } = config;

  // Create Cosmos instance with known tables including plugin tables
  const baseContainerNames = [
    'user',
    'session',
    'verification',
    'account',
    'organization',
    'member',
    'team',
    'invitation',
    'teamMember',
    'twoFactor',
    'tenant', // Multi-Tenancy plugin
  ];
  const cosmos = await Cosmos.create(dbCredentials, dbName, baseContainerNames, usePlural);

  return createAdapterFactory({
    config: {
      adapterId,
      adapterName,
      usePlural,
      debugLogs,
      supportsJSON: true,
      supportsDates: false,
      supportsBooleans: true,
      supportsNumericIds: false,
    },

    adapter: ({ options: _options, schema, debugLog, getModelName, getFieldName, getFieldAttributes }) => {
      // Mark parameters as intentionally unused to match Better Auth adapter signature
      void _options;
      void schema;
      void debugLog;
      void getFieldName;
      void getFieldAttributes;

      // Return adapter methods that dynamically get tenantId at runtime
      return {
        create: async <T>(params: { model: string; data: T; select?: string[]; tenantId?: string }) => {
          const adapterInstance = new CosmosAdapter(cosmos, getModelName, params.tenantId || tenantId);
          return adapterInstance.create({ ...params, data: params.data as Record<string, unknown> }) as Promise<T & { id: string }>;
        },
        update: async <T>(data: { model: string; where: Required<Where>[]; update: T; tenantId?: string }) => {
          const adapterInstance = new CosmosAdapter(cosmos, getModelName, data.tenantId || tenantId);
          return adapterInstance.update({
            ...data,
            where: data.where as CleanedWhere[],
            update: data.update as Record<string, unknown>,
          }) as Promise<T | null>;
        },
        updateMany: async (params: { model: string; where: CleanedWhere[]; update: Record<string, unknown>; tenantId?: string }) => {
          const adapterInstance = new CosmosAdapter(cosmos, getModelName, params.tenantId || tenantId);
          return adapterInstance.updateMany(params);
        },
        delete: async (params: { model: string; where: CleanedWhere[]; tenantId?: string }) => {
          const adapterInstance = new CosmosAdapter(cosmos, getModelName, params.tenantId || tenantId);
          return adapterInstance.delete(params);
        },
        deleteMany: async (params: { model: string; where: CleanedWhere[]; tenantId?: string }) => {
          const adapterInstance = new CosmosAdapter(cosmos, getModelName, params.tenantId || tenantId);
          return adapterInstance.deleteMany(params);
        },
        findOne: async (params: { model: string; select?: string[]; where: CleanedWhere[]; tenantId?: string }) => {
          console.log('findOne', params);
          console.log('tenantId', params.tenantId);
          const adapterInstance = new CosmosAdapter(cosmos, getModelName, params.tenantId || tenantId);
          return adapterInstance.findOne(params);
        },
        findMany: async (params: {
          model: string;
          where?: CleanedWhere[];
          sortBy?: { field: string; direction: 'asc' | 'desc' };
          offset?: number;
          limit?: number;
          tenantId?: string;
        }) => {
          const adapterInstance = new CosmosAdapter(cosmos, getModelName, params.tenantId || tenantId);
          return adapterInstance.findMany(params);
        },
        count: async (params: { model: string; where?: CleanedWhere[]; tenantId?: string }) => {
          const adapterInstance = new CosmosAdapter(cosmos, getModelName, params.tenantId || tenantId);
          return adapterInstance.count(params);
        },
      };
    },
  });
};
