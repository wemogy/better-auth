# @wemogy/better-auth-cosmos

`@wemogy/better-auth-cosmos` is the Cosmos DB database adapter for Better Auth in this monorepo. It connects Better Auth's persistence layer to Azure Cosmos DB and includes a Next.js demo app that exercises email/password authentication against Cosmos-backed storage.

## Wiki Pages

- [Getting Started](Getting-Started)
- [Adapter Configuration](Adapter-Configuration)
- [Data Model and Containers](Data-Model-and-Containers)
- [Next.js Demo App](Nextjs-Demo-App)
- [Development and Testing](Development-and-Testing)
- [Release Process](Release-Process)
- [Wiki Sync](Wiki-Sync)

## Repository Layout

| Path                          | Purpose                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `packages/better-auth-cosmos` | Published package with the Cosmos DB adapter implementation.            |
| `apps/demo-app`               | Next.js demo using Better Auth and the local workspace adapter package. |
| `.github/workflows`           | CI, release, and wiki sync workflows.                                   |
| `docs/wiki`                   | Source files for this GitHub Wiki.                                      |

## Main Package

The adapter package exports `buildCosmosAdapter`, an async factory used as the `database` option in `betterAuth`.

```ts
import { betterAuth } from 'better-auth';
import { buildCosmosAdapter } from '@wemogy/better-auth-cosmos';

const adapter = await buildCosmosAdapter({
  adapterId: 'cosmos',
  adapterName: 'CosmosDB Adapter',
  dbCredentials: {
    endpoint: process.env.COSMOS_DB_ENDPOINT!,
    key: process.env.COSMOS_DB_KEY!,
  },
  dbName: process.env.COSMOS_DB_NAME!,
  usePlural: true,
});

export const auth = betterAuth({
  database: adapter,
});
```

Start with [Getting Started](Getting-Started) for installation and environment setup.
