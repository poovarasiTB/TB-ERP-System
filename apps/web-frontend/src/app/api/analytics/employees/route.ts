import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const ASSET_SERVICE_URL = process.env.ASSET_SERVICE_URL;
const EMPLOYEE_SERVICE_URL = process.env.EMPLOYEE_SERVICE_URL;

interface Employee {
    id: number;
    full_name: string;
    employee_id: string; // Employee Code e.g. EMP-001
    department_id?: number;
    email: string;
}

interface AssetUsage {
    employee_id: number;
    asset_count: number;
}

/**
 * BFF API Route: Get Employee Asset Usage
 * GET /api/analytics/employees
 * Returns list of employees with their assigned asset count.
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

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(session as any).accessToken}`,
            'X-Request-ID': crypto.randomUUID(),
        };

        // 1. Fetch Asset Usage Stats (Aggregated by Asset Service)
        const usagePromise = fetch(`${ASSET_SERVICE_URL}/api/v1/analytics/employee-usage`, {
            method: 'GET',
            headers
        }).then(res => res.json() as Promise<AssetUsage[]>);

        // 2. Fetch All Employees (from Employee Service)
        // Note: In a real large-scale system, we wouldn't fetch ALL. We'd likely paginate or fetch by IDs.
        // For this ERP size, fetching all is acceptable for the dashboard summary.
        const employeesPromise = fetch(`${EMPLOYEE_SERVICE_URL}/api/v1/employees?size=1000`, { // Fetch reasonable max
            method: 'GET',
            headers
        }).then(res => res.json());

        const [usageData, employeesData] = await Promise.all([usagePromise, employeesPromise]);

        // employeesData is expected to be { items: Employee[], ... } based on previous debugging
        const allEmployees: Employee[] = employeesData.items || [];

        // Map usage counts for O(1) lookup
        const usageMap = new Map<number, number>();
        if (Array.isArray(usageData)) {
            usageData.forEach(u => usageMap.set(u.employee_id, u.asset_count));
        }

        // Merge Data
        const result = allEmployees.map(emp => ({
            id: emp.id,
            name: emp.full_name,
            code: emp.employee_id,
            email: emp.email,
            // department: "Team" // If department name is needed, we'd need to fetch departments too. For now using placeholder or if dept ID matches team?
            // User screenshot shows "Team" column (Agamx, ecommerce). This implies Department Name.
            // Employee object has department_id. We might need Department Service or just show ID for now.
            // Simplified: Just returning count.
            assigned_assets: usageMap.get(emp.id) || 0
        }));

        // Sort by asset count desc
        result.sort((a, b) => b.assigned_assets - a.assigned_assets);

        return NextResponse.json(result);

    } catch (error) {
        console.error('[Analytics API] Employee Stats Error:', error);
        return NextResponse.json(
            { error: 'Service Unavailable', message: 'One or more services failed' },
            { status: 503 }
        );
    }
}
