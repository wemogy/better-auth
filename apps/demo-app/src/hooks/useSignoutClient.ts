'use client';

import { useState } from 'react';
import { authClient } from '@/lib/authClient';

export function useSignoutClient() {
  const [isLoading, setIsLoading] = useState(false);

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authClient.signOut();
      // Redirect to home page after sign out
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { signOut, isLoading };
}
