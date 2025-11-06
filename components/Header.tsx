import React from 'react';
import { useTranslation } from '../LanguageContext';
import { ThemeToggle } from './ThemeToggle';

export const Header: React.FC = () => {
  const { t, setLanguage, language } = useTranslation();

  const buttonClasses = (lang: string) => 
    `px-3 py-1 text-sm rounded-md transition-colors ${
      language === lang 
        ? 'bg-ghg-accent text-white font-semibold' 
        : 'bg-ghg-light-green text-white hover:bg-ghg-accent'
    }`;


  return (
    <header className="bg-ghg-green shadow-md dark:bg-ghg-dark">
      <div className="container mx-auto px-4 py-6 md:px-8">
        <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {t('headerTitle')}
              </h1>
              <p className="mt-1 text-ghg-light-green dark:text-gray-300">
                {t('headerSubtitle')}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <button onClick={() => setLanguage('en')} className={buttonClasses('en')}>
                  EN
                </button>
                <button onClick={() => setLanguage('ko')} className={buttonClasses('ko')}>
                  KO
                </button>
              </div>
              <ThemeToggle />
            </div>
        </div>
      </div>
    </header>
  );
};