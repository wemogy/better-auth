import { useState } from 'react'
import { useAuthClient } from '../AuthProvider'

interface UserProfile {
  name?: string
  email?: string
  // Add other profile fields as needed
}

export function useUserSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authClient = useAuthClient()

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
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (data: UserProfile) => {
    setIsLoading(true)
    setError(null)

    try {
      await authClient.updateUser(data)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update profile'
      setError(message)
      throw err
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
