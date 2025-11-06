import React from 'react';
import { useTranslation } from '../LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-white mt-12 py-6 border-t dark:bg-gray-800 dark:border-gray-700">
      <div className="container mx-auto text-center text-gray-500 dark:text-gray-400">
        <p>{t('footerCopyright')}</p>
        <p className="text-sm mt-1">{t('footerBasedOn')}</p>
      </div>
    </footer>
  );
};