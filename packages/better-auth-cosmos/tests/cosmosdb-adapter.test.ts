import { expect, test, describe } from 'vitest';
import { runAdapterTest } from 'better-auth/adapters/test';
import { buildCosmosAdapter } from '../src';

describe('My Adapter Tests', async () => {
  //   afterAll(async () => {
  //     // Run DB cleanup here...ß
  //   });
  const adapter = await buildCosmosAdapter({
    adapterId: 'cosmos-adapter',
    adapterName: 'Cosmos Adapter',
    dbCredentials: {
      connectionString: process.env.COSMOS_DB!,
    },
    dbName: process.env.COSMOS_DB_NAME || 'better-auth',
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
