import { createFileRoute } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import {
  AuthProvider,
  RegisterForm,
  LoginForm,
} from '@wemogy/better-auth-react'
import { createAuthClient } from 'better-auth/react'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/auth-ui')({
  component: AuthUI,
})

const authClient = createAuthClient({
  baseURL: 'http://localhost:3001',
})

function AuthUI() {
  const [isSignUp, setIsSignUp] = useState(false)
  const navigate = useNavigate()

  // Redirect if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession()
        if (session?.data?.user) {
          navigate({ to: '/' })
        }
      } catch {
        // Not authenticated, stay on page
      }
    }
    checkAuth()
  }, [navigate])

  return (
    <AuthProvider authClient={authClient}>
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          {!isSignUp && (
            <div className="bg-gray-700/50 rounded-md p-3 mb-6 text-xs text-gray-300">
              <p className="font-medium text-cyan-400 mb-1">Test-Account:</p>
              <p>Email: testuser@example.com</p>
              <p>Passwort: testpassword123</p>
            </div>
          )}

          {isSignUp ? <RegisterForm /> : <LoginForm />}

          <div className="mt-6 text-center">
            <button
              className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              onClick={() => navigate({ to: '/login' })}
            >
              ← Back to custom login
            </button>
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}
