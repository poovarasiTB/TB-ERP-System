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
        list: (params?: Record<string, string>) => {
            const query = params ? `?${new URLSearchParams(params)}` : '';
            return this.request<Asset[]>(`/assets${query}`);
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
            return this.request<Employee[]>(`/employees${query}`);
        },
        get: (id: string) => this.request<Employee>(`/employees/${id}`),
        create: (employee: CreateEmployeeDto) =>
            this.request<Employee>('/employees', {
                method: 'POST',
                body: JSON.stringify(employee),
            }),
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

