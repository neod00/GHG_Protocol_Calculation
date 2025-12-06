import Link from 'next/link'

export default function ConfirmedPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>

                <div>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Email Confirmed!
                    </h2>
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                        Thank you for verifying your email address. Your account has been successfully activated.
                    </p>
                </div>

                <div className="mt-8 space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                        You can now close this window or return to the application.
                    </p>

                    <Link
                        href="/login"
                        className="flex w-full justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors duration-200"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
