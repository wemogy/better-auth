import { useTenants } from '../../hooks/multi-tenancy/useTenants'
import { useSwitchTenant } from '../../hooks/multi-tenancy/useSwitchTenant'
import { useUser } from '../../hooks/useUser'

interface Tenant {
  id: string
  name: string
  description?: string
  createdAt: string
}

interface TenantSelectorProps {
  className?: string
  showCreateButton?: boolean
  onCreateClick?: () => void
}

export function TenantSelector({
  className = '',
  showCreateButton = true,
  onCreateClick,
}: TenantSelectorProps) {
  const { user } = useUser()
  const { tenants, isLoading, error } = useTenants()
  const { switchTenant, isLoading: isSwitching } = useSwitchTenant()

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <div className={`p-4 bg-gray-800 rounded-lg ${className}`}>
        <div className="text-sm text-gray-400">Loading tenants...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-900/50 rounded-lg ${className}`}>
        <div className="text-sm text-red-400">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className={`p-4 bg-gray-800 rounded-lg ${className}`}>
      <h3 className="text-sm font-medium text-gray-300 mb-3">Your Tenants</h3>

      {tenants.length === 0 ? (
        <div className="text-sm text-gray-400 mb-3">
          No tenants found. Create your first tenant to get started.
        </div>
      ) : (
        <div className="space-y-2 mb-3">
          {tenants.map((tenant: Tenant) => (
            <button
              key={tenant.id}
              onClick={() => switchTenant(tenant.id)}
              disabled={isSwitching}
              className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-sm font-medium text-white">
                {tenant.name}
              </div>
              {tenant.description && (
                <div className="text-xs text-gray-400">
                  {tenant.description}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {showCreateButton && (
        <button
          onClick={onCreateClick}
          className="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          Create New Tenant
        </button>
      )}
    </div>
  )
}
