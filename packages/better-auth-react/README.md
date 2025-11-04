# @wemogy/better-auth-react

UI components and hooks for better-auth-cosmos authentication.

## Installation

```bash
pnpm add @wemogy/better-auth-react
```

## Usage

### Setup with Provider

For better performance and to avoid creating multiple auth clients, wrap your app with the AuthProvider:

```tsx
import { createAuthClient } from 'better-auth/react'
import { AuthProvider } from '@wemogy/better-auth-react'

const authClient = createAuthClient({ baseURL: 'http://localhost:3001' })

function App() {
  return (
    <AuthProvider authClient={authClient}>
      {/* Your app components */}
    </AuthProvider>
  )
}
```

The AuthProvider requires an authClient prop - you must create and pass your own authClient instance.

### Hooks

#### useUser

```tsx
import { useUser } from '@wemogy/better-auth-react'

function App() {
  const { user, isLoading } = useUser('http://localhost:3001')

  if (isLoading) return <div>Loading...</div>

  return <div>{user ? `Hello ${user.name}` : 'Not logged in'}</div>
}
```

#### useUserSettings

```tsx
import { useUserSettings } from '@wemogy/better-auth-react'

function UserSettings() {
  const { changePassword, updateProfile, isLoading, error } = useUserSettings(
    'http://localhost:3001',
  )

  const handleChangePassword = async () => {
    try {
      await changePassword('oldPassword', 'newPassword')
      alert('Password changed successfully')
    } catch (err) {
      alert('Failed to change password')
    }
  }

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({ name: 'New Name' })
      alert('Profile updated successfully')
    } catch (err) {
      alert('Failed to update profile')
    }
  }

  return (
    <div>
      <button onClick={handleChangePassword} disabled={isLoading}>
        Change Password
      </button>
      <button onClick={handleUpdateProfile} disabled={isLoading}>
        Update Profile
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  )
}
```

### Components

The components use minimal Tailwind CSS styling and accept a `className` prop for customization.

When using the AuthProvider, you can omit the `baseURL` prop (recommended for better performance). Otherwise, provide it directly.

```tsx
import {
  RegisterForm,
  LoginForm,
  PasswordResetForm,
  TwoFactorSetup,
} from '@wemogy/better-auth-react'

function AuthPage() {
  return (
    <div>
      <h2>Register</h2>
      <RegisterForm /> {/* Uses authClient from Provider */}
      <h2>Login</h2>
      <LoginForm /> {/* Uses authClient from Provider */}
      <h2>Reset Password</h2>
      <PasswordResetForm /> {/* Uses authClient from Provider */}
      <h2>Setup 2FA</h2>
      <TwoFactorSetup
        onSetup={async () => {
          // Your 2FA setup logic here
          // Return { uri, secret }
          return { uri: 'otpauth://...', secret: 'JBSWY3DPEHPK3PXP' }
        }}
        onVerify={async (code) => {
          // Your 2FA verification logic here
          // Throw error if invalid
        }}
      />
    </div>
  )
}
```

Or provide baseURL directly (creates new authClient instances):

```tsx
<RegisterForm baseURL="http://localhost:3001" />
```

## Customization

Override styles by passing a custom `className`:

```tsx
<RegisterForm
  baseURL="http://localhost:3001"
  className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md"
/>
```
