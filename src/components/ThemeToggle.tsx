"use client";
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { IconSun, IconMoon } from './IconComponents';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
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
