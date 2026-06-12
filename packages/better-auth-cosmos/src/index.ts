import { CosmosClientOptions } from '@azure/cosmos';
import type { BetterAuthOptions } from 'better-auth';
import { createAdapterFactory, type AdapterFactory, type DBAdapterDebugLogOption, type CustomAdapter } from 'better-auth/adapters';
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
   * Partition key path per model (e.g. `{ session: '/userId' }`).
   * Overrides the built-in defaults, which are chosen to match
   * Better Auth's hottest lookup per container.
   */
  partitionKeys?: Record<string, string>;
}

/**
 * Default partition key per container, aligned with the most frequent
 * Better Auth query against it (session by token on every request,
 * verification by identifier, account/twoFactor by userId, org-scoped
 * models by organizationId, ...). Falls back to '/id'.
 */
const defaultPartitionKeys: Record<string, string> = {
  user: '/id',
  session: '/token',
  verification: '/identifier',
  account: '/userId',
  organization: '/id',
  member: '/organizationId',
  team: '/organizationId',
  invitation: '/organizationId',
  teamMember: '/teamId',
  twoFactor: '/userId',
};

export const buildCosmosAdapter = async (config: CosmosAdapterConfig): Promise<AdapterFactory<BetterAuthOptions>> => {
  const { adapterId, adapterName, dbCredentials, dbName, debugLogs = false, usePlural = false, partitionKeys } = config;

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
  const containers = baseContainerNames.map(name => ({
    name,
    partitionKey: partitionKeys?.[name] ?? defaultPartitionKeys[name] ?? '/id',
  }));
  const cosmos = await Cosmos.create(dbCredentials, dbName, containers, usePlural);

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
      void getFieldAttributes;

      return new CosmosAdapter(cosmos, getModelName, getFieldName) as CustomAdapter;
    },
  });
};
