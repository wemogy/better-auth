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

  const cosmos = await Cosmos.create(dbCredentials, dbName);

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
      void debugLog;
      void getFieldAttributes;

      // Derive containers from the schema, which contains exactly the models
      // required by the active better-auth plugins (including third-party ones).
      const containers = Object.keys(schema).map(model => ({
        name: getModelName(model),
        partitionKey: partitionKeys?.[model] ?? defaultPartitionKeys[model] ?? '/id',
      }));
      const ready = cosmos.ensureContainers(containers);
      // Container creation failures surface on the first adapter operation;
      // this guard only prevents an unhandled rejection before that point.
      ready.catch(() => undefined);

      // Whitelist of physical field names per model, used to reject unknown
      // identifiers before they are interpolated into Cosmos SQL.
      const validFields: Record<string, ReadonlySet<string>> = {};
      for (const [model, definition] of Object.entries(schema)) {
        const fields = new Set<string>(['id']);
        for (const field of Object.keys(definition.fields)) {
          fields.add(getFieldName({ model, field }));
        }
        validFields[model] = fields;
      }

      return new CosmosAdapter(cosmos, getModelName, getFieldName, validFields, ready) as CustomAdapter;
    },
  });
};
