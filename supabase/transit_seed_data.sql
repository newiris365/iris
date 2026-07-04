-- =============================================================
-- Transit Module — Dummy Seed Data for Testing
-- Run this AFTER all migrations have been applied.
-- =============================================================

-- 1. Update existing bus with live GPS coordinates
UPDATE buses
SET current_lat = 26.2912,
    current_lng = 73.0156,
    speed_kmh = 35.5,
    last_location_at = NOW()
WHERE vehicle_number = 'RJ-19-PB-4050';

-- 2. Add more bus routes
INSERT INTO bus_routes (id, institution_id, name, route_number, stops, distance_km, duration_minutes, monthly_fee, is_active)
VALUES (
  '80000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Paota - Ratanada - Fort Route',
  'ROUTE-103',
  '[
    {"name": "Paota Circle Hub", "latitude": 26.2990, "longitude": 73.0390, "stop_index": 0, "scheduled_time_morning": "07:30 AM", "scheduled_time_evening": "06:00 PM"},
    {"name": "Ratanada Square", "latitude": 26.2850, "longitude": 73.0450, "stop_index": 1, "scheduled_time_morning": "07:45 AM", "scheduled_time_evening": "05:45 PM"},
    {"name": "Jodhpur Fort Gate", "latitude": 26.2980, "longitude": 73.0520, "stop_index": 2, "scheduled_time_morning": "08:00 AM", "scheduled_time_evening": "05:30 PM"},
    {"name": "SIET Campus Terminal", "latitude": 26.1200, "longitude": 73.0500, "stop_index": 3, "scheduled_time_morning": "08:45 AM", "scheduled_time_evening": "04:45 PM"}
  ]'::jsonb,
  22.0,
  50,
  1400.00,
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO bus_routes (id, institution_id, name, route_number, stops, distance_km, duration_minutes, monthly_fee, is_active)
VALUES (
  '80000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'Basni Industrial Express',
  'ROUTE-104',
  '[
    {"name": "Basni Industrial Zone", "latitude": 26.2410, "longitude": 72.9990, "stop_index": 0, "scheduled_time_morning": "07:45 AM", "scheduled_time_evening": "05:45 PM"},
    {"name": "M Highway Junction", "latitude": 6.2500, "longitude": 73.0100, "stop_index": 1, "scheduled_time_morning": "08:00 AM", "scheduled_time_evening": "05:30 PM"},
    {"name": "Chopasani Housing Board", "latitude": 26.2700, "longitude": 73.0250, "stop_index": 2, "scheduled_time_morning": "08:20 AM", "scheduled_time_evening": "05:10 PM"},
    {"name": "SIET Campus Terminal", "latitude": 26.1200, "longitude": 73.0500, "stop_index": 3, "scheduled_time_morning": "08:45 AM", "scheduled_time_evening": "04:45 PM"}
  ]'::jsonb,
  16.8,
  40,
  1100.00,
  true
) ON CONFLICT (id) DO NOTHING;

-- 3. Add more buses
INSERT INTO buses (id, institution_id, vehicle_number, model, capacity, route_id, driver_id, device_id, insurance_expiry, fitness_expiry, is_active, current_lat, current_lng, speed_kmh, last_location_at)
VALUES (
  '70000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'RJ-19-PC-2233',
  'Ashok Leyland Viking 45-Seater',
  45,
  '80000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000013',
  'GPS-DEV-2233',
  CURRENT_DATE + INTERVAL '60 days',
  CURRENT_DATE + INTERVAL '180 days',
  true,
  26.2845,
  73.0210,
  42.0,
  NOW() - INTERVAL '5 minutes'
) ON CONFLICT (vehicle_number) DO NOTHING;

INSERT INTO buses (id, institution_id, vehicle_number, model, capacity, route_id, driver_id, device_id, insurance_expiry, fitness_expiry, is_active, current_lat, current_lng, speed_kmh, last_location_at)
VALUES (
  '70000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'RJ-20-MA-7890',
  'Eicher Skyline 35-Seater',
  35,
  '80000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000013',
  'GPS-DEV-7890',
  CURRENT_DATE + INTERVAL '90 days',
  CURRENT_DATE + INTERVAL '200 days',
  true,
  26.2780,
  73.0305,
  28.0,
  NOW() - INTERVAL '15 minutes'
) ON CONFLICT (vehicle_number) DO NOTHING;

INSERT INTO buses (id, institution_id, vehicle_number, model, capacity, route_id, driver_id, device_id, insurance_expiry, fitness_expiry, is_active)
VALUES (
  '70000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'RJ-14-QA-5566',
  'Tata Winger 18-Seater',
  18,
  '80000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000013',
  'GPS-DEV-5566',
  CURRENT_DATE + INTERVAL '45 days',
  CURRENT_DATE + INTERVAL '150 days',
  true
) ON CONFLICT (vehicle_number) DO NOTHING;

-- 4. Add GPS tracking records for all buses
INSERT INTO bus_tracking (id, institution_id, bus_id, latitude, longitude, speed, heading, timestamp, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000001002', 'a0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', 26.2845, 73.0210, 42.0, 195.0, NOW() - INTERVAL '5 minutes', true),
  ('a0000000-0000-0000-0000-000000001003', 'a0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000003', 26.2780, 73.0305, 28.0, 170.0, NOW() - INTERVAL '15 minutes', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Add bus trips (today's active trips)
INSERT INTO bus_trips (id, institution_id, bus_id, route_id, driver_id, trip_date, trip_type, status, passenger_count, delay_minutes, departure_time)
VALUES
  ('b0000000-0000-0000-0000-000000002001', 'a0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000013', CURRENT_DATE, 'morning', 'in_transit', 28, 5, NOW() - INTERVAL '45 minutes'),
  ('b0000000-0000-0000-0000-000000002002', 'a0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000013', CURRENT_DATE, 'morning', 'in_transit', 35, 0, NOW() - INTERVAL '30 minutes'),
  ('b0000000-0000-0000-0000-000000002003', 'a0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000013', CURRENT_DATE, 'morning', 'completed', 22, 0, NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- 6. Add trip stop logs for completed trips
INSERT INTO trip_stop_logs (id, trip_id, stop_index, stop_name, scheduled_arrival, actual_arrival, passengers_boarded, passengers_alighted)
VALUES
  ('c0000000-0000-0000-0000-000000003001', 'b0000000-0000-0000-0000-000000002003', 0, 'Paota Circle Hub', '07:30 AM', '07:32 AM', 8, 0),
  ('c0000000-0000-0000-0000-000000003002', 'b0000000-0000-0000-0000-000000002003', 1, 'Ratanada Square', '07:45 AM', '07:48 AM', 6, 2),
  ('c0000000-0000-0000-0000-000000003003', 'b0000000-0000-0000-0000-000000002003', 2, 'Jodhpur Fort Gate', '08:00 AM', '08:05 AM', 5, 3),
  ('c0000000-0000-0000-0000-000000003004', 'b0000000-0000-0000-0000-000000002003', 3, 'SIET Campus Terminal', '08:45 AM', '08:50 AM', 3, 16)
ON CONFLICT (id) DO NOTHING;

-- 7. Add transport subscriptions for testing
INSERT INTO transport_subscriptions (id, institution_id, student_id, route_id, stop_name, start_date, end_date, amount_paid, transaction_id, status)
VALUES
  ('90000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', '80000000-0000-0000-0000-000000000002', 'Paota Circle Hub', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', 1500.00, 'TXN_TRANSIT_UPI_2', 'active'),
  ('90000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', '80000000-0000-0000-0000-000000000003', 'Ratanada Square', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '10 days', 1400.00, 'TXN_TRANSIT_UPI_3', 'active')
ON CONFLICT (id) DO NOTHING;

-- 8. Add bus incidents
INSERT INTO bus_incidents (id, institution_id, bus_id, trip_id, incident_type, description, severity, status, reported_by, reported_at)
VALUES
  ('d0000000-0000-0000-0000-000000004001', 'a0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000002001', 'mechanical', 'Minor brake squeal noticed during stop at Shastri Nagar', 'low', 'resolved', 'b0000000-0000-0000-0000-000000000013', NOW() - INTERVAL '2 hours'),
  ('d0000000-0000-0000-0000-000000004002', 'a0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', NULL, 'traffic', 'Heavy traffic near Paota Circle causing 10 min delay', 'medium', 'open', 'b0000000-0000-0000-0000-000000000013', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- 9. Add bus maintenance records
INSERT INTO bus_maintenance (id, institution_id, bus_id, maintenance_type, description, scheduled_date, completed_date, cost, service_center, status, next_due_date)
VALUES
  ('e0000000-0000-0000-0000-000000005001', 'a0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'oil_change', 'Regular 5000km oil change and filter replacement', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '15 days', 2500.00, 'Jodhpur Auto Works', 'completed', CURRENT_DATE + INTERVAL '90 days'),
  ('e0000000-0000-0000-0000-000000005002', 'a0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', 'tire_rotation', 'Seasonal tire rotation and alignment check', CURRENT_DATE + INTERVAL '5 days', NULL, 1800.00, 'Mohan Tyre Services', 'scheduled', NULL)
ON CONFLICT (id) DO NOTHING;

-- 10. Add carbon footprint data
INSERT INTO carbon_footprint (id, institution_id, month, year, co2_saved_kg, students_using_bus, certificate_url, created_at)
VALUES
  ('f0000000-0000-0000-0000-000000006001', 'a0000000-0000-0000-0000-000000000001', 6, 2026, 1420.75, 145, '/certificates/carbon-june-2026.pdf', NOW())
ON CONFLICT (id) DO NOTHING;

-- 11. Add parking slots
INSERT INTO parking_slots (id, institution_id, slot_number, zone, is_occupied, vehicle_number, vehicle_type, created_at)
VALUES
  ('aa000000-0000-0000-0000-000000007001', 'a0000000-0000-0000-0000-000000000001', 'C-01', 'Staff', false, NULL, NULL, NOW()),
  ('aa000000-0000-0000-0000-000000007002', 'a0000000-0000-0000-0000-000000000001', 'C-02', 'Staff', true, 'RJ-19-XX-1234', 'car', NOW()),
  ('aa000000-0000-0000-0000-000000007003', 'a0000000-0000-0000-0000-000000000001', 'C-03', 'Staff', false, NULL, NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- 12. Add location history points for live tracking replay
INSERT INTO transit_location_history (id, bus_id, driver_id, lat, lng, speed_kmh, recorded_at, institution_id)
SELECT
  gen_random_uuid(),
  '70000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000013',
  26.2912 + (random() * 0.01 - 0.005),
  73.0156 + (random() * 0.01 - 0.005),
  20 + (random() * 30),
  NOW() - (interval '1 minute' * generate_series(0, 59)),
  'a0000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM transit_location_history LIMIT 1);
