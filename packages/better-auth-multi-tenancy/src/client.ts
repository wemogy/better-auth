import type { BetterAuthClientPlugin } from 'better-auth/client';
import type { multiTenancyPlugin } from './index';

export const multiTenancyClientPlugin = () => {
  return {
    id: 'multi-tenancy',
    $InferServerPlugin: {} as ReturnType<typeof multiTenancyPlugin>,
    getActions: $fetch => ({
      multiTenancy: {
        createTenant: async (data: { name: string; description?: string }) => {
          return $fetch('/multi-tenancy/create-tenant', {
            method: 'POST',
            body: data,
          });
        },
        tenants: async () => {
          return $fetch('/multi-tenancy/tenants', {
            method: 'GET',
          });
        },
        switchTenant: async (data: { tenantId: string }) => {
          return $fetch('/multi-tenancy/switch-tenant', {
            method: 'POST',
            body: data,
          });
        },
      },
    }),
  } satisfies BetterAuthClientPlugin;
};
