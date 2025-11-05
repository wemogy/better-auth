import { createFileRoute } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { LoginForm } from '@wemogy/better-auth-react'
import { useUser } from '@wemogy/better-auth-react'
import { useEffect } from 'react'

export const Route = createFileRoute('/tenant2/login')({
  component: Tenant2Login,
})

function Tenant2Login() {
  const { user } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate({ to: '/' })
    }
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold text-white text-center mb-4">
          Tenant 2 - Sign In
        </h2>

        <div className="bg-green-900/50 rounded-md p-3 mb-6 text-xs text-gray-300">
          <p className="font-medium text-green-400 mb-1">Tenant 2 Login:</p>
          <p>Use any email/password combination</p>
          <p>This tenant is isolated from Tenant 1</p>
        </div>

        <LoginForm
          className="text-white"
          onSuccess={() => {
            navigate({ to: '/' })
          }}
        />

        <div className="mt-6 text-center space-y-2">
          <button
            className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors block w-full"
            onClick={() => navigate({ to: '/tenant2/register' })}
          >
            Don't have an account? Sign up for Tenant 2
          </button>
          <button
            className="text-gray-400 hover:text-gray-300 text-sm transition-colors block w-full"
            onClick={() => navigate({ to: '/tenant1/login' })}
          >
            Switch to Tenant 1
          </button>
          <button
            className="text-gray-400 hover:text-gray-300 text-sm transition-colors block w-full"
            onClick={() => navigate({ to: '/login' })}
          >
            ← Global Login
          </button>
        </div>
      </div>
    </div>
  )
}
