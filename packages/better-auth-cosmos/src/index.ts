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

  const cosmos = await Cosmos.create(dbCredentials, dbName, [
    'users',
    'sessions',
    'verifications',
    'accounts',
    'organizations',
    'members',
    'teams',
    'invitations',
    'teamMembers',
    'twoFactor',
  ]);

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

    adapter: ({
      options: _options,
      schema: _schema,
      debugLog: _debugLog,
      getModelName: _getModelName,
      getFieldName: _getFieldName,
      getFieldAttributes: _getFieldAttributes,
    }) => {
      // Mark parameters as intentionally unused to match Better Auth adapter signature
      void _options;
      void _schema;
      void _debugLog;
      void _getModelName;
      void _getFieldName;
      void _getFieldAttributes;

      return {
        create: async ({ model, data, select: _select }) => {
          void _select;
          return await cosmos.create(model, data);
        },
        update: async ({ model, where, update }) => {
          const existingItem = await cosmos.findOne(model, queryBuilder({ where }));
          const updatedItem = { ...(existingItem || {}), ...update };
          return (await cosmos.update(model, updatedItem)) as typeof update;
        },
        updateMany: async ({ model, where, update }) => {
          const existingItems = await cosmos.findMany(model, queryBuilder({ where }));
          const updated = await Promise.all(
            existingItems.map(item => {
              const updatedItem = { ...(item || {}), ...update };
              return cosmos.update(model, updatedItem);
            }),
          );
          return updated.length;
        },
        delete: async ({ model, where }) => {
          const existingItem = await cosmos.findOne(model, queryBuilder({ where }));
          if (existingItem) {
            await cosmos.delete(model, existingItem.id);
          }
        },
        deleteMany: async ({ model, where }) => {
          const existingItems = await cosmos.findMany(model, queryBuilder({ where }));
          const updated = await Promise.all(existingItems.map(item => cosmos.delete(model, item.id)));
          return updated.length;
        },
        findOne: async ({ model, select, where }) => {
          const existingItem = await cosmos.findOne(model, queryBuilder({ select, where }));
          return existingItem;
        },
        findMany: async ({ model, where, sortBy, offset, limit }) => {
          const existingItems = await cosmos.findMany(model, queryBuilder({ where, sortBy, offset, limit }));
          return existingItems;
        },
        count: async ({ model, where }) => {
          const existingItems = await cosmos.findMany(model, queryBuilder({ where }));
          return existingItems.length;
        },
      };
    },
  });
};
