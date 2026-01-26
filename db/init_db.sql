-- ==========================================================
-- TB ERP - Database Initialization Script (Schema Separation)
-- ==========================================================
-- This script creates schemas for logical separation:
-- - auth: User authentication & authorization
-- - assets: Asset management
-- - invoices: Invoice management  
-- - employees: Employee management
--
-- All schemas exist in the SAME database (tb_erp_db)
-- ==========================================================

-- 1. Create Schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS assets;
CREATE SCHEMA IF NOT EXISTS invoices;
CREATE SCHEMA IF NOT EXISTS employees;

-- ==========================================================
-- AUTH SCHEMA - User Authentication & Authorization
-- ==========================================================

-- Users table for authentication
CREATE TABLE IF NOT EXISTS auth.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE IF NOT EXISTS auth.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User-Role mapping (many-to-many)
CREATE TABLE IF NOT EXISTS auth.user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES auth.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Sessions table for tracking active sessions (optional)
CREATE TABLE IF NOT EXISTS auth.sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- EMPLOYEES SCHEMA
-- ==========================================================

CREATE TABLE IF NOT EXISTS employees.departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees.employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department_id INTEGER REFERENCES employees.departments(id) ON DELETE SET NULL,
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- ASSETS SCHEMA
-- ==========================================================

CREATE TABLE IF NOT EXISTS assets.assets (
    id SERIAL PRIMARY KEY,
    asset_id VARCHAR(50) UNIQUE NOT NULL,
    asset_type VARCHAR(100),
    asset_class VARCHAR(100),
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    os_installed VARCHAR(100),
    processor VARCHAR(100),
    ram_size_gb VARCHAR(50),
    hard_drive_size VARCHAR(50),
    battery_condition VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    -- Soft reference to employees.employees (no FK constraint across schemas for microservice independence)
    assigned_employee_id INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets.maintenance_logs (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets.assets(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100) NOT NULL,
    description TEXT,
    cost DECIMAL(12, 2),
    performed_by VARCHAR(255),
    performed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    next_maintenance TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- INVOICES SCHEMA
-- ==========================================================

CREATE TABLE IF NOT EXISTS invoices.invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    due_date DATE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices.line_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices.invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices.payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices.invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- SEED DATA - Roles
-- ==========================================================

INSERT INTO auth.roles (name, description) VALUES 
('admin', 'Full system access'),
('asset_manager', 'Manage assets and maintenance'),
('invoice_manager', 'Manage invoices and payments'),
('hr_manager', 'Manage employees and departments'),
('employee', 'Basic employee access')
ON CONFLICT (name) DO NOTHING;

-- ==========================================================
-- SEED DATA - Departments
-- ==========================================================

INSERT INTO employees.departments (name, code, description) VALUES
('Engineering', 'ENG', 'Software and Hardware Engineering'),
('Human Resources', 'HR', 'HR and People Operations'),
('Finance', 'FIN', 'Finance and Accounting'),
('Operations', 'OPS', 'Business Operations'),
('Sales', 'SALES', 'Sales and Business Development'),
('IT', 'IT', 'Information Technology')
ON CONFLICT (code) DO NOTHING;

-- ==========================================================
-- SEED DATA - Default Admin User (password: admin123)
-- ==========================================================
-- Password hash is bcrypt for "admin123"

INSERT INTO auth.users (email, password_hash, full_name, is_active, is_verified)
VALUES ('poovarasi@trustybytes.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.L5zQaSjT0Qf8Cy', 'System Admin', true, true)
ON CONFLICT (email) DO NOTHING;

-- Assign admin role to admin user
INSERT INTO auth.user_roles (user_id, role_id)
SELECT u.id, r.id FROM auth.users u, auth.roles r 
WHERE u.email = 'poovarasi@trustybytes.in' AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ==========================================================
-- SEED DATA - Sample Employees
-- ==========================================================

INSERT INTO employees.employees (employee_id, full_name, email, department_id, location, is_active, created_at)
VALUES 
('EMP-043', 'Poovarasi', 'poovarasi@trustybytes.in', 6, 'Chennai', true, '2025-11-22 12:25:23.36877'),
('EMP-100', 'Ambarrish', 'ambarrish@trustybytes.in', 6, 'Bangalore', true, '2025-11-22 12:25:23.36877'),
('EMP-001', 'Hamsa', 'hamsa@trustybytes.in', 1, 'Chennai', true, '2025-11-24 04:13:40.582868'),
('EMP-002', 'Dinesh kumar', 'dinesh@trustybytes.in', 1, 'Chennai', true, '2025-11-24 04:52:12.707485')
ON CONFLICT (employee_id) DO NOTHING;

-- ==========================================================
-- SEED DATA - Sample Assets
-- ==========================================================

INSERT INTO assets.assets (asset_id, asset_type, asset_class, serial_number, manufacturer, model, os_installed, processor, ram_size_gb, hard_drive_size, battery_condition)
VALUES 
('TBA00002', 'Laptop', 'System', 'PC0PCF5J', 'LENOVO', 'ThinkPad T470s', 'Windows 11', 'i7', '24', '256 GB', 'Average'),
('TBA000004', 'Headset', 'Peripheral', 'N/A', 'LOGITECH', 'M185 (Wireless)', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'),
('TBA00003', 'Mouse', 'Peripheral', 'N/A', 'LOGITECH', 'H390', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'),
('TBA000012', 'Laptop', 'System', 'PC0QLT9U', 'LENOVO', 'Thinkpad T490S', 'Windows 10', 'i7-7600U', '8', '2023 GB', 'Average'),
('TBA000021', 'Laptop', 'System', '956PTN3', 'DELL', 'Latitude 7410', 'Windows 11', 'i7-10610U', '16', '476 GB', 'Average'),
('TBA0005498', 'Mac Mini', 'Peripheral', 'Q4P6FVR24D', 'APPLE', 'Mac mini m4', 'MacOS', 'Apple M4', '16', '500GB', 'N/A'),
('TBA000526', 'Laptop', 'System', '5CG12503Z4', 'HP', 'EliteBook 840 G7', 'Windows 10', 'i5-1031U', '16', '477GB', 'Good'),
('TBA000900', 'Monitor', 'Peripheral', 'CNC40843HV', 'HP', 'P27 G5', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'),
('TBA000046', 'Router', 'Peripheral', '22284B1003335', 'TP LINK', 'Archer C6U', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'),
('TBA000045', 'Printer', 'Peripheral', 'CNBRR933PD', 'HP', 'SHNGCN 1202', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'),
('TBA000108', 'Laptop', 'System', '2SGIFLD', 'DELL', 'N/A', 'Windows 11', 'Intel Core I7', '16', 'N/A', 'N/A')
ON CONFLICT (asset_id) DO NOTHING;

-- ==========================================================
-- SEED DATA - Sample Invoices
-- ==========================================================

INSERT INTO invoices.invoices (invoice_number, total_amount, status, due_date)
VALUES 
('INV-2024-001', 12500.00, 'paid', '2024-12-01'),
('INV-2024-002', 4500.50, 'pending', '2025-01-15'),
('INV-2024-003', 890.00, 'draft', '2025-01-20'),
('INV-2024-004', 15600.00, 'overdue', '2024-12-10')
ON CONFLICT (invoice_number) DO NOTHING;

-- ==========================================================
-- Create indexes for performance
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets.assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices.invoices(due_date);
