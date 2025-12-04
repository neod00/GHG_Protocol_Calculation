'use client'

import { createProject } from '@/app/actions/project'
import { createOrganization } from '@/app/actions/organization'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewProjectPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            const name = formData.get('name') as string
            const year = formData.get('year') as string

            // TODO: Get real organization ID from user context
            // For now, we'll ensure a demo org exists
            const orgName = "Demo Organization"
            let orgId = localStorage.getItem('ghg-saas-org-id')

            if (!orgId) {
                const orgResult = await createOrganization(orgName)
                if (orgResult.success && orgResult.data) {
                    orgId = orgResult.data.id
                    localStorage.setItem('ghg-saas-org-id', orgId)
                } else {
                    throw new Error("Failed to create organization")
                }
            }

            const result = await createProject(orgId!, name, year)

            if (result.success) {
                router.push('/dashboard')
                router.refresh()
            } else {
                alert('Failed to create project')
            }
        } catch (error) {
            console.error(error)
            alert('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Create New Project</h1>

            <form action={handleSubmit} className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6 space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Project Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm p-2 border"
                        placeholder="e.g. 2024 Corporate Report"
                    />
                </div>

                <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reporting Year
                    </label>
                    <input
                        type="number"
                        name="year"
                        id="year"
                        required
                        defaultValue={new Date().getFullYear()}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm p-2 border"
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
            </form>
        </div>
    )
}
