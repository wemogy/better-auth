# Data Model and Containers

The adapter creates the database during `buildCosmosAdapter` and derives the containers from the Better Auth schema when the adapter is initialized. The schema contains exactly the models required by the active plugins, so only containers that are actually needed get created — and unknown plugin models (including third-party plugins) are provisioned automatically.

## Containers

With only core Better Auth active, the adapter creates `user`, `session`, `verification`, and `account`. Each active plugin adds its own models, for example:

| Plugin       | Containers                                                    |
| ------------ | ------------------------------------------------------------- |
| Organization | `organization`, `member`, `team`, `invitation`, `teamMember`  |
| Two-Factor   | `twoFactor`                                                   |
| Any other    | Whatever models the plugin declares in its Better Auth schema |

Container names go through Better Auth's model name resolution, so custom `modelName` options and `usePlural: true` are respected. With `usePlural: true`, names are pluralized: `users`, `sessions`, `verifications`, `accounts`, `twoFactors`, and so on.

Creation is lazy and idempotent: containers are created with `createIfNotExists` when the adapter is initialized, and each container is only created once per process. Cosmos client errors during container creation surface on the first adapter operation.

## Partition Keys

Known models get a partition key matching their hottest Better Auth lookup; unknown models default to `/id`:

| Model                                  | Partition key     | Hot query                                     |
| -------------------------------------- | ----------------- | --------------------------------------------- |
| `session`                              | `/token`          | Session lookup on every authenticated request |
| `verification`                         | `/identifier`     | Verification token lookup                     |
| `account`, `twoFactor`                 | `/userId`         | Provider account and 2FA lookups              |
| `member`, `team`, `invitation`         | `/organizationId` | Organization-scoped queries                   |
| `teamMember`                           | `/teamId`         | Team-scoped queries                           |
| `user`, `organization`, unknown models | `/id`             | Lookup by ID                                  |

Override per model through the `partitionKeys` config option:

```ts
const adapter = await buildCosmosAdapter({
  // ...
  partitionKeys: {
    session: '/userId',
    myPluginModel: '/tenantId',
  },
});
```

Deletes resolve the partition key value from the document itself, so partition keys other than `/id` work without extra configuration. Partition keys are immutable on existing containers — changing them requires recreating the container.

## Query Behavior

The adapter builds parameterized Cosmos SQL queries. Examples:

| Better Auth where operator | Cosmos SQL shape                   |
| -------------------------- | ---------------------------------- |
| `eq`                       | `c.field = @p0`                    |
| `ne`                       | `c.field != @p0`                   |
| `lt`, `lte`, `gt`, `gte`   | Range comparison against `@p0`.    |
| `contains`                 | `CONTAINS(c.field, @p0, true)`     |
| `starts_with`              | `STARTSWITH(c.field, @p0, true)`   |
| `ends_with`                | `ENDSWITH(c.field, @p0, true)`     |
| `in`                       | `ARRAY_CONTAINS(@p0, c.field)`     |
| `not_in`                   | `NOT ARRAY_CONTAINS(@p0, c.field)` |
| `eq` with `null`           | `IS_NULL(c.field)`                 |
| `ne` with `null`           | `NOT IS_NULL(c.field)`             |

`findMany` also supports selected fields, `ORDER BY`, `OFFSET`, and `LIMIT`.

## Migrations

There is no separate migration layer in the current package. The database is created when `buildCosmosAdapter` runs; containers are created lazily from the Better Auth schema when the adapter initializes. Adding a plugin to the Better Auth configuration is enough — its containers appear automatically on the next request.
