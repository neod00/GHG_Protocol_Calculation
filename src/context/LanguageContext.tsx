"use client";
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { translations, Language, TranslationKey, Translations } from '../translations/index';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey | string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ko');

  // Load language from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('language');
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
      localStorage.setItem('language', language);
    } catch (error) {
      console.error('Failed to save language preference', error);
    }
  }, [language]);

  const t = useCallback((key: TranslationKey | string, params?: Record<string, string | number>): string => {
    // Fix: Ensure fallback to English works correctly even with partial translations for 'ko'.
    const typedKey = key as TranslationKey;
    let translation = (translations[language] as Translations)[typedKey] || translations.en[typedKey] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(paramValue));
      });
    }

    return translation;
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
