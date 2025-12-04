import { login, signup } from './actions'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string; error: string }>
}) {
    const { message, error } = await searchParams;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
            <div className="w-full max-w-md space-y-8 px-4 sm:px-6 lg:px-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Enter your email and password below
                    </p>
                </div>
                <form className="mt-8 space-y-6">
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 bg-white ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 bg-white ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            type="submit"
                            formAction={login}
                            className="group relative flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                        >
                            Sign in
                        </button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-transparent px-2 text-gray-500">Don't have an account?</span>
                            </div>
                        </div>
                        <button
                            type="submit"
                            formAction={signup}
                            className="group relative flex w-full justify-center rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                        >
                            Sign up
                        </button>
                    </div>

                    {message && (
                        <p className="mt-4 bg-blue-100 p-4 text-center text-sm text-blue-800 rounded-md">
                            {message}
                        </p>
                    )}
                    {error && (
                        <p className="mt-4 bg-red-100 p-4 text-center text-sm text-red-800 rounded-md">
                            {error}
                        </p>
                    )}
                </form>
            </div>
        </div>
    )
}
