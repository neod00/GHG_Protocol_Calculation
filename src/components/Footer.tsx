"use client";
import React from 'react';
import { useTranslation } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8 dark:bg-slate-900 dark:border-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-4 text-center">
        <p className="text-slate-600 font-medium dark:text-slate-400">{t('footerCopyright')}</p>
        <p className="text-sm text-slate-400 mt-2 dark:text-slate-500">{t('footerBasedOn')}</p>
      </div>
    </footer>
  );
};