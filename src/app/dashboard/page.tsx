
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createProject } from '../actions/project'
import { createOrganization } from '../actions/organization'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
        redirect('/login')
    }

    // 1. Find or Create Prisma User & Organization
    // In a real production app, this should happen at signup/login callback.
    // For now, we ensure they exist here to support the "Demo" flow smoothly.
    let dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { organization: true }
    })

    if (!dbUser) {
        // Auto-onboarding for MVP: Create Org and User if not exists
        const orgName = `${user.email.split('@')[0]}'s Organization`;

        // Create Org
        const newOrg = await prisma.organization.create({
            data: { name: orgName }
        });

        // Create User linked to Org
        dbUser = await prisma.user.create({
            data: {
                email: user.email,
                organizationId: newOrg.id,
                role: 'ADMIN' // First user is Admin
            },
            include: { organization: true }
        });
    }

    const currentYear = new Date().getFullYear().toString();

    // 2. Check for existing project for current year
    const existingProject = await prisma.project.findFirst({
        where: {
            organizationId: dbUser.organizationId,
            reportingYear: currentYear
        }
    });

    if (existingProject) {
        // 3. Redirect to existing project
        redirect(`/dashboard/projects/${existingProject.id}`);
    } else {
        // 4. Create new project and redirect
        const projectName = `${currentYear} GHG Inventory`;
        const newProject = await createProject(dbUser.organizationId, projectName, currentYear);

        if (newProject.success && newProject.data) {
            redirect(`/dashboard/projects/${newProject.data.id}`);
        } else {
            // Fallback error UI
            return (
                <div className="p-8 text-center text-red-600">
                    Failed to create project. Please try again.
                </div>
            )
        }
    }
}
