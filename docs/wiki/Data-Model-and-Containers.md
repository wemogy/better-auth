# Data Model and Containers

The adapter creates the database and known Better Auth containers during initialization.

## Containers

With `usePlural: false`, the adapter creates:

| Container      | Purpose                                                               |
| -------------- | --------------------------------------------------------------------- |
| `user`         | User profiles and credentials-related user fields.                    |
| `session`      | Better Auth session records when sessions are stored in the database. |
| `verification` | Verification tokens and one-time verification records.                |
| `account`      | Linked provider accounts and credential account records.              |
| `organization` | Organization plugin records.                                          |
| `member`       | Organization membership records.                                      |
| `team`         | Team plugin records.                                                  |
| `invitation`   | Organization invitation records.                                      |
| `teamMember`   | Team membership records.                                              |
| `twoFactor`    | Two-factor authentication records.                                    |

With `usePlural: true`, the adapter pluralizes those names:

| Singular       | Plural          |
| -------------- | --------------- |
| `user`         | `users`         |
| `session`      | `sessions`      |
| `verification` | `verifications` |
| `account`      | `accounts`      |
| `organization` | `organizations` |
| `member`       | `members`       |
| `team`         | `teams`         |
| `invitation`   | `invitations`   |
| `teamMember`   | `teamMembers`   |
| `twoFactor`    | `twoFactors`    |

## Partition Key

Every container is created with `/id` as the partition key:

```ts
{
  id: name,
  partitionKey: {
    paths: ['/id'],
  },
}
```

Deletes use `container.item(id, id).delete()`, so the document ID and partition key value are expected to match.

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

There is no separate migration layer in the current package. Container creation happens when `buildCosmosAdapter` initializes. If future Better Auth plugins require additional containers, add them to the adapter's base container list and update this page in the same change.
