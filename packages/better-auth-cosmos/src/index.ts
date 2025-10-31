import { CosmosClientOptions } from '@azure/cosmos';
import { createAdapterFactory } from 'better-auth/adapters';
import { Cosmos } from './cosmos';
import { queryBuilder } from './util/queryBuilder';

interface CosmosAdapterConfig {
  adapterId: string;
  adapterName: string;
  dbCredentials: CosmosClientOptions;
  dbName: string;
  debugLogs?: boolean | Record<string, boolean>;
  usePlural?: boolean;
}

export const buildCosmosAdapter = async (config: CosmosAdapterConfig) => {
  const { adapterId, adapterName, dbCredentials, dbName, debugLogs = false, usePlural = false } = config;

  const cosmos = await Cosmos.create(dbCredentials, dbName, ['users', 'sessions', 'verifications', 'accounts']);

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
    adapter: () => {
      return {
        create: async ({ model, data }) => {
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
