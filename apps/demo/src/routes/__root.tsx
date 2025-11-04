import { TanStackDevtools } from '@tanstack/react-devtools'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { AuthProvider } from '@wemogy/better-auth-react'
import Header from '../components/Header'
import { authClient } from '../lib/authClient'

export const Route = createRootRoute({
  component: () => (
    <AuthProvider authClient={authClient}>
      <Header />
      <Outlet />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </AuthProvider>
  ),
})
