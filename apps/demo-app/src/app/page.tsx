'use client';

import { useUser } from '@wemogy/better-auth-react';
import Link from 'next/link';
import { getTenantIdFromHostname, getSubdomain } from '@/lib/subdomain';

export default function Home() {
  const { user, isLoading } = useUser();
  const tenantId = getTenantIdFromHostname();
  const subdomain = typeof window !== 'undefined' ? getSubdomain(window.location.hostname) : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">Better Auth Demo</h1>
          {subdomain && (
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Subdomain: <span className="font-mono font-medium">{subdomain}</span>
              {tenantId && (
                <>
                  {' '}
                  • Tenant: <span className="font-mono font-medium">{tenantId}</span>
                </>
              )}
            </p>
          )}
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {isLoading ? 'Loading...' : user ? `Welcome, ${user.email || user.name || 'User'}!` : 'Get started by logging in to your account.'}
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          {user ? (
            <Link
              href="/dashboard"
              className="flex h-12 w-full items-center justify-center rounded-full bg-black px-5 text-white transition-colors hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] md:w-[158px]"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="flex h-12 w-full items-center justify-center rounded-full bg-black px-5 text-white transition-colors hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] md:w-[158px]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/8 px-5 transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
