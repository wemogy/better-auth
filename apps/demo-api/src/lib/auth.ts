import { betterAuth } from 'better-auth';
import { buildCosmosAdapter } from 'better-auth-cosmos';
import 'dotenv/config';

export const createAuth = async () => {
  const adapter = await buildCosmosAdapter({
    adapterId: 'cosmos',
    adapterName: 'CosmosDB Adapter',
    dbCredentials: {
      endpoint: process.env.COSMOS_ENDPOINT || 'https://your-cosmos-account.documents.azure.com:443/',
      key: process.env.COSMOS_KEY || 'your-cosmos-key',
    },
    dbName: process.env.COSMOS_DB_NAME || 'better-auth-demo',
    debugLogs: false,
    usePlural: true,
  });

  return betterAuth({
    database: adapter,
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
  });
};
