import { useState } from 'react'
import { useAuthClient } from '../useAuthClient'
import type {
  AuthClient,
  CreateTenantData,
  Tenant,
} from '../../types/auth-client'

interface UseCreateTenantReturn {
  createTenant: (data: CreateTenantData) => Promise<Tenant>
  isLoading: boolean
  error: string | null
}

function checkMultiTenancyPlugin(authClient: AuthClient): boolean {
  return authClient?.$plugins?.some((p) => p.id === 'multi-tenancy') ?? false
}

export function useCreateTenant(): UseCreateTenantReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authClient: AuthClient = useAuthClient()

  const createTenant = async (data: CreateTenantData): Promise<Tenant> => {
    try {
      setIsLoading(true)
      setError(null)

      if (!checkMultiTenancyPlugin(authClient)) {
        throw new Error(
          'Multi-tenancy plugin is not active. Enable multiTenancyPlugin() on the server.',
        )
      }

      const result = await authClient.multiTenancy!.createTenant(data)
      return result.tenant
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create tenant'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createTenant,
    isLoading,
    error,
  }
}
