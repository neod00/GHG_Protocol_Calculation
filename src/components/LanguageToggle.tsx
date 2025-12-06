"use client";
import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
    const { language, setLanguage } = useTranslation();

    const toggleLanguage = () => {
        setLanguage(language === 'ko' ? 'en' : 'ko');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 font-medium text-sm flex items-center gap-1"
            aria-label="Toggle language"
        >
            <Globe className="h-4 w-4" />
            <span>{language === 'ko' ? 'EN' : 'KO'}</span>
        </button>
    );
};
