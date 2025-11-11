This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) and integrated with [better-auth](https://github.com/iway1/better-auth).

## Getting Started

### Prerequisites

- Node.js 20 or newer
- Azure Cosmos DB instance (for authentication storage)

**Note**: This app includes its own better-auth API routes. You don't need to run the separate `demo-api` server, but you can still use it if you prefer.

### Environment Variables

Create a `.env.local` file in the root of this app:

```bash
# Better Auth API URL (defaults to same origin if not set)
NEXT_PUBLIC_AUTH_URL=http://localhost:3000

# Cosmos DB Configuration (required)
COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key
COSMOS_DB_NAME=better-auth-demo
```

### Running the Development Server

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Better Auth Integration

This app uses better-auth with the following features:

- **Authentication**: Login, registration, and session management
- **Multi-tenancy**: Support for multiple tenants/organizations
- **Subdomain Routing**: Automatic tenant detection based on subdomain
- **React Components**: Pre-built forms and hooks from `@wemogy/better-auth-react`

### Available Pages

- `/` - Home page with authentication status
- `/login` - Login page (tenant-aware)
- `/register` - Registration page (tenant-aware)
- `/dashboard` - Protected dashboard (requires authentication)

### Key Files

- `src/lib/auth.ts` - Better-auth server configuration with Cosmos DB adapter
- `src/app/api/auth/[...all]/route.ts` - Next.js API route handler for better-auth
- `src/lib/authClient.ts` - Better-auth client configuration with subdomain support
- `src/lib/subdomain.ts` - Subdomain utility functions
- `src/middleware.ts` - Next.js middleware for subdomain extraction
- `src/components/AuthProviderWrapper.tsx` - Client-side auth provider wrapper
- `src/app/layout.tsx` - Root layout with AuthProvider

## Subdomain Routing

This app supports subdomain-based multi-tenancy. Each subdomain automatically maps to a tenant ID.

### How It Works

1. **Subdomain Detection**: The middleware extracts the subdomain from the hostname
2. **Direct Tenant ID**: The subdomain is used **directly** as the tenant ID (e.g., `tenant1.localhost:3000` → tenant ID: `tenant1`)
   - No mapping or transformation is applied
   - The subdomain value becomes the tenant ID as-is
3. **Automatic Context**: The tenant context is automatically set for all auth requests based on the subdomain

### Local Development Setup

To test subdomain routing locally, you need to configure your hosts file and development server:

#### Option 1: Using `/etc/hosts` (macOS/Linux)

1. Edit `/etc/hosts` and add:

   ```
   127.0.0.1 tenant1.localhost
   127.0.0.1 tenant2.localhost
   127.0.0.1 tenant3.localhost
   ```

2. Start the dev server:

   ```bash
   pnpm dev
   ```

3. Access the app via:
   - `http://tenant1.localhost:3000` - Tenant 1
   - `http://tenant2.localhost:3000` - Tenant 2
   - `http://tenant3.localhost:3000` - Tenant 3

#### Option 2: Using a Wildcard DNS Service

For easier local development, you can use services like:

- [nip.io](https://nip.io) - `tenant1.127.0.0.1.nip.io`
- [localhost.run](https://localhost.run) - For tunneling

#### Option 3: Using Next.js Custom Server (Advanced)

You can configure Next.js to handle subdomains by creating a custom server.

### Production Setup

In production, configure your DNS to point subdomains to your server:

- `tenant1.yourdomain.com` → Your server
- `tenant2.yourdomain.com` → Your server

The middleware will automatically detect and route to the correct tenant.

### Customizing Tenant Mapping

To customize how subdomains map to tenant IDs, edit `src/lib/subdomain.ts`:

```typescript
export function subdomainToTenantId(subdomain: string): string {
  // Add your custom mapping logic here
  // Example: if (subdomain === 'acme') return 'tenant1'
  return subdomain;
}
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
