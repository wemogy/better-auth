import { useState } from 'react'
import { useAuthClient } from '../useAuthClient'
import type { AuthClient } from '../../types/auth-client'

interface UseSwitchTenantReturn {
  switchTenant: (tenantId: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

function checkMultiTenancyPlugin(authClient: AuthClient): boolean {
  return authClient?.$plugins?.some((p) => p.id === 'multi-tenancy') ?? false
}

export function useSwitchTenant(): UseSwitchTenantReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authClient: AuthClient = useAuthClient()

  const switchTenant = async (tenantId: string): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      if (!checkMultiTenancyPlugin(authClient)) {
        setError(
          'Multi-tenancy plugin is not active. Enable multiTenancyPlugin() on the server.',
        )
        return
      }

      await authClient.multiTenancy!.switchTenant({ tenantId })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to switch tenant'
      setError(errorMessage)
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
