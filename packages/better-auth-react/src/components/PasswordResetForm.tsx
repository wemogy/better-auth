import { useState } from 'react'
import { useAuthClient } from '../hooks/useAuthClient'
import type { AuthClient } from '../types/auth-client'

interface PasswordResetFormProps {
  className?: string
}

export function PasswordResetForm({ className = '' }: PasswordResetFormProps) {
  const authClient: AuthClient = useAuthClient()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      await authClient.forgetPassword({ email })
      setMessage('Password reset email sent. Check your inbox.')
    } catch (err: unknown) {
      setMessage(
        err instanceof Error ? err.message : 'Failed to send reset email',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {message && (
        <p
          className={
            message.includes('sent')
              ? 'text-green-600 text-sm'
              : 'text-red-600 text-sm'
          }
        >
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isLoading ? 'Sending...' : 'Send Reset Email'}
      </button>
    </form>
  )
}
