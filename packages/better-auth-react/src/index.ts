// Export types
export type {
  AuthClient,
  SignInEmailOptions,
  SignUpEmailOptions,
  CreateTenantData,
  Tenant,
  GetSessionResult,
  ChangePasswordOptions,
  UpdateUserData,
} from './types/auth-client'

// Export hooks
export { useAuth } from './hooks/useAuth'
export { useAuthClient } from './hooks/useAuthClient'
export { useSignout } from './hooks/useSignout'
export { useUser } from './hooks/useUser'
export { useUserSettings } from './hooks/useUserSettings'

// Export components
export { AuthProvider } from './AuthProvider'
export { LoginForm } from './components/LoginForm'
export { PasswordResetForm } from './components/PasswordResetForm'
export { RegisterForm } from './components/RegisterForm'
export { CreateTenantForm } from './components/multi-tenancy/CreateTenantForm'
export { TwoFactorSetup } from './components/two-factor/TwoFactorSetup'

// Export multi-tenancy hooks
export { useCreateTenant } from './hooks/multi-tenancy/useCreateTenant'
export { useSwitchTenant } from './hooks/multi-tenancy/useSwitchTenant'
export { useTenants } from './hooks/multi-tenancy/useTenants'
