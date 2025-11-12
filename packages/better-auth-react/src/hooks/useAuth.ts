import { useEffect, useState } from 'react'
import { useAuthClient } from './useAuthClient'
import type { AuthClient } from '../types/auth-client'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const authClient: AuthClient = useAuthClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession()
        setIsAuthenticated(!!session?.data?.user)
      } catch {
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [authClient])

  return { isAuthenticated, isLoading }
}
