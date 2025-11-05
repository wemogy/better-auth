import { useState } from 'react'
import { useAuthClient } from '../../AuthProvider'

interface UseSwitchTenantReturn {
  switchTenant: (tenantId: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

function checkMultiTenancyPlugin(authClient: any): boolean {
  return authClient?.$plugins?.some((p: any) => p.id === 'multi-tenancy')
}

export function useSwitchTenant(): UseSwitchTenantReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authClient = useAuthClient()

  const switchTenant = async (tenantId: string): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      if (!checkMultiTenancyPlugin(authClient)) {
        throw new Error(
          'Multi-tenancy plugin is not active. Enable multiTenancyPlugin() on the server.',
        )
      }

      await authClient.multiTenancy.switchTenant({ tenantId })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to switch tenant'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    switchTenant,
    isLoading,
    error,
  }
}
