'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout } from '@/app/auth/actions';

type User = {
  id: string;
  email?: string;
} | null;

interface HeaderActionsProps {
  user?: User;
}

export function HeaderActions({ user }: HeaderActionsProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  if (user) {
    const isAdmin = user.email?.startsWith('neod00') || user.email === 'neod00@naver.com';
    
    return (
      <>
        {isAdmin ? (
          <Link
            href="/admin"
            className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors dark:bg-slate-800 dark:text-purple-400 dark:hover:bg-slate-700"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors dark:bg-slate-800 dark:text-teal-400 dark:hover:bg-slate-700"
          >
            Dashboard
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="inline-flex px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md shadow-red-500/20 transition-all hover:scale-105"
        >
          Logout
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors dark:bg-slate-800 dark:text-teal-400 dark:hover:bg-slate-700"
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className="inline-flex px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md shadow-teal-500/20 transition-all hover:scale-105"
      >
        Get Started
      </Link>
    </>
  );
}
