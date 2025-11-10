import { multiTenancyClientPlugin } from '@wemogy/better-auth-multi-tenancy'
import { createAuthClient } from 'better-auth/client'

const baseClient = createAuthClient({
  baseURL: 'http://localhost:3001', // The base URL of your auth server
  plugins: [multiTenancyClientPlugin()],
})

type BetterAuthResponse<T> = {
  data?: T
  error?: { message: string; status: number }
}

export const authClient = baseClient as typeof baseClient & {
  multiTenancy: {
    createTenant: (data: {
      name: string
      description?: string
    }) => Promise<BetterAuthResponse<{ tenant: unknown }>>
    tenants: () => Promise<BetterAuthResponse<{ tenants: unknown[] }>>
    switchTenant: (data: {
      tenantId: string
    }) => Promise<BetterAuthResponse<unknown>>
  }
}
