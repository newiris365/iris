-- Migration: Module 7 (Transit Module)
-- Target: Supabase / PostgreSQL

-- 1. Alter Existing Tables to match specifications
ALTER TABLE bus_routes ADD COLUMN IF NOT EXISTS route_number TEXT;
ALTER TABLE bus_routes ADD COLUMN IF NOT EXISTS distance_km DECIMAL;
ALTER TABLE bus_routes ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE bus_routes ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL;
ALTER TABLE bus_routes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE buses ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS insurance_expiry DATE;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS fitness_expiry DATE;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE bus_tracking ADD COLUMN IF NOT EXISTS heading DECIMAL;

ALTER TABLE transport_subscriptions ADD COLUMN IF NOT EXISTS stop_name TEXT;
ALTER TABLE transport_subscriptions ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE transport_subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Create New Tables
CREATE TABLE IF NOT EXISTS bus_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  license_number TEXT UNIQUE,
  license_expiry DATE,
  phone TEXT,
  address TEXT,
  emergency_contact TEXT,
  joining_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS bus_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
  route_id uuid REFERENCES bus_routes(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES bus_drivers(id) ON DELETE SET NULL,
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  trip_type TEXT CHECK (trip_type IN ('morning','evening','special')),
  scheduled_start TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled', -- scheduled, active, completed, cancelled, no_show
  delay_minutes INTEGER DEFAULT 0,
  passenger_count INTEGER DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS trip_stop_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES bus_trips(id) ON DELETE CASCADE,
  stop_index INTEGER,
  stop_name TEXT,
  scheduled_time TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  passengers_boarded INTEGER DEFAULT 0,
  passengers_alighted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bus_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES bus_trips(id) ON DELETE SET NULL,
  incident_type TEXT, -- breakdown, accident, traffic, medical, other
  description TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  reported_by uuid REFERENCES users(id) ON DELETE SET NULL,
  severity TEXT CHECK (severity IN ('low','medium','high','critical')) DEFAULT 'low',
  status TEXT CHECK (status IN ('reported','investigating','resolved')) DEFAULT 'reported',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bus_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
  maintenance_type TEXT, -- service, repair, inspection, tires, other
  scheduled_date DATE,
  completed_date DATE,
  cost DECIMAL DEFAULT 0,
  service_center TEXT,
  notes TEXT,
  next_due_date DATE
);

-- 3. Enable RLS
ALTER TABLE bus_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_stop_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_maintenance ENABLE ROW LEVEL SECURITY;

-- 4. Create Tenant Isolation Policies (safe drop first)
DROP POLICY IF EXISTS tenant_bus_drivers_policy ON bus_drivers;
CREATE POLICY tenant_bus_drivers_policy ON bus_drivers
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_bus_trips_policy ON bus_trips;
CREATE POLICY tenant_bus_trips_policy ON bus_trips
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_trip_stop_logs_policy ON trip_stop_logs;
CREATE POLICY tenant_trip_stop_logs_policy ON trip_stop_logs
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_bus_incidents_policy ON bus_incidents;
CREATE POLICY tenant_bus_incidents_policy ON bus_incidents
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_bus_maintenance_policy ON bus_maintenance;
CREATE POLICY tenant_bus_maintenance_policy ON bus_maintenance
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

-- 5. Seed Mock Transit Data
-- Inject Rajesh Kumar Driver details
INSERT INTO bus_drivers (id, user_id, institution_id, license_number, license_expiry, phone, address, emergency_contact, joining_date, is_active)
VALUES (
  'd0000000-0000-0000-0000-000000000013',
  'b0000000-0000-0000-0000-000000000013',
  'a0000000-0000-0000-0000-000000000001',
  'DL-14202500009',
  CURRENT_DATE + INTERVAL '5 years',
  '+919829012347',
  'Sardarpura 1st Road, Jodhpur',
  '+919829012340',
  '2024-01-15',
  true
) ON CONFLICT (license_number) DO NOTHING;

-- Seed Bus Routes
INSERT INTO bus_routes (id, institution_id, name, route_number, stops, distance_km, duration_minutes, monthly_fee, is_active)
VALUES (
  '80000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Jodhpur Central Route',
  'ROUTE-101',
  '[
    {"name": "Sardarpura 4th Road", "latitude": 26.2912, "longitude": 73.0156, "stop_index": 0, "scheduled_time_morning": "08:00 AM", "scheduled_time_evening": "05:30 PM"},
    {"name": "Shastri Nagar Circle", "latitude": 26.2647, "longitude": 73.0012, "stop_index": 1, "scheduled_time_morning": "08:15 AM", "scheduled_time_evening": "05:15 PM"},
    {"name": "Mogra Highway Stop", "latitude": 26.1543, "longitude": 73.0234, "stop_index": 2, "scheduled_time_morning": "08:30 AM", "scheduled_time_evening": "05:00 PM"},
    {"name": "SIET Campus Terminal", "latitude": 26.1200, "longitude": 73.0500, "stop_index": 3, "scheduled_time_morning": "08:45 AM", "scheduled_time_evening": "04:45 PM"}
  ]'::jsonb,
  18.5,
  45,
  1200.00,
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO bus_routes (id, institution_id, name, route_number, stops, distance_km, duration_minutes, monthly_fee, is_active)
VALUES (
  '80000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Mandore Outskirts Route',
  'ROUTE-102',
  '[
    {"name": "Mandore Garden Stop", "latitude": 26.3400, "longitude": 73.0400, "stop_index": 0, "scheduled_time_morning": "07:50 AM", "scheduled_time_evening": "05:40 PM"},
    {"name": "Paota Circle Hub", "latitude": 26.2990, "longitude": 73.0390, "stop_index": 1, "scheduled_time_morning": "08:10 AM", "scheduled_time_evening": "05:20 PM"},
    {"name": "Basni Industrial Zone", "latitude": 26.2410, "longitude": 72.9990, "stop_index": 2, "scheduled_time_morning": "08:25 AM", "scheduled_time_evening": "05:05 PM"},
    {"name": "SIET Campus Terminal", "latitude": 26.1200, "longitude": 73.0500, "stop_index": 3, "scheduled_time_morning": "08:45 AM", "scheduled_time_evening": "04:45 PM"}
  ]'::jsonb,
  24.2,
  55,
  1500.00,
  true
) ON CONFLICT (id) DO NOTHING;

-- Seed Buses
INSERT INTO buses (id, institution_id, vehicle_number, model, capacity, route_id, driver_id, device_id, insurance_expiry, fitness_expiry, is_active)
VALUES (
  '70000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'RJ-19-PB-4050',
  'Tata Starbus 40-Seater',
  40,
  '80000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000013', -- Rajesh Kumar Driver user_id
  'GPS-DEV-4050',
  CURRENT_DATE + INTERVAL '28 days', -- Warn soon
  CURRENT_DATE + INTERVAL '120 days',
  true
) ON CONFLICT (vehicle_number) DO NOTHING;

-- Seed active subscription for Khushal
INSERT INTO transport_subscriptions (id, institution_id, student_id, route_id, stop_name, start_date, end_date, amount_paid, transaction_id, status)
VALUES (
  '90000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000006', -- Khushal student_id
  '80000000-0000-0000-0000-000000000001', -- Route 101
  'Sardarpura 4th Road',
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '25 days',
  1200.00,
  'TXN_TRANSIT_UPI_1',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Seed active tracking position for Bus
INSERT INTO bus_tracking (id, institution_id, bus_id, latitude, longitude, speed, heading, timestamp, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000001001',
  'a0000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  26.2912,
  73.0156,
  35.5,
  180.0,
  now(),
  true
) ON CONFLICT (id) DO NOTHING;
