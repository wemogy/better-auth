# Adapter Configuration

`buildCosmosAdapter` accepts a single configuration object and returns a Better Auth adapter factory.

## Options

| Option          | Type                      | Required | Default | Notes                                                                              |
| --------------- | ------------------------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `adapterId`     | `string`                  | Yes      | None    | Unique adapter identifier passed to Better Auth.                                   |
| `adapterName`   | `string`                  | Yes      | None    | Human-readable name for logs and debug output.                                     |
| `dbCredentials` | `CosmosClientOptions`     | Yes      | None    | Passed directly to `new CosmosClient(...)`; usually includes `endpoint` and `key`. |
| `dbName`        | `string`                  | Yes      | None    | Cosmos DB database name. The adapter creates it if missing.                        |
| `debugLogs`     | `DBAdapterDebugLogOption` | No       | `false` | Better Auth adapter debug logging setting.                                         |
| `usePlural`     | `boolean`                 | No       | `false` | Creates plural container names and tells Better Auth to use plural model names.    |

## Recommended Defaults

Use plural containers for new projects:

```ts
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
```

`usePlural: true` creates containers such as `users`, `sessions`, and `accounts`. `usePlural: false` creates singular containers such as `user`, `session`, and `account`.

## Adapter Capabilities

The adapter factory is configured with:

| Capability           | Value   |
| -------------------- | ------- |
| `supportsJSON`       | `true`  |
| `supportsDates`      | `false` |
| `supportsBooleans`   | `true`  |
| `supportsNumericIds` | `false` |

This means the adapter expects string IDs and supports JSON and boolean fields. Date handling is delegated through Better Auth's adapter behavior rather than native date support.

## Supported Operations

The adapter implements the operations Better Auth expects from a custom database adapter:

- `create`
- `update`
- `updateMany`
- `delete`
- `deleteMany`
- `findOne`
- `findMany`
- `count`

Queries are translated to Cosmos SQL with parameters, including equality comparisons, range comparisons, string contains/starts-with/ends-with, `in`, `not_in`, sorting, offset, and limit.

## Error Handling

Cosmos DB client errors are not swallowed. Authentication, network, query, create, update, and delete failures bubble up to Better Auth and the calling application.
