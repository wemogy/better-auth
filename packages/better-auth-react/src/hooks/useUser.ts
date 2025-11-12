import { useEffect, useState } from 'react'
import { useAuthClient } from './useAuthClient'
import type { AuthClient } from '../types/auth-client'
import type { User } from 'better-auth'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const authClient: AuthClient = useAuthClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const session = await authClient.getSession()
        setUser(session?.data?.user || null)
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [authClient])

  return { user, isLoading }
}
