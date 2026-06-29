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

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('BETTER_AUTH_SECRET must be set in production. Better Auth would otherwise fall back to an insecure built-in secret.');
  }

  const instance = betterAuth({
    database: adapter,
    secret,
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
    baseURL: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000',
    basePath: '/api/auth',
  }) as unknown as ReturnType<typeof betterAuth>;

  authInstance = instance;
  return instance;
}
