import { Link } from '@tanstack/react-router'
import { useSignout, useUser } from '@wemogy/better-auth-react'
import React from 'react'

interface IHeaderProps {}

const Header: React.FC<IHeaderProps> = () => {
  const { user, isLoading } = useUser()
  const { signOut } = useSignout()

  return (
    <header className="p-4 flex items-center justify-between bg-gray-800 text-white shadow-lg">
      <Link
        className="text-xl font-semibold hover:text-cyan-400 transition-colors"
        to="/"
      >
        Multi-Tenancy Demo
      </Link>

      <div className="flex items-center gap-4">
        {!isLoading && user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">{user.email}</span>
            <button
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
              onClick={signOut}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
