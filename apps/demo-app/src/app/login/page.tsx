'use client';

import { LoginForm } from '@wemogy/better-auth-react';
import { getTenantIdFromHostname } from '@/lib/subdomain';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@wemogy/better-auth-react';
import { useEffect } from 'react';

export default function LoginPage() {
  const tenantId = getTenantIdFromHostname();
  const router = useRouter();
  const { user } = useUser();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
        <h1 className="mb-2 text-2xl font-semibold text-black dark:text-zinc-50">Login</h1>
        {tenantId && (
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Tenant: <span className="font-medium">{tenantId}</span>
          </p>
        )}
        <LoginForm />
        <div className="mt-6 text-center">
          <Link href="/register" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
