import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const ASSET_SERVICE_URL = process.env.ASSET_SERVICE_URL;

/**
 * BFF API Route: List assigned assets
 * GET /api/assets/assigned
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Please sign in to access this resource' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const params = new URLSearchParams();

        // Pass essential query parameters
        if (searchParams.has('page')) params.append('page', searchParams.get('page')!);
        if (searchParams.has('size')) params.append('size', searchParams.get('size')!);

        const targetUrl = `${ASSET_SERVICE_URL}/api/v1/assets/assigned?${params.toString()}`;

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
        console.error('[Assets API] List Assigned Error:', error);
        return NextResponse.json(
            { error: 'Service Unavailable', message: 'Asset service is not responding' },
            { status: 503 }
        );
    }
}
