import { useState } from 'react'
import { useAuthClient } from './useAuthClient'
import type { AuthClient } from '../types/auth-client'

export function useSignout() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authClient: AuthClient = useAuthClient()

  const signOut = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await authClient.signOut()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign out'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return { signOut, isLoading, error }
}
