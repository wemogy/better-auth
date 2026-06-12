import { betterAuth } from 'better-auth';
import { buildCosmosAdapter } from '@wemogy/better-auth-cosmos';

let authInstance: ReturnType<typeof betterAuth> | null = null;

export async function getAuth() {
  if (authInstance) {
    return authInstance;
  }

  const adapter = await buildCosmosAdapter({
    adapterId: 'cosmos',
    adapterName: 'CosmosDB Adapter',
    dbCredentials: {
      endpoint: process.env.COSMOS_ENDPOINT || process.env.COSMOS_DB_ENDPOINT || 'https://your-cosmos-account.documents.azure.com:443/',
      key: process.env.COSMOS_KEY || process.env.COSMOS_DB_KEY || 'your-cosmos-key',
    },
    dbName: process.env.COSMOS_DB_NAME || 'better-auth-demo',
    debugLogs: false,
    usePlural: true,
  });

  const instance = betterAuth({
    database: adapter,
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
    baseURL: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000',
    basePath: '/api/auth',
  }) as ReturnType<typeof betterAuth>;

  authInstance = instance;
  return instance;
}
