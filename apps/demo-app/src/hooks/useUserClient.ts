'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/authClient';
import type { User } from 'better-auth';

export function useUserClient() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const session = await authClient.getSession();
        setUser(session?.data?.user || null);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  return { user, isLoading };
}
