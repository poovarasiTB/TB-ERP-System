import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const EMPLOYEE_SERVICE_URL = process.env.EMPLOYEE_SERVICE_URL;

if (!EMPLOYEE_SERVICE_URL) {
    console.error('[Employee API] CRITICAL: EMPLOYEE_SERVICE_URL is not defined in environment variables');
}

/**
 * BFF API Route: Proxy requests to Employee Service
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();

        const response = await fetch(
            `${EMPLOYEE_SERVICE_URL}/api/v1/employees${queryString ? `?${queryString}` : ''}`,
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
        console.error('Employee API Error:', error);
        return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRoles = (session.user as any)?.roles || [];
        if (!userRoles.includes('admin') && !userRoles.includes('hr_manager')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        const response = await fetch(`${EMPLOYEE_SERVICE_URL}/api/v1/employees`, {
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
        console.error(`Employee API Error (${EMPLOYEE_SERVICE_URL}):`, error);
        return NextResponse.json(
            {
                error: 'Service Unavailable',
                message: `Employee service is not responding at ${EMPLOYEE_SERVICE_URL}`,
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 503 }
        );
    }
}
