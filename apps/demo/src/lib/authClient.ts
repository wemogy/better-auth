import { multiTenancyClientPlugin } from '@wemogy/better-auth-multi-tenancy'
import { createAuthClient } from 'better-auth/client'

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3001', // The base URL of your auth server
  plugins: [multiTenancyClientPlugin()],
})
