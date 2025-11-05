import { Link } from '@tanstack/react-router'
import { useSignout, useUser } from '@wemogy/better-auth-react'
import { Home, Menu, X, User, LogOut } from 'lucide-react'
import React from 'react'
import { useState } from 'react'

interface IHeaderProps {}

const Header: React.FC<IHeaderProps> = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, isLoading } = useUser()

  const { signOut } = useSignout()

  return (
    <>
      <header className="p-4 flex items-center justify-between bg-gray-800 text-white shadow-lg">
        <div className="flex items-center">
          <button
            aria-label="Open menu"
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            onClick={() => setIsOpen(true)}
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-4 text-xl font-semibold">
            <Link to="/">
              <img
                alt="TanStack Logo"
                className="h-10"
                src="/tanstack-word-logo-white.svg"
              />
            </Link>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {!isLoading &&
            (user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <User size={20} />
                  <span className="text-sm">{user.email}</span>
                </div>
                <button
                  className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  onClick={signOut}
                >
                  <LogOut size={16} />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                className="flex items-center gap-2 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
                to="/login"
              >
                <User size={16} />
                <span className="text-sm">Login</span>
              </Link>
            ))}
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            aria-label="Close menu"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            to="/"
            onClick={() => setIsOpen(false)}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            to="/login"
            onClick={() => setIsOpen(false)}
          >
            <User size={20} />
            <span className="font-medium">Login</span>
          </Link>

          {/* Demo Links Start */}

          {/* Demo Links End */}
        </nav>
      </aside>
    </>
  )
}

export default Header
