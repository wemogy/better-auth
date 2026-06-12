'use client';

import { RegisterFormClient } from '@/components/RegisterFormClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserClient } from '@/hooks/useUserClient';
import { useEffect } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const { user } = useUserClient();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
        <h1 className="mb-2 text-2xl font-semibold text-black dark:text-zinc-50">Register</h1>
        <RegisterFormClient onSuccess={handleSuccess} />
        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
