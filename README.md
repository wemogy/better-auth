# @wemogy/better-auth-cosmos

This repository contains the wemogy Azure Cosmos DB adapter for [Better Auth](https://better-auth.com). The package lets Better Auth persist users, sessions, accounts, verification records, and selected plugin data in Azure Cosmos DB.

Maintained by **wemogy**.

## Repository Contents

| Path                          | Description                                                        |
| ----------------------------- | ------------------------------------------------------------------ |
| `packages/better-auth-cosmos` | Published package for the Cosmos DB adapter.                       |
| `apps/demo-app`               | Next.js demo app using Better Auth with the local adapter package. |
| `docs/wiki`                   | Source files for the GitHub Wiki.                                  |
| `.github/workflows`           | Pull request checks, release automation, and wiki sync.            |

## Package

`@wemogy/better-auth-cosmos` exports `buildCosmosAdapter`, an async adapter factory for Better Auth.

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
  dbName: process.env.COSMOS_DB_NAME ?? 'better-auth',
  debugLogs: process.env.NODE_ENV !== 'production',
  usePlural: true,
});

export const auth = betterAuth({
  database: adapter,
  emailAndPassword: {
    enabled: true,
  },
});
```

## Getting Started

Prerequisites:

- Node.js 20 or newer.
- pnpm 10.18.3 or newer.
- Azure Cosmos DB account credentials.

Install dependencies:

```bash
pnpm install
```

Set Cosmos DB environment variables:

```bash
COSMOS_DB_ENDPOINT="https://<your-account>.documents.azure.com:443/"
COSMOS_DB_KEY="<cosmos-key>"
COSMOS_DB_NAME="better-auth"
```

Run the demo app:

```bash
pnpm --filter demo-app dev
```

Run adapter tests:

```bash
pnpm --filter @wemogy/better-auth-cosmos test
```

## Better Auth Plugin Support

The adapter derives its Cosmos DB containers from the Better Auth schema at runtime. The schema contains exactly the models required by the active plugins, so any plugin that stores data through the Better Auth database layer gets its containers created automatically — including third-party plugins the adapter has never seen.

- Models the adapter knows get an optimized partition key (for example `session` is partitioned by `/token`, the lookup performed on every authenticated request).
- Unknown plugin models fall back to `/id` as the partition key. Override per model through the `partitionKeys` config option.
- Containers are created lazily with `createIfNotExists` when the adapter is initialized; nothing is provisioned for plugins that are not active.

`usePlural: true` pluralizes the container names, for example `users`, `sessions`, `organizations`, and `twoFactors`.

Verified end-to-end against a real Cosmos DB account: core persistence (email/password sign-up, sign-in, session lookup, sign-out) plus container provisioning for the Two-Factor and OIDC Provider plugins. Plugins beyond that are expected to work through the schema-driven mechanism but have no dedicated compatibility tests in this repository yet.

## Development Commands

```bash
pnpm build          # Build all workspace projects through Turborepo
pnpm lint:check     # Run lint checks
pnpm typecheck      # Run TypeScript checks
pnpm format:check   # Check formatting
pnpm test           # Run adapter tests
```

Scope commands with `pnpm --filter`:

```bash
pnpm --filter @wemogy/better-auth-cosmos build
pnpm --filter @wemogy/better-auth-cosmos test
pnpm --filter demo-app dev
```

## Documentation

Repository documentation lives in `docs/wiki` and is synced to the GitHub Wiki by `.github/workflows/sync-wiki.yaml`.

Start with:

- [Getting Started](docs/wiki/Getting-Started.md)
- [Adapter Configuration](docs/wiki/Adapter-Configuration.md)
- [Data Model and Containers](docs/wiki/Data-Model-and-Containers.md)
- [Development and Testing](docs/wiki/Development-and-Testing.md)

## Release Process

Releases are automated through GitHub Actions:

- Push changes to the `release` branch.
- The workflow calculates the next semantic version.
- Workspace package versions are updated.
- Packages are built and published to GitHub Packages.
- A GitHub release is created for the generated tag.

## License

MIT License
Copyright (c) 2026 wemogy
