import type { BetterAuthClientPlugin } from 'better-auth/client';
import type { multiTenancyPlugin } from './index';

/**
 * Extract tenant ID from current URL path
 * Matches patterns like /tenant1/*, /tenant2/*, etc.
 * @returns Tenant ID if found, undefined otherwise
 */
function getCurrentTenantId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const match = window.location.pathname.match(/^\/(tenant\d+)\//);
  return match ? match[1] : undefined;
}

// Store tenant context explicitly set by user
let explicitTenantContext: string | undefined = undefined;

/**
 * Set explicit tenant context (overrides route-based detection)
 * @param tenantId - The tenant ID to use
 */
export function setTenantContext(tenantId: string | undefined): void {
  explicitTenantContext = tenantId;
}

/**
 * Get current tenant ID (explicit context > route-based)
 * @returns Tenant ID if found, undefined otherwise
 */
export function getTenantContext(): string | undefined {
  return explicitTenantContext || getCurrentTenantId();
}

export const multiTenancyClientPlugin = () => {
  return {
    id: 'multi-tenancy',
    $InferServerPlugin: {} as ReturnType<typeof multiTenancyPlugin>,
    getActions: $fetch => {
      // Create a tenant-aware wrapper for $fetch
      const tenantAwareFetch = async (url: string, options?: RequestInit) => {
        const tenantId = getTenantContext();

        if (tenantId) {
          // Extract tenantId from URL path if available, otherwise use context
          const urlTenantId = url.match(/^\/(tenant\d+)\//)?.[1] || tenantId;

          // Add tenant ID to headers for server-side detection
          // The server will use this to determine which cookie to read/write
          const headers = new Headers(options?.headers);
          if (!headers.has('x-tenant-id')) {
            headers.set('x-tenant-id', urlTenantId);
          }

          return $fetch(url, {
            ...options,
            headers,
          });
        }

        return $fetch(url, options);
      };

      return {
        multiTenancy: {
          createTenant: async (data: { name: string; description?: string }) => {
            return tenantAwareFetch('/multi-tenancy/create-tenant', {
              method: 'POST',
              body: JSON.stringify(data),
              headers: {
                'Content-Type': 'application/json',
              },
            });
          },
          tenants: async () => {
            return tenantAwareFetch('/multi-tenancy/tenants', {
              method: 'GET',
            });
          },
          switchTenant: async (data: { tenantId: string }) => {
            return tenantAwareFetch('/multi-tenancy/switch-tenant', {
              method: 'POST',
              body: JSON.stringify(data),
              headers: {
                'Content-Type': 'application/json',
              },
            });
          },
        },
      };
    },
  } satisfies BetterAuthClientPlugin;
};
