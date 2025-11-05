import { createAuthMiddleware, createAuthEndpoint, APIError } from 'better-auth/api';
import { getSessionFromCtx } from 'better-auth/api';
import type { BetterAuthPlugin } from 'better-auth';

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

export const multiTenancyPlugin = (options: MultiTenancyOptions = {}): BetterAuthPlugin => {
  const { enforceTenantIsolation = true, tenantField = 'tenantId' } = options;

  return {
    id: 'multi-tenancy',
    schema: {
      tenant: {
        fields: {
          name: {
            type: 'string',
            required: true,
          },
          description: {
            type: 'string',
          },
          createdAt: {
            type: 'date',
          },
        },
      },
      user: {
        fields: {
          [tenantField]: {
            type: 'string',
            required: true,
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
              const tenantId = ctx.request?.headers?.get('x-tenant-id') || (ctx.body as Record<string, unknown>)?.tenantId || ctx.query?.tenantId;

              if (tenantId) {
                (ctx.context as Record<string, unknown>).tenantId = tenantId;
              }
              return;
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

// Re-export client plugin
export { multiTenancyClientPlugin } from './client';
