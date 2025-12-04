
"use client";
"use client";

import React from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { IconSun, IconMoon } from '@/components/IconComponents';

export const SettingsClient: React.FC<{ userEmail: string | undefined }> = ({ userEmail }) => {
    const { language, setLanguage, t } = useTranslation();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">{t('settings')}</h1>

            <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('preferences')}</h2>
                <div className="space-y-6">
                    {/* Language Setting */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('language')}</label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('select_language')}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setLanguage('ko')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${language === 'ko'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                                    }`}
                            >
                                한국어
                            </button>
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${language === 'en'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                                    }`}
                            >
                                English
                            </button>
                        </div>
                    </div>

                    {/* Theme Setting */}
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 pt-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('theme')}</label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('toggle_theme')}</p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="flex items-center px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-gray-300"
                        >
                            {theme === 'light' ? (
                                <>
                                    <IconMoon className="h-5 w-5 mr-2" />
                                    <span>{t('switch_to_dark')}</span>
                                </>
                            ) : (
                                <>
                                    <IconSun className="h-5 w-5 mr-2" />
                                    <span>{t('switch_to_light')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('profile_settings')}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
                        <div className="mt-1 p-2 block w-full rounded-md border-gray-300 bg-gray-50 dark:bg-slate-700 dark:text-gray-300">
                            {userEmail}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{t('managed_by_supabase')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('organization_settings')}</h2>
                <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                    <p className="text-yellow-800 dark:text-yellow-200">
                        {t('org_features_coming_soon')}
                    </p>
                </div>
            </div>
        </div>
    );
};
