import { CosmosClientOptions } from '@azure/cosmos';
import { createAdapterFactory, type DBAdapterDebugLogOption, type CustomAdapter } from 'better-auth/adapters';
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
}

export const cosmosEnvironment: {
  getModelName: (model: string) => string;
  cosmos: Cosmos;
} = {
  getModelName: () => {
    throw new Error('getModelName function not initialized');
  },
  cosmos: null as unknown as Cosmos,
};

export const buildCosmosAdapter = async (config: CosmosAdapterConfig) => {
  const { adapterId, adapterName, dbCredentials, dbName, debugLogs = false, usePlural = false } = config;

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

      cosmosEnvironment.getModelName = getModelName;
      cosmosEnvironment.cosmos = cosmos;

      return new CosmosAdapter(cosmos, getModelName) as CustomAdapter;
    },
  });
};
