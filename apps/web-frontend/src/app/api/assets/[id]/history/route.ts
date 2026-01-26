import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const ASSET_SERVICE_URL = process.env.ASSET_SERVICE_URL;

/**
 * BFF API Route: Get asset assignment history
 * GET /api/assets/{id}/history
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
        const targetUrl = `${ASSET_SERVICE_URL}/api/v1/history/${id}`;
        console.log('[Assets API] Getting asset history:', targetUrl);

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
        console.error('[Assets API] History Error:', error);
        return NextResponse.json(
            { error: 'Service Unavailable', message: 'Asset service is not responding' },
            { status: 503 }
        );
    }
}
