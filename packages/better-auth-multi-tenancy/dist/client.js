export const multiTenancyClientPlugin = () => {
    return {
        id: 'multi-tenancy',
        $InferServerPlugin: {},
        getActions: $fetch => ({
            multiTenancy: {
                createTenant: async (data) => {
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
                switchTenant: async (data) => {
                    return $fetch('/multi-tenancy/switch-tenant', {
                        method: 'POST',
                        body: data,
                    });
                },
            },
        }),
    };
};
