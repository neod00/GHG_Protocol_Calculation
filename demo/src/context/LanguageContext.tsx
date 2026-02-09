"use client";
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { translations, Language, TranslationKey } from '../translations/index';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ko');

  // Load language from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('demo-language');
      if (saved === 'ko' || saved === 'en') {
        setLanguage(saved as Language);
      }
    } catch (error) {
      console.error('Failed to load language preference', error);
    }
  }, []);

  // Save language to localStorage when it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('demo-language', language);
    } catch (error) {
      console.error('Failed to save language preference', error);
    }
  }, [language]);

  const t = useCallback((key: TranslationKey | string): string => {
    const typedKey = key as TranslationKey;
    return translations[language][typedKey] || translations.en[typedKey] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
