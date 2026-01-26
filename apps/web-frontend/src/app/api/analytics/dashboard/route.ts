import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { log } from 'node:console';

const ASSET_SERVICE_URL = process.env.ASSET_SERVICE_URL || 'http://localhost:8001';

// Helper to generate UUID (Node.js compatible)
function generateRequestId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older Node.js versions
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * BFF API Route: Get Dashboard Statistics
 * GET /api/analytics/dashboard
 * This route proxies requests to the Asset Service analytics endpoint
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

        const accessToken = (session as any).accessToken;
        if (!accessToken) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'No access token found' },
                { status: 401 }
            );
        }

        const url = `${ASSET_SERVICE_URL}/api/v1/analytics/dashboard-stats`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-Request-ID': generateRequestId(),
            },
        });
        console.log({ response })

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Analytics API] Backend error:', response.status, errorText);
            return NextResponse.json(
                {
                    error: 'Backend Error',
                    message: `Asset service returned ${response.status}: ${errorText}`
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[Analytics API] Success:', data);
        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        console.error('[Analytics API] Stats Error:', error);
        return NextResponse.json(
            {
                error: 'Service Unavailable',
                message: error.message || 'Asset service is not responding'
            },
            { status: 503 }
        );
    }
}
