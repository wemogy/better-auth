import { useState } from 'react'
import { useAuthClient } from './useAuthClient'
import type { AuthClient } from '../types/auth-client'

export function useUserSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authClient: AuthClient = useAuthClient()

  const changePassword = async (oldPassword: string, newPassword: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await authClient.changePassword({
        newPassword,
        currentPassword: oldPassword,
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to change password'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (data: { name?: string; email?: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      await authClient.updateUser(data)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update profile'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    changePassword,
    updateProfile,
    isLoading,
    error,
  }
}
