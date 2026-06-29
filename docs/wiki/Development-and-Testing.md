# Development and Testing

Use this page for local repository work.

## Prerequisites

- Node.js 20 or newer.
- pnpm 10.18.3, as pinned in the root `packageManager` field.
- Azure Cosmos DB credentials for manual integration testing or running the demo app against a real database.

## Install Dependencies

```bash
pnpm install
```

## Common Commands

Run commands from the repository root:

```bash
pnpm build
pnpm lint:check
pnpm typecheck
pnpm format:check
pnpm test
```

Package-scoped commands:

```bash
pnpm --filter @wemogy/better-auth-cosmos build
pnpm --filter @wemogy/better-auth-cosmos test
pnpm --filter demo-app dev
```

## Test Coverage

The adapter package includes tests for:

- Cosmos database and container creation.
- CRUD operations against the Cosmos wrapper.
- Better Auth adapter compatibility through `@better-auth/test-utils`.
- Query builder output for where clauses, sorting, selection, offset, and limit.
- Error propagation from Cosmos client failures.

The adapter compatibility suite does not need a real Cosmos DB account because the Azure Cosmos SDK is mocked in tests.

## Formatting

Use the root formatter so docs, YAML, and package files are checked consistently:

```bash
pnpm format:check
pnpm format
```

## Adding Adapter Behavior

When changing adapter behavior:

- Update the implementation in `packages/better-auth-cosmos/src`.
- Add or update tests under `packages/better-auth-cosmos/tests`.
- Update the relevant wiki page under `docs/wiki`.
- Run at least `pnpm --filter @wemogy/better-auth-cosmos test` and `pnpm format:check`.
