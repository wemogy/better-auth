import { useState } from 'react'
import { useAuthClient } from '../../AuthProvider'

interface CreateTenantData {
  name: string
  description?: string
}

interface Tenant {
  id: string
  name: string
  description?: string
  createdAt: string
}

interface UseCreateTenantReturn {
  createTenant: (data: CreateTenantData) => Promise<Tenant>
  isLoading: boolean
  error: string | null
}

function checkMultiTenancyPlugin(authClient: any): boolean {
  return authClient?.$plugins?.some((p: any) => p.id === 'multi-tenancy')
}

export function useCreateTenant(): UseCreateTenantReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authClient = useAuthClient()

  const createTenant = async (data: CreateTenantData): Promise<Tenant> => {
    try {
      setIsLoading(true)
      setError(null)

      if (!checkMultiTenancyPlugin(authClient)) {
        throw new Error(
          'Multi-tenancy plugin is not active. Enable multiTenancyPlugin() on the server.',
        )
      }

      const result = await authClient.multiTenancy.createTenant(data)
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
