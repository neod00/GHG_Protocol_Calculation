'use server';

import { prisma } from '@/lib/prisma';

export async function createOrganization(name: string) {
    try {
        const org = await prisma.organization.create({
            data: {
                name,
            },
        });
        return { success: true, data: org };
    } catch (error: any) {
        console.error('Failed to create organization:', error);
        return { success: false, error: error.message || 'Failed to create organization' };
    }

}

export async function getOrganization(id: string) {
    try {
        const org = await prisma.organization.findUnique({
            where: { id },
            include: {
                projects: true,
            },
        });
        return { success: true, data: org };
    } catch (error) {
        console.error('Failed to get organization:', error);
        return { success: false, error: 'Failed to get organization' };
    }
}

export async function requestScope3Access(organizationId: string) {
    try {
        await prisma.organization.update({
            where: { id: organizationId },
            data: { scope3Requested: true }
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to request Scope 3 access:', error);
        return { success: false, error: 'Failed to request access' };
    }
}
