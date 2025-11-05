import type { multiTenancyPlugin } from './index';
export declare const multiTenancyClientPlugin: () => {
    id: "multi-tenancy";
    $InferServerPlugin: ReturnType<typeof multiTenancyPlugin>;
    getActions: ($fetch: import("better-auth/client").BetterFetch) => {
        multiTenancy: {
            createTenant: (data: {
                name: string;
                description?: string;
            }) => Promise<{
                data: unknown;
                error: null;
            } | {
                data: null;
                error: {
                    message?: string | undefined;
                    status: number;
                    statusText: string;
                };
            }>;
            tenants: () => Promise<{
                data: unknown;
                error: null;
            } | {
                data: null;
                error: {
                    message?: string | undefined;
                    status: number;
                    statusText: string;
                };
            }>;
            switchTenant: (data: {
                tenantId: string;
            }) => Promise<{
                data: unknown;
                error: null;
            } | {
                data: null;
                error: {
                    message?: string | undefined;
                    status: number;
                    statusText: string;
                };
            }>;
        };
    };
};
