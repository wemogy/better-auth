import { useEffect, useState } from 'react'
import { useAuthClient } from '../AuthProvider'

interface User {
  id: string
  email: string
  name?: string
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const authClient = useAuthClient()

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
