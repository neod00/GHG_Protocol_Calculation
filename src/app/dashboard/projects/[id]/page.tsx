
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { MainCalculator } from '@/components/MainCalculator';
import { notFound } from 'next/navigation';

interface ProjectPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Middleware should handle this, but double check
        return <div>Please log in.</div>;
    }

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            emissionSources: true,
            facilities: true,
            organization: true // Fetch organization to check access rights
        }
    });

    if (!project) {
        notFound();
    }

    // Transform Prisma data to match MainCalculator's expected format if necessary
    // For now, we'll pass the raw project and handle transformation in MainCalculator

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
                <p className="text-gray-500 dark:text-gray-400">Reporting Year: {project.reportingYear}</p>
            </div>

            <MainCalculator
                projectId={project.id}
                initialProjectData={project}
                organizationId={project.organizationId}
                hasScope3Access={(project.organization as any).scope3Access}
                scope3Requested={(project.organization as any).scope3Requested}
                isAuthenticated={true}
            />
        </div>
    );
}
