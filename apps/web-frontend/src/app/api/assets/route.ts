import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const ASSET_SERVICE_URL = process.env.ASSET_SERVICE_URL || 'http://localhost:8001';

/**
 * BFF API Route: Proxy requests to Asset Service
 * Handles authentication and request forwarding
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Please sign in to access this resource' },
                { status: 401 }
            );
        }

        // Extract query parameters
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();

        // Forward request to Asset Service
        const response = await fetch(
            `${ASSET_SERVICE_URL}/api/v1/assets${queryString ? `?${queryString}` : ''}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any).accessToken}`,
                    'X-Request-ID': crypto.randomUUID(),
                },
            }
        );

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Asset API Error:', error);
        return NextResponse.json(
            { error: 'Service Unavailable', message: 'Asset service is not responding' },
            { status: 503 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check role-based access
        const userRoles = (session.user as any)?.roles || [];
        if (!userRoles.includes('admin') && !userRoles.includes('asset_manager')) {
            return NextResponse.json(
                { error: 'Forbidden', message: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        const body = await request.json();

        const response = await fetch(`${ASSET_SERVICE_URL}/api/v1/assets`, {
            method: 'POST',
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
        console.error(`Asset API Error (${ASSET_SERVICE_URL}):`, error);
        return NextResponse.json(
            {
                error: 'Service Unavailable',
                message: `Asset service is not responding at ${ASSET_SERVICE_URL}`,
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 503 }
        );
    }
}
