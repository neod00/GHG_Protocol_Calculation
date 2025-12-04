import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const signOut = async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Top Navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <div className="flex-shrink-0">
                                <h1 className="text-xl font-bold text-emerald-600 dark:text-emerald-500">GHG SaaS</h1>
                            </div>
                            <div className="hidden md:block">
                                <div className="flex items-baseline space-x-4">
                                    <Link
                                        href="/dashboard"
                                        className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Projects
                                    </Link>
                                    <Link
                                        href="/dashboard/settings"
                                        className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Settings
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-4 flex items-center md:ml-6 gap-4">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</span>
                                <form action={signOut}>
                                    <button className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 text-sm font-medium transition-colors">
                                        Sign Out
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}
