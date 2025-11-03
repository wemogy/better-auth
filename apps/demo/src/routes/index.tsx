import { createFileRoute } from '@tanstack/react-router'
// import logo from '../logo.svg'
import { useAuth } from '../lib/auth-context'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#282c34] text-white">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        <div className="w-32 h-32 bg-cyan-600 rounded-full flex items-center justify-center mb-8 mx-auto">
          <span className="text-6xl">🚀</span>
        </div>

        {user ? (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-4">
              Welcome back, {user.email}!
            </h2>
            <p className="text-lg text-gray-300">
              You are successfully authenticated with Better Auth + Cosmos DB
            </p>
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">
              Better Auth Demo
            </h2>
            <p className="text-lg text-gray-300 mb-4">
              Sign in or create an account to test authentication
            </p>
            <p className="text-sm text-gray-400">
              This demo uses Better Auth with a custom Cosmos DB adapter
            </p>
          </div>
        )}

        <div className="flex gap-4 mb-8">
          <a
            className="text-[#61dafb] hover:underline"
            href="https://reactjs.org"
            rel="noopener noreferrer"
            target="_blank"
          >
            Learn React
          </a>
          <a
            className="text-[#61dafb] hover:underline"
            href="https://tanstack.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            Learn TanStack
          </a>
          <a
            className="text-[#61dafb] hover:underline"
            href="https://better-auth.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            Learn Better Auth
          </a>
        </div>
      </header>
    </div>
  )
}
