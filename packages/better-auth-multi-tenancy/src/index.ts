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
            // to avoid tenantId to be mandatory in the sign-up body we mark this as not required
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

          // Assign the creator to the tenant
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

          // Get tenants where the user is a member
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

          // Verify user has access to this tenant
          const user = await ctx.context.adapter.findOne({
            model: 'user',
            where: [{ field: 'id', value: session.user.id, operator: 'eq' }],
          });

          if (!user || user[tenantField as keyof typeof user] !== tenantId) {
            throw new APIError('FORBIDDEN', { message: 'Access to tenant denied' });
          }

          // Update session with active tenant
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
            // Extract tenantId from various sources
            const tenantId = ctx.request?.headers?.get('x-tenant-id') ?? undefined;

            // Create a wrapped adapter that passes tenantId to all adapter methods
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
            // Extract tenantId from route, header, or query
            const tenantId =
              extractTenantFromRoute(ctx.path) || ctx.request?.headers?.get('x-tenant-id') || (ctx.query?.tenantId as string | undefined);

            if (tenantId) {
              // Store tenantId in context
              (ctx.context as Record<string, unknown>).tenantId = tenantId;

              // Override cookie reading to use tenant-specific cookie
              const cookieName = getTenantCookieName(tenantId);
              if (ctx.context.authCookies?.sessionToken) {
                ctx.context.authCookies.sessionToken.name = cookieName;
              }
            }
          }),
        },
        {
          matcher: ctx => ctx.path.startsWith('/sign-out'),
          handler: createAuthMiddleware(async ctx => {
            // Extract tenantId from route, header, or query
            const tenantId =
              extractTenantFromRoute(ctx.path) || ctx.request?.headers?.get('x-tenant-id') || (ctx.query?.tenantId as string | undefined);

            if (tenantId) {
              // Store tenantId in context for cookie clearing
              (ctx.context as Record<string, unknown>).tenantId = tenantId;

              // Override cookie name for sign-out
              const cookieName = getTenantCookieName(tenantId);
              if (ctx.context.authCookies?.sessionToken) {
                ctx.context.authCookies.sessionToken.name = cookieName;
              }
            }
          }),
        },
      ],
      after: [
        {
          matcher: ctx => ctx.path.startsWith('/sign-in/email') || ctx.path.startsWith('/sign-up/email'),
          handler: createAuthMiddleware(async ctx => {
            const tenantId = (ctx.context as Record<string, unknown>)?.tenantId as string | undefined;

            // Debug: Log if hook is executed
            console.log('[MultiTenancy] After hook executed:', {
              path: ctx.path,
              tenantId,
              hasNewSession: !!ctx.context.newSession,
              hasReturned: !!ctx.context.returned,
              responseHeaders: ctx.context.responseHeaders ? Array.from(ctx.context.responseHeaders.entries()) : null,
            });

            if (tenantId) {
              // Check if Better Auth set a default cookie in the response headers
              const responseHeaders = ctx.context.responseHeaders;
              const setCookieHeader = responseHeaders?.get('Set-Cookie');

              console.log('[MultiTenancy] Set-Cookie header:', setCookieHeader);

              // Try to get session token from newSession or from response
              let sessionToken: string | undefined;
              let expiresIn = 604800; // 7 days default

              if (ctx.context.newSession) {
                // Session was successfully created
                sessionToken = ctx.context.newSession.session?.token;
                const sessionExpiresAt = ctx.context.newSession.session?.expiresAt;
                if (sessionExpiresAt) {
                  expiresIn = Math.floor((new Date(sessionExpiresAt).getTime() - Date.now()) / 1000);
                }
              } else if (setCookieHeader) {
                // Try to extract session token from Set-Cookie header
                const cookiePrefix = ctx.context.options?.advanced?.cookiePrefix || 'better-auth';
                const defaultCookieName = `${cookiePrefix}.session_token`;

                // Check if Better Auth set a cookie
                if (setCookieHeader.includes(defaultCookieName)) {
                  try {
                    // Try to get the cookie from the request (it might have been set)
                    const cookieValue = await ctx.getSignedCookie(defaultCookieName, ctx.context.secret);
                    if (cookieValue) {
                      sessionToken = cookieValue;
                      console.log('[MultiTenancy] Extracted session token from default cookie');
                    }
                  } catch (error) {
                    console.log('[MultiTenancy] Could not decode default cookie:', error);
                  }
                }
              }

              if (sessionToken && tenantId) {
                const cookieName = getTenantCookieName(tenantId);

                console.log('[MultiTenancy] Setting tenant-specific cookie:', {
                  cookieName,
                  hasToken: !!sessionToken,
                  expiresIn,
                });

                // Set tenant-specific cookie
                try {
                  await ctx.setSignedCookie(cookieName, sessionToken, ctx.context.secret, {
                    httpOnly: true,
                    secure: ctx.context.options?.advanced?.useSecureCookies ?? false,
                    sameSite: 'lax',
                    maxAge: expiresIn,
                    path: '/',
                  });
                  console.log('[MultiTenancy] Cookie set successfully:', cookieName);
                } catch (error) {
                  console.error('[MultiTenancy] Error setting cookie:', error);
                }
              } else {
                console.warn('[MultiTenancy] No session token available:', {
                  tenantId,
                  hasNewSession: !!ctx.context.newSession,
                  hasToken: !!sessionToken,
                });
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
            // Skip for auth endpoints and multi-tenancy setup
            if (
              ctx.path.startsWith('/sign-in') ||
              ctx.path.startsWith('/sign-up') ||
              ctx.path.startsWith('/get-session') ||
              ctx.path.startsWith('/sign-out') ||
              ctx.path.startsWith('/callback') ||
              ctx.path.startsWith('/multi-tenancy/create-tenant')
            ) {
              // For auth endpoints, check if tenant context is provided
              // Try to extract from route first, then fallback to other methods
              const tenantId =
                extractTenantFromRoute(ctx.path) ||
                ctx.request?.headers?.get('x-tenant-id') ||
                ((ctx.body as Record<string, unknown>)?.tenantId as string | undefined) ||
                (ctx.query?.tenantId as string | undefined);

              if (tenantId) {
                (ctx.context as Record<string, unknown>).tenantId = tenantId;
              }
              return;
            }

            // For other endpoints, try to get session using tenant-specific cookie
            const tenantId = extractTenantFromRoute(ctx.path) || ctx.request?.headers?.get('x-tenant-id');

            if (tenantId) {
              // Override cookie name for session retrieval
              const cookieName = getTenantCookieName(tenantId);
              if (ctx.context.authCookies?.sessionToken) {
                ctx.context.authCookies.sessionToken.name = cookieName;
              }
            }

            const session = await getSessionFromCtx(ctx);
            if (!session) {
              throw new APIError('UNAUTHORIZED', { message: 'Authentication required' });
            }

            // Check if user has an active tenant
            const activeTenantId = session.session.activeTenantId || session.user[tenantField as keyof typeof session.user];

            if (!activeTenantId) {
              throw new APIError('BAD_REQUEST', { message: 'No active tenant. Please create or join a tenant first.' });
            }

            // Add tenant context to the request
            (ctx.context as Record<string, unknown>).tenantId = activeTenantId;
          }),
        },
      ],
    }),
  } satisfies BetterAuthPlugin;
};

// Re-export client plugin and helpers
export { multiTenancyClientPlugin, setTenantContext, getTenantContext } from './client';
