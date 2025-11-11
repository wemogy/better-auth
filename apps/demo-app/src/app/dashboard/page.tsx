'use client';

import { useUser, useSignout } from '@wemogy/better-auth-react';
import { TenantSelector } from '@wemogy/better-auth-react';
import Link from 'next/link';
import { getTenantIdFromHostname } from '@/lib/subdomain';

export default function DashboardPage() {
  const { user, isLoading } = useUser();
  const { signOut } = useSignout();
  const tenantId = getTenantIdFromHostname();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">You are not logged in</p>
          <Link href="/login" className="rounded-full bg-black px-5 py-2 text-white dark:bg-white dark:text-black">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
        <h1 className="mb-2 text-2xl font-semibold text-black dark:text-zinc-50">Dashboard</h1>
        {tenantId && (
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Current Tenant: <span className="font-medium">{tenantId}</span>
          </p>
        )}
        <div className="mb-6 space-y-4">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Email:</p>
            <p className="text-lg font-medium text-black dark:text-zinc-50">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Name:</p>
            <p className="text-lg font-medium text-black dark:text-zinc-50">{user.name || 'Not set'}</p>
          </div>
        </div>
        <div className="mb-6">
          <TenantSelector showCreateButton={false} />
        </div>
        <button onClick={() => signOut()} className="rounded-full bg-red-600 px-5 py-2 text-white transition-colors hover:bg-red-700">
          Sign Out
        </button>
      </div>
    </div>
  );
}
