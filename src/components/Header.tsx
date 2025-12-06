"use client";
import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { ThemeToggle } from './ThemeToggle';

export const Header: React.FC = () => {
  const { t, setLanguage, language } = useTranslation();

  const buttonClasses = (lang: string) =>
    `relative px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 ${language === lang
      ? 'text-white shadow-lg shadow-emerald-500/30 bg-gradient-to-r from-emerald-500 to-teal-500'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300 glass dark:glass-dark">
      <div className="container mx-auto px-4 py-5 md:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left relative group cursor-default">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">
                {t('headerTitle')}
              </h1>
              <p className="mt-1 text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium tracking-wide">
                {t('headerSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <AuthButtons />
            <div className="flex p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-full border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 shadow-inner">
              <button onClick={() => setLanguage('en')} className={buttonClasses('en')}>
                EN
              </button>
              <button onClick={() => setLanguage('ko')} className={buttonClasses('ko')}>
                KO
              </button>
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

function AuthButtons() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading) return null;

  const isAdmin = user?.email?.startsWith('neod00') || user?.email === 'neod00@naver.com';

  if (user) {
    return (
      <div className="flex items-center gap-4">
        {isAdmin && (
          <a href="/admin" className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-500">
            Admin
          </a>
        )}
        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {user.email}
        </div>
        <form action="/auth/signout" method="post" onSubmit={async (e) => {
          e.preventDefault();
          const { logout } = await import('@/app/auth/actions');
          await logout();
        }}>
          <button type="submit" className="text-sm font-semibold text-red-500 hover:text-red-400">
            Sign Out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <a href="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-500">
        Log In
      </a>
      <a href="/signup" className="text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-full">
        Sign Up
      </a>
    </div>
  );
}