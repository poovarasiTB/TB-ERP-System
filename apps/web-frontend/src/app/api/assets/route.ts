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
        console.log('[Assets API] Checking session...');

        // Verify authentication with timeout
        let session;
        try {
            session = await getServerSession(authOptions);
        } catch (sessionError) {
            console.error('[Assets API] Session error:', sessionError);
            return NextResponse.json(
                { error: 'Session Error', message: 'Could not verify session' },
                { status: 401 }
            );
        }

        if (!session) {
            console.log('[Assets API] No session found');
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Please sign in to access this resource' },
                { status: 401 }
            );
        }

        console.log('[Assets API] Session found, user:', session.user?.email);

        // Extract query parameters
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();

        const targetUrl = `${ASSET_SERVICE_URL}/api/v1/assets${queryString ? `?${queryString}` : ''}`;
        console.log('[Assets API] Calling:', targetUrl);

        // Forward request to Asset Service with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const response = await fetch(targetUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any).accessToken}`,
                    'X-Request-ID': crypto.randomUUID(),
                },
                signal: controller.signal,
            });

            clearTimeout(timeout);

            const data = await response.json();
            console.log('[Assets API] Response status:', response.status);

            return NextResponse.json(data, { status: response.status });
        } catch (fetchError: any) {
            clearTimeout(timeout);
            if (fetchError.name === 'AbortError') {
                console.error('[Assets API] Request timeout');
                return NextResponse.json(
                    { error: 'Timeout', message: 'Asset service took too long to respond' },
                    { status: 504 }
                );
            }
            throw fetchError;
        }
    } catch (error) {
        console.error('[Assets API] Error:', error);
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
        console.error(`[Assets API] POST Error:`, error);
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
