import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { authClient } from './authClient'

type User = {
  id: string
  email: string
  name?: string
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, name?: string) => Promise<any>
  signOut: () => Promise<any>
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated on mount
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession()
        setUser(session?.data?.user || null)
      } catch {
        // Auth check failed, but continue
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
    } catch (error: unknown) {
      // Sign in failed

      // Verbesserte Fehlermeldungen
      let errorMessage =
        'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.'

      const err = error as any
      if (err?.code === 'INVALID_EMAIL_OR_PASSWORD') {
        errorMessage =
          'Ungültige E-Mail oder Passwort. Bitte versuchen Sie es erneut.'
      } else if (err?.code === 'USER_NOT_FOUND') {
        errorMessage =
          'Benutzer nicht gefunden. Bitte registrieren Sie sich zuerst.'
      } else if (
        err?.message?.includes('400') ||
        err?.message?.includes('Bad Request')
      ) {
        errorMessage =
          'Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.'
      } else if (err?.message) {
        errorMessage = err.message
      }

      // Gracefully handle common 400 cases (e.g., already signed in)
      try {
        const session = await authClient.getSession()
        if (session?.data?.user) {
          setUser(session.data.user)
          return session
        }
      } catch {
        // Ignore
      }

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
    } catch (error: unknown) {
      // Sign up failed

      // Verbesserte Fehlermeldungen für Registrierung
      let errorMessage =
        'Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.'

      const err = error as any
      if (err?.code === 'USER_ALREADY_EXISTS') {
        errorMessage =
          'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.'
      } else if (err?.code === 'INVALID_EMAIL') {
        errorMessage = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
      } else if (err?.code === 'WEAK_PASSWORD') {
        errorMessage =
          'Das Passwort ist zu schwach. Bitte wählen Sie ein sichereres Passwort.'
      } else if (err?.message) {
        errorMessage = err.message
      }

      throw new Error(errorMessage)
    }
  }

  const signOut = async () => {
    await authClient.signOut()
    setUser(null)
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
