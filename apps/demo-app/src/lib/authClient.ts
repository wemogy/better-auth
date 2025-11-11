import { multiTenancyClientPlugin, setTenantContext } from '@wemogy/better-auth-multi-tenancy';
import { createAuthClient } from 'better-auth/client';
import { getTenantIdFromHostname } from './subdomain';

// Initialize tenant context from subdomain if available
if (typeof window !== 'undefined') {
  const tenantId = getTenantIdFromHostname();
  if (tenantId) {
    setTenantContext(tenantId);
  }
}

const baseClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  plugins: [multiTenancyClientPlugin()],
});

type BetterAuthResponse<T> = {
  data?: T;
  error?: { message: string; status: number };
};

export const authClient = baseClient as typeof baseClient & {
  multiTenancy: {
    createTenant: (data: { name: string; description?: string }) => Promise<BetterAuthResponse<{ tenant: unknown }>>;
    tenants: () => Promise<BetterAuthResponse<{ tenants: unknown[] }>>;
    switchTenant: (data: { tenantId: string }) => Promise<BetterAuthResponse<unknown>>;
  };
};

// Export function to update tenant context when subdomain changes
export function updateTenantContextFromSubdomain() {
  if (typeof window !== 'undefined') {
    const tenantId = getTenantIdFromHostname();
    setTenantContext(tenantId);
  }
}
