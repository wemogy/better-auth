import { describe, it, expect, vi } from 'vitest';
import { multiTenancyPlugin } from './index';

// Mock the better-auth imports
vi.mock('better-auth/api', () => ({
  createAuthMiddleware: vi.fn(() => vi.fn()),
  createAuthEndpoint: vi.fn(() => vi.fn()),
  APIError: class APIError extends Error {
    constructor(message: string, options?: any) {
      super(message);
      this.name = 'APIError';
    }
  },
  getSessionFromCtx: vi.fn(),
}));

vi.mock('better-auth', () => ({
  type: 'BetterAuthPlugin',
}));

describe('multiTenancyPlugin', () => {
  it('should create a plugin with correct id', () => {
    const plugin = multiTenancyPlugin();
    expect(plugin.id).toBe('multi-tenancy');
  });

  it('should include tenant schema', () => {
    const plugin = multiTenancyPlugin();
    expect(plugin.schema).toHaveProperty('tenant');
    expect(plugin.schema).toHaveProperty('user');
    expect(plugin.schema).toHaveProperty('session');
  });

  it('should have endpoints', () => {
    const plugin = multiTenancyPlugin();
    expect(plugin.endpoints).toHaveProperty('createTenant');
    expect(plugin.endpoints).toHaveProperty('getTenants');
    expect(plugin.endpoints).toHaveProperty('switchTenant');
  });

  it('should enforce tenant isolation by default', () => {
    const plugin = multiTenancyPlugin();
    expect(plugin.middlewares).toBeDefined();
    expect(plugin.middlewares?.length).toBe(1);
  });

  it('should allow disabling tenant isolation', () => {
    const plugin = multiTenancyPlugin({ enforceTenantIsolation: false });
    expect(plugin.middlewares).toBeUndefined();
  });

  it('should allow custom tenant field', () => {
    const plugin = multiTenancyPlugin({ tenantField: 'organizationId' });
    // This would need more detailed testing of the schema
    expect(plugin).toBeDefined();
  });
});
