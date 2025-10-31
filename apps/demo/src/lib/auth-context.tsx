import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { authClient } from './auth-client'

interface AuthContextType {
  user: any
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, name?: string) => Promise<any>
  signOut: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated on mount
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession()
        setUser(session?.data?.user || null)
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // If a session already exists, avoid calling sign-in again
      const existingSession = await authClient.getSession()
      if (existingSession?.data?.user) {
        setUser(existingSession.data.user)
        return existingSession
      }

      const result = await authClient.signIn.email({ email, password })
      if (result?.data?.user) {
        setUser(result.data.user)
      }
      return result
    } catch (error: any) {
      console.error('Sign in failed:', error)

      // Verbesserte Fehlermeldungen
      let errorMessage =
        'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.'

      if (error?.code === 'INVALID_EMAIL_OR_PASSWORD') {
        errorMessage =
          'Ungültige E-Mail oder Passwort. Bitte versuchen Sie es erneut.'
      } else if (error?.code === 'USER_NOT_FOUND') {
        errorMessage =
          'Benutzer nicht gefunden. Bitte registrieren Sie sich zuerst.'
      } else if (
        error?.message?.includes('400') ||
        error?.message?.includes('Bad Request')
      ) {
        errorMessage =
          'Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.'
      } else if (error?.message) {
        errorMessage = error.message
      }

      // Gracefully handle common 400 cases (e.g., already signed in)
      try {
        const session = await authClient.getSession()
        if (session?.data?.user) {
          setUser(session.data.user)
          return session
        }
      } catch {}

      throw new Error(errorMessage)
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: name || email.split('@')[0], // Use part before @ as default name
      })
      if (result?.data?.user) {
        setUser(result.data.user)
      }
      return result
    } catch (error: any) {
      console.error('Sign up failed:', error)

      // Verbesserte Fehlermeldungen für Registrierung
      let errorMessage =
        'Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.'

      if (error?.code === 'USER_ALREADY_EXISTS') {
        errorMessage =
          'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.'
      } else if (error?.code === 'INVALID_EMAIL') {
        errorMessage = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
      } else if (error?.code === 'WEAK_PASSWORD') {
        errorMessage =
          'Das Passwort ist zu schwach. Bitte wählen Sie ein sichereres Passwort.'
      } else if (error?.message) {
        errorMessage = error.message
      }

      throw new Error(errorMessage)
    }
  }

  const signOut = async () => {
    try {
      await authClient.signOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out failed:', error)
      throw error
    }
  }

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
