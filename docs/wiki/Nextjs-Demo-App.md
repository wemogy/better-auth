# Next.js Demo App

The demo app in `apps/demo-app` shows the adapter running inside a Next.js App Router application.

## Features

- Email/password registration and login through Better Auth.
- Better Auth API route under `/api/auth`.
- Protected dashboard route.
- Cosmos DB persistence through the local workspace package.

## Important Files

| File                                               | Purpose                                                |
| -------------------------------------------------- | ------------------------------------------------------ |
| `apps/demo-app/src/lib/auth.ts`                    | Creates and caches the Better Auth server instance.    |
| `apps/demo-app/src/app/api/auth/[...all]/route.ts` | Exposes Better Auth GET and POST handlers for Next.js. |
| `apps/demo-app/src/lib/authClient.ts`              | Creates the browser-side Better Auth client.           |
| `apps/demo-app/src/app/login/page.tsx`             | Login page.                                            |
| `apps/demo-app/src/app/register/page.tsx`          | Registration page.                                     |
| `apps/demo-app/src/app/dashboard/page.tsx`         | Protected dashboard page.                              |

## Environment

Create `apps/demo-app/.env.local`:

```bash
NEXT_PUBLIC_AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

COSMOS_ENDPOINT="https://<your-account>.documents.azure.com:443/"
COSMOS_KEY="<cosmos-key>"
COSMOS_DB_NAME="better-auth-demo"
```

The server config also accepts `COSMOS_DB_ENDPOINT` and `COSMOS_DB_KEY`.

## Run Locally

From the repository root:

```bash
pnpm install
pnpm --filter demo-app dev
```

Then open:

```text
http://localhost:3000
```

## Auth Configuration

The demo uses:

```ts
authInstance = betterAuth({
  database: adapter,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
  baseURL: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000',
  basePath: '/api/auth',
});
```

The adapter is initialized with `usePlural: true`, so the demo database uses plural container names.
