import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const ASSET_SERVICE_URL = process.env.ASSET_SERVICE_URL;

/**
 * BFF API Route: Assign asset to employee
 * POST /api/assets/{id}/assign
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Please sign in to access this resource' },
                { status: 401 }
            );
        }

        const userRoles = (session.user as any)?.roles || [];
        if (!userRoles.includes('admin') && !userRoles.includes('asset_manager')) {
            return NextResponse.json(
                { error: 'Forbidden', message: 'Insufficient permissions to assign assets' },
                { status: 403 }
            );
        }

        const { id } = params;
        const body = await request.json();

        // Add the assigning user's ID from session
        const assignmentData = {
            ...body,
            assigned_by: (session.user as any)?.id || 1,
        };
        // Note: Backend endpoint for assignment is /api/v1/assignments/{id}/assign
        // We are using params.id which comes from the URL [id]
        const targetUrl = `${ASSET_SERVICE_URL}/api/v1/assignments/${params.id}/assign`;
        console.log('[Assets Assign API] Calling:', targetUrl);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(session as any).accessToken}`,
                'X-Request-ID': crypto.randomUUID(),
            },
            body: JSON.stringify(assignmentData),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[Assets API] Assign Error:', error);
        return NextResponse.json(
            { error: 'Service Unavailable', message: 'Asset service is not responding' },
            { status: 503 }
        );
    }
}
