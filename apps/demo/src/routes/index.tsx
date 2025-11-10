import { createFileRoute } from '@tanstack/react-router'
import { useUser } from '@wemogy/better-auth-react'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            Multi-Tenancy Cookie Test
          </h1>

          <div className="bg-gray-800 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">How to Test</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Open Tenant 1 and register/login with an account</li>
              <li>
                Open Tenant 2 in a new tab and register/login with a different
                account
              </li>
              <li>
                Switch between tabs - each tenant should maintain its own
                session
              </li>
              <li>
                Check browser cookies - you should see separate cookies:{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">
                  tenant1_session
                </code>{' '}
                and{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">
                  tenant2_session
                </code>
              </li>
            </ol>
          </div>

          {user ? (
            <div className="bg-green-900/50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-2 text-green-400">
                ✓ Authenticated
              </h2>
              <p className="text-gray-300">
                Email: <strong>{user.email}</strong>
              </p>
              <p className="text-gray-300 mt-2">
                Current Route:{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">
                  {window.location.pathname}
                </code>
              </p>
            </div>
          ) : (
            <div className="bg-yellow-900/50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-2 text-yellow-400">
                Not Authenticated
              </h2>
              <p className="text-gray-300">
                Please login or register in one of the tenants below
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-900/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">
                Tenant 1
              </h3>
              <p className="text-gray-300 mb-4 text-sm">
                Cookie:{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">
                  tenant1_session
                </code>
              </p>
              <div className="flex flex-col gap-2">
                <a
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center"
                  href="/tenant1/login"
                >
                  Login
                </a>
                <a
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center"
                  href="/tenant1/register"
                >
                  Register
                </a>
              </div>
            </div>

            <div className="bg-green-900/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-green-400">
                Tenant 2
              </h3>
              <p className="text-gray-300 mb-4 text-sm">
                Cookie:{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">
                  tenant2_session
                </code>
              </p>
              <div className="flex flex-col gap-2">
                <a
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center"
                  href="/tenant2/login"
                >
                  Login
                </a>
                <a
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center"
                  href="/tenant2/register"
                >
                  Register
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
