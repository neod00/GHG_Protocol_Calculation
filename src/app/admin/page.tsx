import { createAdminClient, createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

async function deleteUser(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    if (!userId) {
        return;
    }
    
    try {
        const supabaseAdmin = await createAdminClient();
        await supabaseAdmin.auth.admin.deleteUser(userId);
        revalidatePath("/admin");
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
}

export default async function AdminPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user || (!user.email?.startsWith("neod00") && user.email !== "neod00@naver.com")) {
        redirect("/");
    }

    // Check for Service Role Key
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
                <Header user={user} />
                <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8">
                        <h1 className="text-3xl font-bold mb-4 text-red-600 dark:text-red-400">Configuration Error</h1>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">The <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> environment variable is missing.</p>
                        <p className="text-gray-700 dark:text-gray-300">Please add it to your Vercel project settings to access the Admin Dashboard.</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    let users: any[] = [];
    let fetchError: Error | null = null;

    try {
        const supabaseAdmin = await createAdminClient();
        if (!supabaseAdmin) {
            throw new Error("Failed to create admin client");
        }
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) {
            throw error;
        }
        users = data?.users || [];
    } catch (err: any) {
        console.error("Admin Page Error:", err);
        fetchError = err instanceof Error ? err : new Error(String(err));
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <Header user={user} />
            <main className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">관리자 전용 사용자 관리 페이지</p>
                </div>
                
                {fetchError ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
                        <p className="font-semibold mb-2">Error loading users:</p>
                        <p className="text-sm">{fetchError.message || String(fetchError)}</p>
                        <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                            Please check that SUPABASE_SERVICE_ROLE_KEY is correctly set in your Vercel environment variables.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden">
                        {users.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <p>등록된 사용자가 없습니다.</p>
                            </div>
                        ) : (
                            <>
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        총 <span className="font-semibold text-gray-900 dark:text-white">{users.length}</span>명의 사용자
                                    </p>
                                </div>
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Created At
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Last Sign In
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {users.map((u) => (
                                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {u.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(u.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {u.last_sign_in_at
                                                        ? new Date(u.last_sign_in_at).toLocaleDateString()
                                                        : "Never"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {u.email !== "neod00@ghg-saas.com" && !u.email?.startsWith('neod00') ? (
                                                        <form action={deleteUser}>
                                                            <input type="hidden" name="userId" value={u.id} />
                                                            <button
                                                                type="submit"
                                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-medium"
                                                                onClick={(e) => {
                                                                    if (!confirm(`정말로 ${u.email} 사용자를 삭제하시겠습니까?`)) {
                                                                        e.preventDefault();
                                                                    }
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </form>
                                                    ) : (
                                                        <span className="text-gray-400 cursor-not-allowed">Admin</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
