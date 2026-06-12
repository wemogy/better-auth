# Getting Started

Use this guide to install `@wemogy/better-auth-cosmos` and wire it into a Better Auth server configuration.

## Requirements

- Node.js 20 or newer.
- A Better Auth project.
- An Azure Cosmos DB account with permission to create databases and containers.
- Cosmos DB endpoint and key.

## Installation

In an application outside this monorepo:

```bash
pnpm add better-auth @wemogy/better-auth-cosmos
```

Inside this monorepo the demo app consumes the package through the workspace:

```json
{
  "dependencies": {
    "@wemogy/better-auth-cosmos": "workspace:*"
  }
}
```

## Environment Variables

Use these names for the package README examples:

```bash
COSMOS_DB_ENDPOINT="https://<your-account>.documents.azure.com:443/"
COSMOS_DB_KEY="<cosmos-key>"
COSMOS_DB_NAME="better-auth"
BETTER_AUTH_SECRET="<32-byte-or-longer-secret>"
BETTER_AUTH_URL="http://localhost:3000"
```

The demo app also accepts `COSMOS_ENDPOINT` and `COSMOS_KEY` as aliases.

## Server Configuration

Create an async auth initializer because `buildCosmosAdapter` creates the Cosmos database and containers before returning the Better Auth adapter factory.

```ts
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
      endpoint: process.env.COSMOS_DB_ENDPOINT!,
      key: process.env.COSMOS_DB_KEY!,
    },
    dbName: process.env.COSMOS_DB_NAME ?? 'better-auth',
    debugLogs: process.env.NODE_ENV !== 'production',
    usePlural: true,
  });

  authInstance = betterAuth({
    database: adapter,
    emailAndPassword: {
      enabled: true,
    },
  });

  return authInstance;
}
```

## Next.js Route Handler

For a Next.js App Router API route, resolve the async auth instance inside each handler:

```ts
import { getAuth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export async function GET(request: Request) {
  const auth = await getAuth();
  return toNextJsHandler(auth.handler).GET(request);
}

export async function POST(request: Request) {
  const auth = await getAuth();
  return toNextJsHandler(auth.handler).POST(request);
}
```

## First Run

On startup, the adapter calls Cosmos DB `createIfNotExists` for the configured database and the known Better Auth containers. No separate migration command is required for the current adapter implementation.
