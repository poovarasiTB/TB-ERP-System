/**
 * API Client Library for BFF Routes
 * Provides type-safe methods to interact with backend services
 */

const API_BASE = '/api';

interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
}

class ApiClient {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            const data = await response.json();

            if (!response.ok) {
                return { error: data.error || 'Request failed', message: data.message };
            }

            return { data };
        } catch (error) {
            return { error: 'Network error', message: 'Failed to connect to server' };
        }
    }

    // Asset Service
    assets = {
        list: (page = 1, size = 20, asset_type?: string, asset_class?: string, search?: string, status?: string) => {
            const params = new URLSearchParams({ page: String(page), size: String(size) });
            if (asset_type) params.append('asset_type', asset_type);
            if (asset_class) params.append('asset_class', asset_class);
            if (search) params.append('search', search);
            if (status) params.append('status', status);
            return this.request<PaginatedResponse<Asset>>(`/assets?${params.toString()}`);
        },
        listAssigned: (page = 1, size = 20) => {
            const params = new URLSearchParams({ page: String(page), size: String(size) });
            return this.request<PaginatedResponse<Asset>>(`/assets/assigned?${params.toString()}`);
        },
        get: (id: string) => this.request<Asset>(`/assets/${id}`),
        create: (asset: CreateAssetDto) =>
            this.request<Asset>('/assets', {
                method: 'POST',
                body: JSON.stringify(asset),
            }),
        update: (id: string, asset: UpdateAssetDto) =>
            this.request<Asset>(`/assets/${id}`, {
                method: 'PUT',
                body: JSON.stringify(asset),
            }),
        assign: (id: string, data: { employee_id: number, notes?: string, assigned_date?: string }) =>
            this.request<Asset>(`/assets/${id}/assign`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        return: (id: string, data: { return_date?: string, notes?: string }) =>
            this.request<Asset>(`/assets/${id}/return`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        getHistory: (id: string) => this.request<AssetHistory[]>(`/assets/${id}/history`),
        getMaintenance: (id: string) => this.request<MaintenanceLog[]>(`/assets/${id}/maintenance`),
        createMaintenance: (id: string, data: CreateMaintenanceDto) =>
            this.request<MaintenanceLog>(`/assets/${id}/maintenance`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        delete: (id: string) =>
            this.request<void>(`/assets/${id}`, { method: 'DELETE' }),
    };

    // Invoice Service
    invoices = {
        list: (params?: Record<string, string>) => {
            const query = params ? `?${new URLSearchParams(params)}` : '';
            return this.request<Invoice[]>(`/invoices${query}`);
        },
        get: (id: string) => this.request<Invoice>(`/invoices/${id}`),
        create: (invoice: CreateInvoiceDto) =>
            this.request<Invoice>('/invoices', {
                method: 'POST',
                body: JSON.stringify(invoice),
            }),
    };

    // Employee Service
    employees = {
        list: (params?: Record<string, string>) => {
            const query = params ? `?${new URLSearchParams(params)}` : '';
            return this.request<PaginatedResponse<Employee>>(`/employees${query}`);
        },
        get: (id: string) => this.request<Employee>(`/employees/${id}`),
        create: (employee: CreateEmployeeDto) =>
            this.request<Employee>('/employees', {
                method: 'POST',
                body: JSON.stringify(employee),
            }),
    };

    // Analytics Service (BFF Aggregation)
    analytics = {
        getDashboardStats: () => this.request<DashboardStats>('/analytics/dashboard'),
        getEmployeeUsage: () => this.request<EmployeeUsage[]>('/analytics/employees'),
    };
}

export const api = new ApiClient();

// Type definitions
export interface Asset {
    id: number;
    asset_id: string;
    asset_type?: string;
    asset_class?: string;
    serial_number?: string;
    manufacturer?: string;
    model?: string;
    os_installed?: string;
    processor?: string;
    ram_size_gb?: string;
    hard_drive_size?: string;
    battery_condition?: string;
    status: string;
    assigned_employee_id?: number;
    created_at: string;
    updated_at: string;
}

export interface CreateAssetDto {
    asset_id: string;
    asset_type?: string;
    asset_class?: string;
    serial_number?: string;
    manufacturer?: string;
    model?: string;
    os_installed?: string;
    status?: string;
}

export interface UpdateAssetDto extends Partial<CreateAssetDto> { }


export interface Invoice {
    id: number;
    invoice_number: string;
    total_amount: number;
    status: string;
    due_date?: string;
    created_at: string;
}

export interface CreateInvoiceDto {
    invoice_number: string;
    total_amount: number;
    due_date?: string;
}

export interface Employee {
    id: number;
    employee_id: string;
    full_name: string;
    email: string;
    department_id?: number;
    location?: string;
    is_active: boolean;
    created_at: string;
}

export interface CreateEmployeeDto {
    employee_id: string;
    full_name: string;
    email: string;
    department_id?: number;
    location?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

export interface Assignment {
    id: number;
    asset_id: number;
    employee_id: number;
    assigned_by: number;
    assigned_date: string;
    return_date?: string;
    notes?: string;
}

export interface AssetHistory {
    id: number;
    asset_id: number;
    employee_id?: number;
    employee_name?: string;
    assigned_by?: number;
    assigned_date?: string;
    return_date?: string;
    notes?: string;
}

export interface MaintenanceLog {
    id: number;
    asset_id: number;
    maintenance_type: string;
    description?: string;
    cost?: number;
    performed_by?: string;
    performed_at: string;
    next_maintenance?: string;
    created_at: string;
}

export interface CreateMaintenanceDto {
    maintenance_type: string;
    description?: string;
    cost?: number;
    performed_by?: string;
    performed_at: string;
    next_maintenance?: string;
}

export interface DashboardStats {
    total_assets: number;
    assigned_assets: number;
    available_assets: number;
    maintenance_assets: number;
    status_distribution: Record<string, number>;
    type_distribution: Record<string, number>;
}

export interface EmployeeUsage {
    id: number;
    name: string;
    code: string;
    email: string;
    assigned_assets: number;
}
