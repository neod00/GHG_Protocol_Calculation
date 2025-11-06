import React from 'react';
import { useTheme } from '../ThemeContext';
import { IconSun, IconMoon } from './IconComponents';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-white bg-ghg-green/50 hover:bg-ghg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ghg-green dark:focus:ring-offset-ghg-dark focus:ring-white transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <IconMoon className="h-5 w-5" />
      ) : (
        <IconSun className="h-5 w-5" />
      )}
    </button>
  );
};
