-- Migration: Service subscriptions for Hostel, Transit, Gym access gating
-- Students/Parents must subscribe to access each service module

-- ============================================================
-- 1. SERVICE PRICING TABLE (Institute Admin sets prices)
-- ============================================================
CREATE TABLE IF NOT EXISTS service_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('hostel', 'transit', 'gym')),
  name TEXT NOT NULL,                          -- e.g. 'Monthly Hostel', 'Bus Pass', 'Gym Basic'
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,      -- in INR
  duration_days INTEGER NOT NULL DEFAULT 30,   -- subscription validity
  features TEXT[] DEFAULT '{}',                -- what's included
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(institution_id, service_type, name)
);

-- ============================================================
-- 2. STUDENT SERVICE SUBSCRIPTIONS (tracks who bought what)
-- ============================================================
CREATE TABLE IF NOT EXISTS service_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('hostel', 'transit', 'gym')),
  pricing_id UUID NOT NULL REFERENCES service_pricing(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_service_sub_student ON service_subscriptions(student_id, service_type, status);
CREATE INDEX IF NOT EXISTS idx_service_pricing_inst ON service_pricing(institution_id, service_type);

-- ============================================================
-- 3. SEED DEFAULT PRICING for existing institution
-- ============================================================
INSERT INTO service_pricing (institution_id, service_type, name, description, price, duration_days, features) VALUES
  -- Hostel
  ('a0000000-0000-0000-0000-000000000001', 'hostel', 'Monthly Hostel Stay', 'Access to hostel room, WiFi, common areas', 5000.00, 30, ARRAY['Room Allocation', 'WiFi Access', 'Common Areas', 'Hostel Complaints', 'Leave Requests', 'Visitor Management']),
  -- Transit
  ('a0000000-0000-0000-0000-000000000001', 'transit', 'Monthly Bus Pass', 'Unlimited rides on assigned route', 1200.00, 30, ARRAY['Live Bus Tracking', 'Route Map', 'ETA Predictions', 'Boarding Pass', 'Carbon Offset']),
  -- Gym
  ('a0000000-0000-0000-0000-000000000001', 'gym', 'Monthly Gym Basic', 'Gym floor access with basic equipment', 599.00, 30, ARRAY['Gym Floor Access', 'Basic Equipment', 'Locker Room', 'Workout Logging']),
  ('a0000000-0000-0000-0000-000000000001', 'gym', 'Quarterly Gym Prime', 'Full gym access with trainer consultations', 1499.00, 90, ARRAY['All Cardio Equipment', 'Trainer Consultation', 'Locker + Shower', 'Progress Dashboard']),
  ('a0000000-0000-0000-0000-000000000001', 'gym', 'Annual Gym Pro Elite', '24/7 premium gym access with personal locker', 4999.00, 365, ARRAY['24/7 Access', 'All Equipment & Classes', 'Personal Locker', 'Monthly Body Metrics', 'Unlimited Trainer Sessions'])
ON CONFLICT (institution_id, service_type, name) DO NOTHING;

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================
ALTER TABLE service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_pricing_all" ON service_pricing FOR ALL USING (true);
CREATE POLICY "service_subscriptions_all" ON service_subscriptions FOR ALL USING (true);
