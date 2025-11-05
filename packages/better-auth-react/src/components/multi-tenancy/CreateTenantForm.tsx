import React, { useState } from 'react'
import { useCreateTenant } from '../../hooks/multi-tenancy/useCreateTenant'

interface CreateTenantFormProps {
  className?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateTenantForm({
  className = '',
  onSuccess,
  onCancel,
}: CreateTenantFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { createTenant, isLoading, error } = useCreateTenant()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    try {
      await createTenant({
        name: name.trim(),
        description: description.trim() || undefined,
      })

      setName('')
      setDescription('')
      onSuccess?.()
    } catch (err) {
      // Error is handled by the hook
    }
  }

  return (
    <div className={`p-4 bg-gray-800 rounded-lg ${className}`}>
      <h3 className="text-lg font-medium text-white mb-4">Create New Tenant</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="tenant-name"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Tenant Name *
          </label>
          <input
            id="tenant-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Enter tenant name"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="tenant-description"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Description (optional)
          </label>
          <textarea
            id="tenant-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
            placeholder="Enter tenant description"
            rows={3}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-900/50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Tenant'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
