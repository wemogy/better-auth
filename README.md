# @wemogy/better-auth-cosmos Monorepo

This repository contains the official wemogy tooling around the Azure Cosmos DB adapter for [better-auth](https://github.com/iway1/better-auth). It includes the adapter package itself together with demo applications that showcase how to integrate it in real projects.

Maintained by **wemogy**.

## Packages
- `packages/better-auth-cosmos` – Published as `@wemogy/better-auth-cosmos`. Provides the Cosmos DB adapter consumed by better-auth. See the package-level [README](packages/better-auth-cosmos/README.md) for detailed usage instructions.

## Applications
- `apps/demo-api` – Hono-based API that demonstrates how to expose better-auth endpoints backed by Cosmos DB.
- `apps/demo` – React single-page application that interacts with the demo API to exercise the authentication flows.

## Getting Started

Prerequisites:
- Node.js 20 or newer
- [pnpm](https://pnpm.io/) (the repo is configured with a workspace)

Installation:

```bash
pnpm install
```

Useful workspace commands:

```bash
pnpm dev          # Runs all development servers through Turborepo
pnpm build        # Builds every package and app
pnpm lint         # Executes the aggregated lint tasks
pnpm format       # Formats the codebase with Prettier
```

Scope a command to a single project with `pnpm --filter`, for example:

```bash
pnpm --filter demo-api dev
pnpm --filter demo dev
pnpm --filter @wemogy/better-auth-cosmos test
```

## Local Development

Both the adapter and the demos expect a Cosmos DB instance. Provide credentials using environment variables:

```bash
COSMOS_DB_ENDPOINT="https://<your-account>.documents.azure.com:443/"
COSMOS_DB_KEY="<secret>"
COSMOS_DB_NAME="better-auth"
```

- For the API demo, create a `.env` file in `apps/demo-api` with these variables before starting `pnpm --filter demo-api dev`.
- The React demo (`apps/demo`) assumes the API is running on `http://localhost:8787` by default; adjust the client configuration if you change the API port.

## Release Process

Releases are automated via GitHub Actions:
- Push changes to the `release` branch.
- The workflow calculates the next semantic version, updates all workspace packages, publishes them to GitHub Packages, and creates a GitHub release tagged with the new version.

## Contributing

We welcome improvements, bug fixes, and new examples. Please fork the repository, open a feature branch, and submit a pull request. Ensure `pnpm build` and the relevant project-specific tests pass before requesting review.

## License

MIT © wemogy
