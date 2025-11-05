import type { BetterAuthClientPlugin } from 'better-auth/client';

export const multiTenancyClientPlugin = (): BetterAuthClientPlugin => {
  return {
    id: 'multi-tenancy',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $InferServerPlugin: {} as any,
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
  };
};
