-- ==========================================================
-- TB ERP - Asset Management Seed Data Script
-- ==========================================================
-- This script adds missing tables and comprehensive seed data
-- for the Asset Management Service including:
-- - Assignment history table
-- - Status history table
-- - Asset assignments table
-- - Sample assignment/history data
-- ==========================================================

-- ==========================================================
-- 1. CREATE MISSING TABLES
-- ==========================================================

-- Asset Assignments tracking table (current assignments)
CREATE TABLE IF NOT EXISTS assets.asset_assignments (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets.assets(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL, -- Soft reference to employees.employees
    assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unassigned_at TIMESTAMP WITHOUT TIME ZONE
);

-- Assignment History tracking table (full history of assignments)
CREATE TABLE IF NOT EXISTS assets.assignment_history (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets.assets(id) ON DELETE CASCADE,
    employee_id INTEGER, -- Soft link to employees schema
    assigned_by INTEGER, -- Soft link to auth schema (user who made assignment)
    assigned_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    return_date TIMESTAMP WITHOUT TIME ZONE,
    notes TEXT
);

-- Asset Status History tracking table
CREATE TABLE IF NOT EXISTS assets.asset_status_history (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets.assets(id) ON DELETE CASCADE,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    reason TEXT,
    changed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(255)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignment_history_asset ON assets.assignment_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_employee ON assets.assignment_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset ON assets.asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_status_history_asset ON assets.asset_status_history(asset_id);

-- ==========================================================
-- 2. SEED MORE EMPLOYEES FOR TESTING
-- ==========================================================

INSERT INTO employees.employees (employee_id, full_name, email, department_id, location, is_active, created_at)
VALUES 
('EMP-003', 'Rajesh Kumar', 'rajesh@trustybytes.in', 1, 'Chennai', true, '2025-11-25 10:00:00'),
('EMP-004', 'Priya Sharma', 'priya@trustybytes.in', 2, 'Bangalore', true, '2025-11-26 09:30:00'),
('EMP-005', 'Arun Nair', 'arun@trustybytes.in', 3, 'Chennai', true, '2025-11-27 11:15:00'),
('EMP-006', 'Meera Reddy', 'meera@trustybytes.in', 6, 'Hyderabad', true, '2025-11-28 08:45:00'),
('EMP-007', 'Vikram Singh', 'vikram@trustybytes.in', 4, 'Mumbai', true, '2025-11-29 14:00:00'),
('EMP-008', 'Anitha Menon', 'anitha@trustybytes.in', 5, 'Kochi', true, '2025-11-30 10:30:00')
ON CONFLICT (employee_id) DO NOTHING;

-- ==========================================================
-- 3. UPDATE SOME ASSETS TO BE ASSIGNED
-- ==========================================================

-- Assign laptop TBA00002 to Poovarasi (employee id 1)
UPDATE assets.assets 
SET status = 'assigned', assigned_employee_id = 1
WHERE asset_id = 'TBA00002';

-- Assign laptop TBA000012 to Ambarrish (employee id 2)
UPDATE assets.assets 
SET status = 'assigned', assigned_employee_id = 2
WHERE asset_id = 'TBA000012';

-- Assign laptop TBA000021 to Hamsa (employee id 3)
UPDATE assets.assets 
SET status = 'assigned', assigned_employee_id = 3
WHERE asset_id = 'TBA000021';

-- ==========================================================
-- 4. SEED ASSIGNMENT HISTORY DATA
-- ==========================================================

-- First, get the asset IDs dynamically and insert history
INSERT INTO assets.assignment_history (asset_id, employee_id, assigned_by, assigned_date, return_date, notes)
SELECT 
    a.id,
    1, -- Poovarasi
    1, -- Assigned by admin
    '2025-12-01 10:00:00',
    NULL,
    'New laptop assignment for development work'
FROM assets.assets a WHERE a.asset_id = 'TBA00002'
ON CONFLICT DO NOTHING;

INSERT INTO assets.assignment_history (asset_id, employee_id, assigned_by, assigned_date, return_date, notes)
SELECT 
    a.id,
    2, -- Ambarrish
    1, -- Assigned by admin
    '2025-12-05 14:30:00',
    NULL,
    'ThinkPad assigned for remote work setup'
FROM assets.assets a WHERE a.asset_id = 'TBA000012'
ON CONFLICT DO NOTHING;

INSERT INTO assets.assignment_history (asset_id, employee_id, assigned_by, assigned_date, return_date, notes)
SELECT 
    a.id,
    3, -- Hamsa
    1, -- Assigned by admin
    '2025-12-10 09:00:00',
    NULL,
    'Dell Latitude for project work'
FROM assets.assets a WHERE a.asset_id = 'TBA000021'
ON CONFLICT DO NOTHING;

-- Add some historical (returned) assignment records
INSERT INTO assets.assignment_history (asset_id, employee_id, assigned_by, assigned_date, return_date, notes)
SELECT 
    a.id,
    4, -- Dinesh
    1,
    '2024-06-15 10:00:00',
    '2024-11-30 16:00:00',
    'Initial assignment - returned due to upgrade'
FROM assets.assets a WHERE a.asset_id = 'TBA00002'
ON CONFLICT DO NOTHING;

INSERT INTO assets.assignment_history (asset_id, employee_id, assigned_by, assigned_date, return_date, notes)
SELECT 
    a.id,
    5, -- Rajesh
    1,
    '2024-03-01 11:30:00',
    '2024-10-15 14:00:00',
    'Previous user - returned during dept restructure'
FROM assets.assets a WHERE a.asset_id = 'TBA000012'
ON CONFLICT DO NOTHING;

-- ==========================================================
-- 5. SEED STATUS HISTORY DATA
-- ==========================================================

INSERT INTO assets.asset_status_history (asset_id, from_status, to_status, reason, changed_at, changed_by)
SELECT 
    a.id,
    'active',
    'assigned',
    'Assigned to employee for development work',
    '2025-12-01 10:00:00',
    'admin@trustybytes.in'
FROM assets.assets a WHERE a.asset_id = 'TBA00002';

INSERT INTO assets.asset_status_history (asset_id, from_status, to_status, reason, changed_at, changed_by)
SELECT 
    a.id,
    'active',
    'assigned',
    'Assigned for remote work setup',
    '2025-12-05 14:30:00',
    'admin@trustybytes.in'
FROM assets.assets a WHERE a.asset_id = 'TBA000012';

INSERT INTO assets.asset_status_history (asset_id, from_status, to_status, reason, changed_at, changed_by)
SELECT 
    a.id,
    'maintenance',
    'active',
    'Routine maintenance completed',
    '2024-11-20 09:00:00',
    'admin@trustybytes.in'
FROM assets.assets a WHERE a.asset_id = 'TBA000021';

INSERT INTO assets.asset_status_history (asset_id, from_status, to_status, reason, changed_at, changed_by)
SELECT 
    a.id,
    'active',
    'assigned',
    'Assigned after maintenance completion',
    '2025-12-10 09:00:00',
    'admin@trustybytes.in'
FROM assets.assets a WHERE a.asset_id = 'TBA000021';

-- ==========================================================
-- 6. SEED MAINTENANCE LOGS DATA
-- ==========================================================

INSERT INTO assets.maintenance_logs (asset_id, maintenance_type, description, cost, performed_by, performed_at, next_maintenance)
SELECT 
    a.id,
    'Battery Replacement',
    'Original battery replaced due to degraded capacity (45% health). New battery installed with full capacity.',
    4500.00,
    'TechCare Solutions',
    '2024-08-15 10:00:00',
    '2025-08-15 10:00:00'
FROM assets.assets a WHERE a.asset_id = 'TBA00002';

INSERT INTO assets.maintenance_logs (asset_id, maintenance_type, description, cost, performed_by, performed_at, next_maintenance)
SELECT 
    a.id,
    'RAM Upgrade',
    'Upgraded RAM from 8GB to 16GB for better performance with development tools.',
    3200.00,
    'Internal IT Team',
    '2024-09-20 14:30:00',
    NULL
FROM assets.assets a WHERE a.asset_id = 'TBA00002';

INSERT INTO assets.maintenance_logs (asset_id, maintenance_type, description, cost, performed_by, performed_at, next_maintenance)
SELECT 
    a.id,
    'OS Reinstallation',
    'Fresh Windows 11 installation due to performance issues. All data backed up and restored.',
    0.00,
    'Internal IT Team',
    '2024-11-10 09:00:00',
    NULL
FROM assets.assets a WHERE a.asset_id = 'TBA000012';

INSERT INTO assets.maintenance_logs (asset_id, maintenance_type, description, cost, performed_by, performed_at, next_maintenance)
SELECT 
    a.id,
    'Hardware Cleaning',
    'Deep cleaning of keyboard, fans, and internal components. Thermal paste reapplied.',
    1500.00,
    'TechCare Solutions',
    '2024-11-18 11:00:00',
    '2025-05-18 11:00:00'
FROM assets.assets a WHERE a.asset_id = 'TBA000021';

INSERT INTO assets.maintenance_logs (asset_id, maintenance_type, description, cost, performed_by, performed_at, next_maintenance)
SELECT 
    a.id,
    'Screen Calibration',
    'Monitor color calibration for design work accuracy.',
    800.00,
    'Display Experts',
    '2024-12-01 16:00:00',
    '2025-06-01 16:00:00'
FROM assets.assets a WHERE a.asset_id = 'TBA000900';

-- ==========================================================
-- 7. ADD MORE SAMPLE ASSETS FOR VARIETY
-- ==========================================================

INSERT INTO assets.assets (asset_id, asset_type, asset_class, serial_number, manufacturer, model, os_installed, processor, ram_size_gb, hard_drive_size, battery_condition, status, assigned_employee_id)
VALUES 
('TBA000200', 'Laptop', 'System', '5CG2250XYZ', 'HP', 'ProBook 450 G8', 'Windows 11', 'i5-1135G7', '16', '512 GB', 'Good', 'active', NULL),
('TBA000201', 'Desktop', 'System', 'MXL2340ABC', 'DELL', 'OptiPlex 7090', 'Windows 11', 'i7-11700', '32', '1 TB', 'N/A', 'active', NULL),
('TBA000202', 'Monitor', 'Peripheral', 'CN34567DEF', 'LG', 'UltraWide 34WN80C', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'active', NULL),
('TBA000203', 'Keyboard', 'Peripheral', 'N/A', 'LOGITECH', 'MX Keys', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'active', NULL),
('TBA000204', 'Webcam', 'Peripheral', 'CAM789012', 'LOGITECH', 'C920 HD Pro', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'active', NULL),
('TBA000205', 'Laptop', 'System', 'C02XL3FYJGH5', 'APPLE', 'MacBook Pro 14"', 'macOS Sonoma', 'Apple M3 Pro', '18', '512 GB', 'Excellent', 'maintenance', NULL),
('TBA000206', 'Docking Station', 'Peripheral', 'DOCK123456', 'DELL', 'WD19TBS', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'active', NULL)
ON CONFLICT (asset_id) DO NOTHING;

-- ==========================================================
-- VERIFICATION QUERIES (for testing)
-- ==========================================================

-- Check assigned assets with employee details
-- SELECT a.asset_id, a.status, a.assigned_employee_id, e.full_name, e.email
-- FROM assets.assets a
-- LEFT JOIN employees.employees e ON a.assigned_employee_id = e.id
-- WHERE a.status = 'assigned';

-- Check assignment history
-- SELECT ah.*, a.asset_id, e.full_name
-- FROM assets.assignment_history ah
-- JOIN assets.assets a ON ah.asset_id = a.id
-- LEFT JOIN employees.employees e ON ah.employee_id = e.id
-- ORDER BY ah.assigned_date DESC;

-- Check maintenance logs
-- SELECT ml.*, a.asset_id
-- FROM assets.maintenance_logs ml
-- JOIN assets.assets a ON ml.asset_id = a.id
-- ORDER BY ml.performed_at DESC;

SELECT 'Seed data inserted successfully!' as result;
