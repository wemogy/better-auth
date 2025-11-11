import { createAuthMiddleware, createAuthEndpoint, APIError } from 'better-auth/api';
import { getSessionFromCtx } from 'better-auth/api';
import { createInternalAdapter } from 'better-auth/db';
import type { BetterAuthPlugin } from 'better-auth';
import { CosmosAdapter, cosmosEnvironment } from '@wemogy/better-auth-cosmos';

export interface MultiTenancyOptions {
  /**
   * Whether to enforce tenant isolation for all requests
   * @default true
   */
  enforceTenantIsolation?: boolean;

  /**
   * The field name for tenant ID in the user table
   * @default "tenantId"
   */
  tenantField?: string;
}

/**
 * Get tenant-specific cookie name
 * @param tenantId - The tenant ID
 * @returns Cookie name in format: ${tenantId}_session
 */
function getTenantCookieName(tenantId: string): string {
  return `${tenantId}_session`;
}

/**
 * Extract tenant ID from route path
 * Matches patterns like /tenant1/*, /tenant2/*, etc.
 * @param path - The request path
 * @returns Tenant ID if found, undefined otherwise
 */
function extractTenantFromRoute(path: string): string | undefined {
  const match = path.match(/^\/(tenant\d+)\//);
  return match ? match[1] : undefined;
}

/**
 * Extract tenant ID from context (route, header, body, or query)
 * Checks sources in priority order: route > header > body > query
 */
function extractTenantId(ctx: {
  path: string;
  request?: { headers?: Headers };
  body?: unknown;
  query?: Record<string, unknown>;
}): string | undefined {
  return (
    extractTenantFromRoute(ctx.path) ||
    ctx.request?.headers?.get('x-tenant-id') ||
    ((ctx.body as Record<string, unknown>)?.tenantId as string | undefined) ||
    (ctx.query?.tenantId as string | undefined)
  );
}

/**
 * Override the session cookie name to use tenant-specific cookie
 */
function overrideCookieName(ctx: { context: { authCookies?: { sessionToken?: { name: string } } } }, tenantId: string): void {
  const cookieName = getTenantCookieName(tenantId);
  if (ctx.context.authCookies?.sessionToken) {
    ctx.context.authCookies.sessionToken.name = cookieName;
  }
}

/**
 * Store tenantId in context
 */
function setTenantContext(context: Record<string, unknown>, tenantId: string): void {
  context.tenantId = tenantId;
}

/**
 * Get session token from context (newSession or Set-Cookie header)
 */
async function getSessionToken(ctx: {
  context: {
    newSession?: { session?: { token?: string; expiresAt?: Date | string } } | null;
    responseHeaders?: Headers;
    options?: { advanced?: { cookiePrefix?: string } };
    secret: string;
  };
  getSignedCookie: (name: string, secret: string) => Promise<string | null>;
}): Promise<{ token: string; expiresIn: number } | null> {
  const defaultExpiresIn = 604800; // 7 days

  if (ctx.context.newSession?.session?.token) {
    const sessionExpiresAt = ctx.context.newSession.session.expiresAt;
    const expiresIn = sessionExpiresAt ? Math.floor((new Date(sessionExpiresAt).getTime() - Date.now()) / 1000) : defaultExpiresIn;
    return { token: ctx.context.newSession.session.token, expiresIn };
  }

  const setCookieHeader = ctx.context.responseHeaders?.get('Set-Cookie');
  if (setCookieHeader) {
    const cookiePrefix = ctx.context.options?.advanced?.cookiePrefix || 'better-auth';
    const defaultCookieName = `${cookiePrefix}.session_token`;

    if (setCookieHeader.includes(defaultCookieName)) {
      try {
        const cookieValue = await ctx.getSignedCookie(defaultCookieName, ctx.context.secret);
        if (cookieValue) {
          return { token: cookieValue, expiresIn: defaultExpiresIn };
        }
      } catch {
        // Cookie could not be decoded, continue
      }
    }
  }

  return null;
}

/**
 * Set tenant-specific session cookie
 */
async function setTenantCookie(
  ctx: {
    context: {
      secret: string;
      options?: { advanced?: { useSecureCookies?: boolean } };
    };
    setSignedCookie: (
      name: string,
      value: string,
      secret: string,
      options?: {
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: 'lax' | 'strict' | 'none' | 'Lax' | 'Strict' | 'None';
        maxAge?: number;
        path?: string;
      },
    ) => Promise<string>;
  },
  tenantId: string,
  sessionToken: string,
  expiresIn: number,
): Promise<void> {
  const cookieName = getTenantCookieName(tenantId);
  await ctx.setSignedCookie(cookieName, sessionToken, ctx.context.secret, {
    httpOnly: true,
    secure: ctx.context.options?.advanced?.useSecureCookies ?? false,
    sameSite: 'lax',
    maxAge: expiresIn,
    path: '/',
  });
}

export const multiTenancyPlugin = (options: MultiTenancyOptions = {}): BetterAuthPlugin => {
  const { enforceTenantIsolation = true, tenantField = 'tenantId' } = options;

  return {
    id: 'multi-tenancy',
    schema: {
      tenant: {
        fields: {
          createdAt: {
            type: 'date',
          },
        },
      },
      user: {
        fields: {
          [tenantField]: {
            type: 'string',
            required: false,
            references: {
              model: 'tenant',
              field: 'id',
            },
          },
        },
      },
      session: {
        fields: {
          activeTenantId: {
            type: 'string',
            references: {
              model: 'tenant',
              field: 'id',
            },
          },
        },
      },
    },
    endpoints: {
      createTenant: createAuthEndpoint(
        '/multi-tenancy/create-tenant',
        {
          method: 'POST',
        },
        async ctx => {
          const { name, description } = ctx.body as { name: string; description?: string };

          if (!name) {
            throw new APIError('BAD_REQUEST', { message: 'Tenant name is required' });
          }

          const session = await getSessionFromCtx(ctx);
          if (!session) {
            throw new APIError('UNAUTHORIZED', { message: 'Authentication required' });
          }

          const tenant = await ctx.context.adapter.create({
            model: 'tenant',
            data: {
              name,
              description,
              createdAt: new Date(),
            },
          });

          await ctx.context.adapter.update({
            model: 'user',
            where: [{ field: 'id', value: session.user.id, operator: 'eq' }],
            update: { [tenantField]: tenant.id },
          });

          return ctx.json({ tenant });
        },
      ),

      getTenants: createAuthEndpoint(
        '/multi-tenancy/tenants',
        {
          method: 'GET',
        },
        async ctx => {
          const session = await getSessionFromCtx(ctx);
          if (!session) {
            throw new APIError('UNAUTHORIZED', { message: 'Authentication required' });
          }

          const userTenantId = session.user[tenantField as keyof typeof session.user] as string;
          const tenants = await ctx.context.adapter.findMany({
            model: 'tenant',
            where: [{ field: 'id', value: userTenantId, operator: 'eq' }],
          });

          return ctx.json({ tenants: tenants as readonly unknown[] });
        },
      ),

      switchTenant: createAuthEndpoint(
        '/multi-tenancy/switch-tenant',
        {
          method: 'POST',
        },
        async ctx => {
          const { tenantId } = ctx.body as { tenantId: string };

          const session = await getSessionFromCtx(ctx);
          if (!session) {
            throw new APIError('UNAUTHORIZED', { message: 'Authentication required' });
          }

          const user = await ctx.context.adapter.findOne({
            model: 'user',
            where: [{ field: 'id', value: session.user.id, operator: 'eq' }],
          });

          if (!user || user[tenantField as keyof typeof user] !== tenantId) {
            throw new APIError('FORBIDDEN', { message: 'Access to tenant denied' });
          }

          await ctx.context.adapter.update({
            model: 'session',
            where: [{ field: 'id', value: session.session.id, operator: 'eq' }],
            update: { activeTenantId: tenantId },
          });

          return ctx.json({ success: true });
        },
      ),
    },
    hooks: {
      before: [
        {
          matcher: () => true,
          handler: createAuthMiddleware(async ctx => {
            const tenantId = ctx.request?.headers?.get('x-tenant-id') ?? undefined;
            const wrappedAdapter = new CosmosAdapter(cosmosEnvironment.cosmos, cosmosEnvironment.getModelName, tenantId);

            return {
              context: {
                ...ctx,
                context: {
                  ...ctx.context,
                  tenantId,
                  adapter: wrappedAdapter,
                  internalAdapter: createInternalAdapter(wrappedAdapter as unknown as typeof ctx.context.adapter, {
                    options: ctx.context.options,
                    logger: ctx.context.logger,
                    hooks: ctx.context.hooks,
                    generateId: ctx.context.generateId,
                  }),
                },
              },
            };
          }),
        },
        {
          matcher: ctx => ctx.path.startsWith('/get-session'),
          handler: createAuthMiddleware(async ctx => {
            const tenantId = extractTenantId(ctx);
            if (tenantId) {
              setTenantContext(ctx.context as Record<string, unknown>, tenantId);
              overrideCookieName(ctx, tenantId);
            }
          }),
        },
        {
          matcher: ctx => ctx.path.startsWith('/sign-out'),
          handler: createAuthMiddleware(async ctx => {
            const tenantId = extractTenantId(ctx);
            if (tenantId) {
              setTenantContext(ctx.context as Record<string, unknown>, tenantId);
              overrideCookieName(ctx, tenantId);
            }
          }),
        },
      ],
      after: [
        {
          matcher: ctx => ctx.path.startsWith('/sign-in/email') || ctx.path.startsWith('/sign-up/email'),
          handler: createAuthMiddleware(async ctx => {
            const tenantId = (ctx.context as Record<string, unknown>)?.tenantId as string | undefined;

            if (tenantId) {
              const sessionData = await getSessionToken(ctx);
              if (sessionData) {
                await setTenantCookie(ctx, tenantId, sessionData.token, sessionData.expiresIn);
              }
            }
          }),
        },
      ],
    },
    ...(enforceTenantIsolation && {
      middlewares: [
        {
          path: '/**',
          middleware: createAuthMiddleware(async ctx => {
            if (
              ctx.path.startsWith('/sign-in') ||
              ctx.path.startsWith('/sign-up') ||
              ctx.path.startsWith('/get-session') ||
              ctx.path.startsWith('/sign-out') ||
              ctx.path.startsWith('/callback') ||
              ctx.path.startsWith('/multi-tenancy/create-tenant')
            ) {
              const tenantId = extractTenantId(ctx);
              if (tenantId) {
                setTenantContext(ctx.context as Record<string, unknown>, tenantId);
              }
              return;
            }

            const tenantId = extractTenantFromRoute(ctx.path) || ctx.request?.headers?.get('x-tenant-id');
            if (tenantId) {
              overrideCookieName(ctx, tenantId);
            }

            const session = await getSessionFromCtx(ctx);
            if (!session) {
              throw new APIError('UNAUTHORIZED', { message: 'Authentication required' });
            }

            const activeTenantId = session.session.activeTenantId || session.user[tenantField as keyof typeof session.user];
            if (!activeTenantId) {
              throw new APIError('BAD_REQUEST', { message: 'No active tenant. Please create or join a tenant first.' });
            }

            setTenantContext(ctx.context as Record<string, unknown>, activeTenantId);
          }),
        },
      ],
    }),
  } satisfies BetterAuthPlugin;
};

// Re-export client plugin and helpers
export { multiTenancyClientPlugin, setTenantContext, getTenantContext } from './client';
