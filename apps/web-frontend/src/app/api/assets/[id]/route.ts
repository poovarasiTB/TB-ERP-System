import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const ASSET_SERVICE_URL = process.env.ASSET_SERVICE_URL;

/**
 * BFF API Route: Get single asset by ID
 */
export async function GET(
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

        const { id } = params;
        const targetUrl = `${ASSET_SERVICE_URL}/api/v1/assets/${id}`;
        console.log('[Assets API] GET single asset:', targetUrl);

        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(session as any).accessToken}`,
                'X-Request-ID': crypto.randomUUID(),
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[Assets API] GET by ID Error:', error);
        return NextResponse.json(
            { error: 'Service Unavailable', message: 'Asset service is not responding' },
            { status: 503 }
        );
    }
}

/**
 * BFF API Route: Update asset by ID
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRoles = (session.user as any)?.roles || [];
        if (!userRoles.includes('admin') && !userRoles.includes('asset_manager')) {
            return NextResponse.json(
                { error: 'Forbidden', message: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        const { id } = params;
        const body = await request.json();

        const response = await fetch(`${ASSET_SERVICE_URL}/api/v1/assets/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(session as any).accessToken}`,
                'X-Request-ID': crypto.randomUUID(),
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[Assets API] PUT Error:', error);
        return NextResponse.json(
            { error: 'Service Unavailable', message: 'Asset service is not responding' },
            { status: 503 }
        );
    }
}

/**
 * BFF API Route: Delete asset by ID
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRoles = (session.user as any)?.roles || [];
        if (!userRoles.includes('admin')) {
            return NextResponse.json(
                { error: 'Forbidden', message: 'Only admins can delete assets' },
                { status: 403 }
            );
        }

        const { id } = params;

        const response = await fetch(`${ASSET_SERVICE_URL}/api/v1/assets/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${(session as any).accessToken}`,
                'X-Request-ID': crypto.randomUUID(),
            },
        });

        if (response.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[Assets API] DELETE Error:', error);
        return NextResponse.json(
            { error: 'Service Unavailable', message: 'Asset service is not responding' },
            { status: 503 }
        );
    }
}
