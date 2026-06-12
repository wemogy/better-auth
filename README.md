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

Better Auth ships a broad first-party plugin catalog. The [official plugin docs](https://better-auth.com/docs/plugins) currently group plugins into authentication, authorization and management, API and tokens, OAuth/OIDC providers, payments and billing, security and utilities, and analytics.

This adapter should only claim support for plugins whose persistence model is provisioned and tested in this repository.

### Supported Now

| Better Auth feature          | Status                             | Cosmos DB containers                                         |
| ---------------------------- | ---------------------------------- | ------------------------------------------------------------ |
| Core Better Auth persistence | Supported                          | `user`, `session`, `verification`, `account`                 |
| Email and password           | Supported through core persistence | Uses core user/account records; enabled in the demo app.     |
| Organization                 | Supported at container level       | `organization`, `member`, `team`, `invitation`, `teamMember` |
| Two-Factor Authentication    | Supported at container level       | `twoFactor`                                                  |

`usePlural: true` pluralizes the container names, for example `users`, `sessions`, `organizations`, and `twoFactors`.

### Not Yet Claimed As Supported

These Better Auth first-party plugins exist in the upstream plugin catalog, but this repository does not yet provide explicit support documentation or dedicated compatibility tests for them:

| Category                     | Plugins                                                                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication               | Passkey, Magic Link, Email OTP, Phone Number, Anonymous, Username, One Tap, Sign In With Ethereum, Generic OAuth, Multi Session, Last Login Method |
| Authorization and Management | Admin, SSO, SCIM                                                                                                                                   |
| API and Tokens               | Agent Auth, API Key, JWT, Bearer, One-Time Token, OAuth Proxy                                                                                      |
| OAuth and OIDC Providers     | OAuth 2.1 Provider, OIDC Provider, MCP, Device Authorization                                                                                       |
| Payments and Billing         | Stripe, Polar, Autumn Billing, Creem, Dodo Payments, Commet                                                                                        |
| Security and Utilities       | Captcha, Have I Been Pwned, i18n, Open API, Test Utils                                                                                             |
| Analytics and Tracking       | Dub                                                                                                                                                |

Some plugins may work without new containers because they only add fields, endpoints, or secondary-storage behavior. Treat them as unvalidated until this repository adds plugin-specific tests and documentation.

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

UNLICENSED © wemogy
