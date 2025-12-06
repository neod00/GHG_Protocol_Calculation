import { createAdminClient, createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
            <div className="container mx-auto p-8 text-black dark:text-white">
                <h1 className="text-3xl font-bold mb-8 text-red-500">Configuration Error</h1>
                <p>The <code>SUPABASE_SERVICE_ROLE_KEY</code> environment variable is missing.</p>
                <p>Please add it to your <code>.env</code> file or Vercel project settings to access the Admin Dashboard.</p>
            </div>
        );
    }

    let users: any[] = [];
    let fetchError = null;

    try {
        const supabaseAdmin = await createAdminClient();
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;
        users = data.users || [];
    } catch (err: any) {
        console.error("Admin Page Error:", err);
        fetchError = err;
    }

    // Handle fetch error display below in the return


    async function deleteUser(formData: FormData) {
        "use server";
        const userId = formData.get("userId") as string;
        const supabaseAdmin = await createAdminClient();
        await supabaseAdmin.auth.admin.deleteUser(userId);
        revalidatePath("/admin");
    }

    return (
        <div className="container mx-auto p-8 text-black dark:text-white">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden">
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
                            <tr key={u.id}>
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
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
                {fetchError && <div className="p-4 text-red-500">Error loading users: {fetchError.message || JSON.stringify(fetchError)}</div>}
            </div>
        </div>
    );
}
