-- ==========================================================
-- Asset Management - History & Categories Migration
-- ==========================================================

-- 1. Asset Categories Table (For Dynamic Onboarding)
CREATE TABLE IF NOT EXISTS assets.asset_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    spec_fields JSONB NOT NULL,     -- Array of field names e.g., ["Manufacturer", "Model"]
    allowed_values JSONB NOT NULL,  -- Object with dropdown options e.g., {"Manufacturer": ["Dell", "HP"]}
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Assignment History Table (Tracking Asset Movement)
CREATE TABLE IF NOT EXISTS assets.assignment_history (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets.assets(id) ON DELETE CASCADE,
    employee_id INTEGER, -- References employees.employees(id) (Soft FK)
    assigned_by INTEGER, -- References auth.users(id) (Soft FK)
    assigned_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    return_date TIMESTAMP WITHOUT TIME ZONE,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_assignment_history_asset ON assets.assignment_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_employee ON assets.assignment_history(employee_id);

-- 3. Lifecycle Events Table (Audit Trail)
CREATE TYPE assets.event_type_enum AS ENUM ('created', 'status_change', 'maintenance', 'assigned', 'returned', 'audit');

CREATE TABLE IF NOT EXISTS assets.asset_lifecycle_events (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets.assets(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- using VARCHAR to avoid enum complexity if needed, or cast to enum
    previous_value JSONB, -- Store old state/values
    new_value JSONB,      -- Store new state/values
    created_by INTEGER,   -- References auth.users(id) (Soft FK)
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_asset ON assets.asset_lifecycle_events(asset_id);

-- 4. Seed Data for Asset Categories
INSERT INTO assets.asset_categories (name, spec_fields, allowed_values) VALUES
('Laptop', 
 '["Manufacturer", "Model", "OS", "Processor", "RAM", "Storage", "Battery Condition"]'::jsonb,
 '{"OS": ["Windows 10", "Windows 11"], "RAM": ["12 GB", "16 GB", "20 GB", "24 GB", "40 GB"], "Model": ["ThinkPad T470s", "Thinkpad T490S", "Thinkpad T490", "ThinkPad T470", "Latitude 7410", "EliteBook 840 G7", "20HGS18V00"], "Storage": ["237 GB", "238 GB", "240 GB", "256 GB", "476 GB", "477 GB", "500 GB"], "Processor": ["i7", "Intel Core i5", "Intel Core i7 Gen 6", "Intel Core i7 Gen 7", "Intel Core i7 Gen 10"], "Manufacturer": ["LENOVO", "DELL", "HP"], "Battery Condition": ["Excellent", "Good", "Average", "Bad"]}'::jsonb),

('Mac Mini', 
 '["Manufacturer", "Model", "OS", "Processor", "RAM", "Storage"]'::jsonb,
 '{"OS": ["MacOS"], "RAM": ["16 GB"], "Model": ["Mac mini m4"], "Storage": ["500 GB"], "Processor": ["Apple M4"], "Manufacturer": ["APPLE"]}'::jsonb),

('Mobile', 
 '["Manufacturer", "Model"]'::jsonb,
 '{"Model": ["Iphone 14", "Iphone 13", "Iphone 15"], "Manufacturer": ["APPLE", "Samsung", "Google"]}'::jsonb),

('Monitor', 
 '["Manufacturer", "Model", "Screen Size"]'::jsonb,
 '{"Model": ["P27 G5", "E2421HN", "P24V G5", "E2221HN"], "Screen Size": ["22 inch", "24 inch", "27 inch"], "Manufacturer": ["HP", "DELL"]}'::jsonb),

('Mouse', 
 '["Manufacturer", "Model", "Type"]'::jsonb,
 '{"Type": ["Wireless", "Wired"], "Model": ["M185", "H390", "M90", "K235"], "Manufacturer": ["LOGITECH"]}'::jsonb),

('Keyboard', 
 '["Manufacturer", "Model", "Type"]'::jsonb,
 '{"Type": ["Wireless", "Wired"], "Model": ["K235"], "Manufacturer": ["LOGITECH"]}'::jsonb),

('Headset', 
 '["Manufacturer", "Model"]'::jsonb,
 '{"Model": ["H390", "M185", "C3225T"], "Manufacturer": ["LOGITECH", "PLANTRONICS"]}'::jsonb),

('Charger', 
 '["Type"]'::jsonb,
 '{"Type": ["Laptop Charger", "Mobile Charger"]}'::jsonb),

('Router', 
 '["Manufacturer", "Model"]'::jsonb,
 '{"Model": ["Archer C6U"], "Manufacturer": ["TP-LINK"]}'::jsonb),

('TV', 
 '["Manufacturer", "Model"]'::jsonb,
 '{"Model": ["LH43BECHLGKXL"], "Manufacturer": ["SAMSUNG"]}'::jsonb),

('Printer', 
 '["Manufacturer", "Model"]'::jsonb,
 '{"Model": ["SHNGCN-1202N-01"], "Manufacturer": ["HP"]}'::jsonb)
ON CONFLICT (name) DO UPDATE SET 
    spec_fields = EXCLUDED.spec_fields,
    allowed_values = EXCLUDED.allowed_values;
