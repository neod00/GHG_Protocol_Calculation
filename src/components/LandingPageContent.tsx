"use client";

import Link from 'next/link';
import { useTranslation } from '../context/LanguageContext';
import { ArrowRight, Globe, BarChart3, Leaf } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface LandingPageContentProps {
    user: User | null;
}

export const LandingPageContent: React.FC<LandingPageContentProps> = ({ user }) => {
    const { t } = useTranslation();

    return (
        <>
            {/* Hero Section */}
            <section className="relative pt-20 pb-24 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl opacity-50 dark:bg-teal-500/5 animate-pulse-slow"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl opacity-50 dark:bg-cyan-500/5"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <div className="inline-flex items-center px-3 py-1 rounded-full border border-teal-200 bg-teal-50 text-teal-700 text-xs font-semibold uppercase tracking-wider dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-400 mb-4 animate-fade-in">
                            <span className="flex-1">{t('compliantBadge')}</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 animate-slide-up">
                            {t('landingTitle')} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-600 dark:from-teal-400 dark:to-cyan-400">{t('landingTitleHighlight')}</span>
                        </h1>

                        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            {t('landingSubtitle')}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            {!user && (
                                <Link href="/signup" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all bg-gradient-to-r from-teal-600 to-teal-500 rounded-xl hover:from-teal-500 hover:to-teal-400 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-1">
                                    {t('landingStartButton')}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Calculator Section Placeholder (Passed as children or handled by parent) - Wait, parent puts it in middle. We can just render children here if we want or split it. 
          Actually, the original structure had Hero -> Calculator -> Features. 
          I will make this component render Hero and Features, and accept Calculator as a prop or slot?
          Better: The parent page.tsx can render <LandingPageContent user={user}> <MainCalculator.../> </LandingPageContent>
      */}
        </>
    );
};

export const LandingPageFeatures: React.FC = () => {
    const { t } = useTranslation();

    return (
        <section className="py-24 bg-white dark:bg-slate-950">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <BarChart3 className="h-6 w-6 text-teal-600" />,
                            title: t('featureScope12Title'),
                            desc: t('featureScope12Desc')
                        },
                        {
                            icon: <Globe className="h-6 w-6 text-cyan-600" />,
                            title: t('featureScope3Title'),
                            desc: t('featureScope3Desc')
                        },
                        {
                            icon: <Leaf className="h-6 w-6 text-emerald-600" />,
                            title: t('featureAiTitle'),
                            desc: t('featureAiDesc')
                        }
                    ].map((feature, idx) => (
                        <div key={idx} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow group">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export const LandingHero: React.FC<LandingPageContentProps> = ({ user }) => {
    const { t } = useTranslation();

    return (
        <section className="relative pt-20 pb-24 overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl opacity-50 dark:bg-teal-500/5 animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl opacity-50 dark:bg-cyan-500/5"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center px-3 py-1 rounded-full border border-teal-200 bg-teal-50 text-teal-700 text-xs font-semibold uppercase tracking-wider dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-400 mb-4 animate-fade-in">
                        <span className="flex-1">{t('compliantBadge')}</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 animate-slide-up">
                        {t('landingTitle')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-600 dark:from-teal-400 dark:to-cyan-400">{t('landingTitleHighlight')}</span>
                    </h1>

                    <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        {t('landingSubtitle')}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        {!user && (
                            <Link href="/signup" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all bg-gradient-to-r from-teal-600 to-teal-500 rounded-xl hover:from-teal-500 hover:to-teal-400 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-1">
                                {t('landingStartButton')}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
