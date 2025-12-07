import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { Leaf } from 'lucide-react';
import { HeaderActions } from './HeaderActions';

type User = {
  id: string;
  email?: string;
} | null;

interface HeaderProps {
  user?: User;
}

export function Header({ user }: HeaderProps = {}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-300">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            GHG Protocol <span className="text-teal-600 dark:text-teal-400">Hub</span>
          </span>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-8">
          {user ? (
            (() => {
              const isAdmin = user.email?.startsWith('neod00') || user.email === 'neod00@naver.com';
              return (
                <Link
                  href={isAdmin ? "/admin" : "/dashboard"}
                  className="text-sm font-medium text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
                >
                  Dashboard
                </Link>
              );
            })()
          ) : (
            ['Features', 'How it Works', 'Calculator', 'About'].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm font-medium text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
              >
                {item}
              </Link>
            ))
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <LanguageToggle />
          <ThemeToggle />
          <HeaderActions user={user} />
        </div>
      </div>
    </header>
  );
}