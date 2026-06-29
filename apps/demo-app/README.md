This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) and integrated with [better-auth](https://github.com/iway1/better-auth).

## Getting Started

### Prerequisites

- Node.js 20 or newer
- Azure Cosmos DB instance (for authentication storage)

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
- **Cosmos DB Storage**: Auth data persisted via `@wemogy/better-auth-cosmos`

### Available Pages

- `/` - Home page with authentication status
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Protected dashboard (requires authentication)

### Key Files

- `src/lib/auth.ts` - Better-auth server configuration with Cosmos DB adapter
- `src/app/api/auth/[...all]/route.ts` - Next.js API route handler for better-auth
- `src/lib/authClient.ts` - Better-auth client configuration
- `src/components/AuthProviderWrapper.tsx` - Client-side auth provider wrapper
- `src/app/layout.tsx` - Root layout with AuthProvider

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
