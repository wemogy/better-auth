import { useEffect, useState } from 'react'
import { useAuthClient } from '../useAuthClient'
import type { AuthClient, Tenant } from '../../types/auth-client'

interface UseTenantsReturn {
  tenants: Tenant[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

function checkMultiTenancyPlugin(authClient: AuthClient): boolean {
  return authClient?.$plugins?.some((p) => p.id === 'multi-tenancy') ?? false
}

export function useTenants(): UseTenantsReturn {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const authClient: AuthClient = useAuthClient()

  const fetchTenants = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!checkMultiTenancyPlugin(authClient)) {
        setError(
          'Multi-tenancy plugin is not active. Enable multiTenancyPlugin() on the server.',
        )
        return
      }

      const result = await authClient.multiTenancy!.tenants()
      setTenants(result.tenants || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tenants')
      console.error('Error fetching tenants:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [authClient])

  return {
    tenants,
    isLoading,
    error,
    refetch: fetchTenants,
  }
}
