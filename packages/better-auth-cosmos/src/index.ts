import { CosmosClientOptions } from '@azure/cosmos';
import { createAdapterFactory, type DBAdapterDebugLogOption } from 'better-auth/adapters';
import { Cosmos } from './cosmos';
import { queryBuilder } from './util/queryBuilder';

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

      return {
        create: async ({ model, data, select: _select }) => {
          void _select;
          return await cosmos.create(getModelName(model), data);
        },
        update: async ({ model, where, update }) => {
          const existingItem = await cosmos.findOne(getModelName(model), queryBuilder({ where }));
          const updatedItem = { ...(existingItem || {}), ...update };
          return (await cosmos.update(getModelName(model), updatedItem)) as typeof update;
        },
        updateMany: async ({ model, where, update }) => {
          const existingItems = await cosmos.findMany(getModelName(model), queryBuilder({ where }));
          const updated = await Promise.all(
            existingItems.map(item => {
              const updatedItem = { ...(item || {}), ...update };
              return cosmos.update(getModelName(model), updatedItem);
            }),
          );
          return updated.length;
        },
        delete: async ({ model, where }) => {
          const existingItem = await cosmos.findOne(getModelName(model), queryBuilder({ where }));
          if (existingItem) {
            await cosmos.delete(getModelName(model), existingItem.id);
          }
        },
        deleteMany: async ({ model, where }) => {
          const existingItems = await cosmos.findMany(getModelName(model), queryBuilder({ where }));
          const updated = await Promise.all(existingItems.map(item => cosmos.delete(getModelName(model), item.id)));
          return updated.length;
        },
        findOne: async ({ model, select, where }) => {
          const existingItem = await cosmos.findOne(getModelName(model), queryBuilder({ select, where }));
          return existingItem;
        },
        findMany: async ({ model, where, sortBy, offset, limit }) => {
          const existingItems = await cosmos.findMany(getModelName(model), queryBuilder({ where, sortBy, offset, limit }));
          return existingItems;
        },
        count: async ({ model, where }) => {
          const existingItems = await cosmos.findMany(getModelName(model), queryBuilder({ where }));
          return existingItems.length;
        },
      };
    },
  });
};
