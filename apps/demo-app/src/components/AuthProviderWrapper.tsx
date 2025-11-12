'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '@wemogy/better-auth-react';
import { authClient, updateTenantContextFromSubdomain } from '@/lib/authClient';

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  // Update tenant context when component mounts or subdomain changes
  useEffect(() => {
    updateTenantContextFromSubdomain();

    // Listen for navigation events that might change the subdomain
    const handleFocus = () => {
      updateTenantContextFromSubdomain();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
  //@ts-expect-error - authClient is defined in authClient.ts
  return <AuthProvider authClient={authClient}>{children}</AuthProvider>;
}
