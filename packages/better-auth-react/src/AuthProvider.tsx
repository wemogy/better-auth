import { type ReactNode } from 'react'
import type { AuthClient } from './types/auth-client'
import { AuthContext } from './hooks/useAuthClient'

interface AuthProviderProps {
  children: ReactNode
  authClient: AuthClient
}

export function AuthProvider({ children, authClient }: AuthProviderProps) {
  const value = {
    authClient,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
