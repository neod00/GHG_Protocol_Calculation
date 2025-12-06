'use client'

import { useActionState } from 'react'
import { signup } from '../auth/actions'
import Link from 'next/link'
import { IconUserPlus } from '@/components/IconComponents'
import { useTranslation } from '@/context/LanguageContext'

const initialState = {
    error: '',
}

export default function SignupPage() {
    const [state, formAction] = useActionState(signup, initialState)
    const { t } = useTranslation()

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
            {/* Background Grid & Gradient */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

            <div className="w-full max-w-md p-8 relative z-10 animate-fade-in-up">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6 transform hover:scale-105 transition-transform duration-300">
                        <IconUserPlus className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                        {t('signupTitle')}
                    </h2>
                    {t('signupSubtitle') && (
                        <p className="text-slate-400 text-sm">
                            {t('signupSubtitle')}
                        </p>
                    )}
                </div>

                {state?.error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2" role="alert">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{state.error}</span>
                    </div>
                )}

                <form className="space-y-5" action={formAction}>
                    {/* Name / Company Field */}
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-semibold text-white mb-2 ml-1">
                            {t('nameLabel')}
                        </label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            required
                            className="bg-slate-900/50 border border-slate-700 text-white text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block w-full p-3.5 placeholder-slate-500 transition-all duration-200 hover:border-slate-600 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] outline-none"
                            placeholder={t('namePlaceholder')}
                        />
                    </div>

                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-white mb-2 ml-1">
                            {t('emailLabel')}
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="bg-slate-900/50 border border-slate-700 text-white text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block w-full p-3.5 placeholder-slate-500 transition-all duration-200 hover:border-slate-600 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] outline-none"
                            placeholder={t('emailPlaceholder')}
                        />
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-white mb-2 ml-1">
                            {t('passwordLabel')}
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            className="bg-slate-900/50 border border-slate-700 text-white text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block w-full p-3.5 placeholder-slate-500 transition-all duration-200 hover:border-slate-600 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] outline-none"
                            placeholder={t('passwordPlaceholder')}
                        />
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-2 ml-1">
                            {t('confirmPasswordLabel')}
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            required
                            className="bg-slate-900/50 border border-slate-700 text-white text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block w-full p-3.5 placeholder-slate-500 transition-all duration-200 hover:border-slate-600 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] outline-none"
                            placeholder={t('confirmPasswordPlaceholder')}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:ring-4 focus:ring-emerald-500/30 font-bold rounded-xl text-md px-5 py-3.5 text-center shadow-lg shadow-emerald-500/20 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2"
                    >
                        {t('signupButton')}
                    </button>

                    <p className="text-xs text-center text-slate-500 mt-4 leading-relaxed px-4">
                        {t('termsAgreement').split(/(\[.*?\])/).map((part, i) =>
                            part.startsWith('[') && part.endsWith(']')
                                ? <span key={i} className="text-emerald-500 font-medium cursor-pointer hover:underline">{part.slice(1, -1)}</span>
                                : part
                        )}
                    </p>
                </form>

                {/* Footer Link */}
                <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                    <p className="text-sm text-slate-400">
                        {t('haveAccount')}{' '}
                        <Link href="/login" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                            [{t('login')}]
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
