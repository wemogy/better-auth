# @wemogy/better-auth-multi-tenancy

A Better Auth plugin that adds multi-tenancy support to authentication flows.

## Installation

```bash
pnpm add @wemogy/better-auth-multi-tenancy
```

## Usage

### Server Configuration

```typescript
import { betterAuth } from 'better-auth';
import { multiTenancyPlugin } from '@wemogy/better-auth-multi-tenancy';

export const auth = betterAuth({
  plugins: [
    multiTenancyPlugin({
      // options
    }),
  ],
});
```

### Client Configuration

```typescript
import { createAuthClient } from 'better-auth/client';
import { multiTenancyClientPlugin } from '@wemogy/better-auth-multi-tenancy/client';

const authClient = createAuthClient({
  plugins: [multiTenancyClientPlugin()],
});
```

## Features

- Tenant management endpoints
- Tenant-based user isolation
- Session validation with tenant context

## API

### Endpoints

- `POST /multi-tenancy/create-tenant` - Create a new tenant
- `GET /multi-tenancy/tenants` - List tenants for the current user
- `POST /multi-tenancy/switch-tenant` - Switch the active tenant for the session

## License

UNLICENSED
