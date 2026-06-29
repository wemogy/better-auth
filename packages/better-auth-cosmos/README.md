# @wemogy/better-auth-cosmos

`@wemogy/better-auth-cosmos` is a production-ready adapter that connects **better-auth** to Azure Cosmos DB. Containers are derived from the better-auth schema at runtime, so the core models and any active plugin models are provisioned automatically with query-optimized partition keys.

Maintained by **wemogy**.

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

- Native integration with Azure Cosmos DB including automatic container naming
- Containers derived from the better-auth schema: active plugins (including third-party ones) get their containers created automatically
- Query-optimized partition keys per model (e.g. sessions by `/token`), overridable via `partitionKeys`
- Parameterized Cosmos SQL queries
- Optional debug logging to aid local development and acceptance testing

## Requirements

- Node.js 20 or later
- Access to an Azure Cosmos DB account with permission to manage databases and containers
- better-auth ^1.3.33 or later
- An existing better-auth configuration

## Installation

Install the package using your package manager of choice:

```bash
npm install @wemogy/better-auth-cosmos
# or
pnpm add @wemogy/better-auth-cosmos
# or
yarn add @wemogy/better-auth-cosmos
```

## Quick Start

```typescript
import { betterAuth } from 'better-auth';
import { buildCosmosAdapter } from '@wemogy/better-auth-cosmos';

export const createAuth = async () => {
  const cosmosAdapter = await buildCosmosAdapter({
    adapterId: 'cosmos',
    adapterName: 'Cosmos Adapter',
    dbCredentials: {
      endpoint: process.env.COSMOS_DB_ENDPOINT!,
      key: process.env.COSMOS_DB_KEY!,
    },
    dbName: process.env.COSMOS_DB_NAME ?? 'better-auth',
    debugLogs: process.env.NODE_ENV !== 'production',
    usePlural: false,
  });

  return betterAuth({
    database: cosmosAdapter,
  });
};
```

### Environment variables

```bash
COSMOS_DB_ENDPOINT="https://<your-account>.documents.azure.com:443/"
COSMOS_DB_KEY="<secret>"
COSMOS_DB_NAME="better-auth"
```

## Configuration

`buildCosmosAdapter` accepts the following options:

| Option          | Type                      | Default      | Description                                                                                     |
| --------------- | ------------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `adapterId`     | `string`                  | **required** | Identifier used by better-auth to track the adapter instance.                                   |
| `adapterName`   | `string`                  | **required** | Friendly name used in logs and debugging.                                                       |
| `dbCredentials` | `CosmosClientOptions`     | **required** | Credentials and configuration passed to the underlying `CosmosClient` (e.g. `endpoint`, `key`). |
| `dbName`        | `string`                  | **required** | Name of the Cosmos DB database where containers will be created.                                |
| `debugLogs`     | `DBAdapterDebugLogOption` | `false`      | Enables verbose logging. Useful in development environments only.                               |
| `usePlural`     | `boolean`                 | `false`      | Whether to pluralize container names (e.g. `users` instead of `user`).                          |
| `partitionKeys` | `Record<string, string>`  | None         | Partition key path per model (e.g. `{ session: '/userId' }`), overriding the built-in defaults. |

The database is created on startup; containers are created lazily from the better-auth schema when the adapter initializes, so only the models required by your active plugins are provisioned. Known models get optimized partition keys (`session` → `/token`, `verification` → `/identifier`, `account`/`twoFactor` → `/userId`, organization-scoped models → `/organizationId`); unknown plugin models default to `/id`. Note that partition keys are immutable on existing containers.

## Troubleshooting

- **Initialization fails with 401 Unauthorized:** Confirm that the configured `endpoint` and `key` belong to the same Cosmos DB account and that the key has data plane permissions.
- **Missing collections:** Ensure the configured database exists and the account has unlimited container throughput or the necessary RU/s reserved.
- **Debug logs missing:** Set `debugLogs: true` explicitly or run with `NODE_ENV=development`.

## Contributing

We welcome improvements and bug fixes. To contribute:

1. Fork the repository and create a branch.
2. Install dependencies with `pnpm install` from the root.
3. Run the tests via `npm test` in the `packages/better-auth-cosmos` directory. For integration tests, provide a Cosmos DB instance.
4. Submit a pull request describing your changes.

## License

UNLICENSED © wemogy
