import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth-context'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate({ to: '/' })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
      navigate({ to: '/' })
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold text-white text-center mb-4">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>

        {!isSignUp && (
          <div className="bg-gray-700/50 rounded-md p-3 mb-6 text-xs text-gray-300">
            <p className="font-medium text-cyan-400 mb-1">Test-Account:</p>
            <p>Email: testuser@example.com</p>
            <p>Passwort: testpassword123</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/50 border border-red-500/30 rounded-md p-4 mb-4">
              <div className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Fehler:</span>
              </div>
              <p className="mt-2 text-center">{error}</p>
              {error.includes('nicht gefunden') && (
                <div className="mt-3 text-center">
                  <button
                    onClick={() => setIsSignUp(true)}
                    className="text-cyan-400 hover:text-cyan-300 underline text-sm"
                  >
                    Jetzt registrieren
                  </button>
                </div>
              )}
              {error.includes('bereits registriert') && (
                <div className="mt-3 text-center">
                  <button
                    onClick={() => setIsSignUp(false)}
                    className="text-cyan-400 hover:text-cyan-300 underline text-sm"
                  >
                    Zum Login
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}
