import React, { useState, useEffect, useCallback } from 'react'
import { authClient } from '../lib/authClient'

interface ITenantManagerProps {}

interface Tenant {
  id: string
  name: string
  description?: string
  createdAt: string
}

const TenantManager: React.FC<ITenantManagerProps> = () => {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load available tenants
  const loadTenants = useCallback(async () => {
    try {
      setLoading(true)
      // Use authClient plugin methods
      const response = await authClient.multiTenancy.tenants()
      if (response.data && !response.error) {
        const tenantData = response.data as { tenants: Tenant[] }
        setTenants(tenantData.tenants || [])
        // Set first tenant as current if none selected
        if (tenantData.tenants?.length > 0 && !currentTenant) {
          setCurrentTenant(tenantData.tenants[0])
        }
      }
    } catch (err) {
      setError('Failed to load tenants')
      // eslint-disable-next-line no-console
      console.error('Load tenants error:', err)
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  // Create a new tenant
  const createTenant = useCallback(async () => {
    const tenantName = prompt('Enter tenant name:')
    if (!tenantName) return

    try {
      setLoading(true)
      const response = await authClient.multiTenancy.createTenant({
        name: tenantName,
        description: `Tenant created on ${new Date().toLocaleDateString()}`,
      })

      if (response.data && !response.error) {
        const tenantData = response.data as { tenant: Tenant }
        setTenants((prev) => [...prev, tenantData.tenant])
        setCurrentTenant(tenantData.tenant)
        setError('')
      }
    } catch (err) {
      setError('Failed to create tenant')
      // eslint-disable-next-line no-console
      console.error('Create tenant error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Switch to a different tenant
  const switchTenant = useCallback(
    async (tenantId: string) => {
      try {
        setLoading(true)
        await authClient.multiTenancy.switchTenant({ tenantId })
        const tenant = tenants.find((t) => t.id === tenantId)
        if (tenant) {
          setCurrentTenant(tenant)
          setError('')
        }
      } catch (err) {
        setError('Failed to switch tenant')
        // eslint-disable-next-line no-console
        console.error('Switch tenant error:', err)
      } finally {
        setLoading(false)
      }
    },
    [tenants],
  )

  useEffect(() => {
    loadTenants()
  }, [loadTenants])

  if (tenants.length === 0 && !loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Multi-Tenancy Demo
        </h3>
        <p className="text-gray-300 mb-4">
          You don't have any tenants yet. Create your first tenant to start
          using multi-tenancy features.
        </p>
        <button
          className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          disabled={loading}
          onClick={createTenant}
        >
          {loading ? 'Creating...' : 'Create First Tenant'}
        </button>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Multi-Tenancy Demo
      </h3>

      {currentTenant && (
        <div className="mb-4">
          <p className="text-gray-300">
            <span className="font-medium">Current Tenant:</span>{' '}
            {currentTenant.name}
          </p>
          {currentTenant.description && (
            <p className="text-gray-400 text-sm">{currentTenant.description}</p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Switch Tenant:
          </label>
          <select
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={loading}
            value={currentTenant?.id || ''}
            onChange={(e) => switchTenant(e.target.value)}
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            disabled={loading}
            onClick={createTenant}
          >
            {loading ? 'Creating...' : 'Create Tenant'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

      <div className="mt-4 text-xs text-gray-400">
        <p>This demo shows how multi-tenancy works with Better Auth.</p>
        <p>
          Create multiple tenants and switch between them to see isolation in
          action.
        </p>
      </div>
    </div>
  )
}

export default TenantManager
