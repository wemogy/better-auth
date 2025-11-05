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
export declare const multiTenancyPlugin: (options?: MultiTenancyOptions) => BetterAuthPlugin;
export { multiTenancyClientPlugin } from './client';
