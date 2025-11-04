import { createContext, useContext, type ReactNode } from 'react'

interface AuthContextType {
  authClient: any
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
  authClient: any
}

export function AuthProvider({ children, authClient }: AuthProviderProps) {
  const value = {
    authClient,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthClient(): any {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthClient must be used within an AuthProvider')
  }
  return context.authClient
}
