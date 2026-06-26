-- =============================================================
-- Migration: Live Bus Tracking — Real GPS Telemetry
-- Adds GPS coordinate columns to buses table and creates
-- transit_location_history for historical tracking data.
-- =============================================================

-- 1. Add live tracking columns to existing buses table
ALTER TABLE buses ADD COLUMN IF NOT EXISTS current_lat DECIMAL(10, 8);
ALTER TABLE buses ADD COLUMN IF NOT EXISTS current_lng DECIMAL(11, 8);
ALTER TABLE buses ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS speed_kmh DECIMAL(5, 2) DEFAULT 0;

-- Note: buses table already has an is_active column from the initial schema.
-- We do NOT re-add it to avoid conflicts.

-- 2. Create transit location history table
CREATE TABLE IF NOT EXISTS transit_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id),
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  speed_kmh DECIMAL(5, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  institution_id UUID REFERENCES institutions(id)
);

-- 3. Performance index for time-series queries
CREATE INDEX IF NOT EXISTS idx_transit_history_bus_time
  ON transit_location_history(bus_id, recorded_at DESC);

-- 4. Enable RLS
ALTER TABLE transit_location_history ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'transit_location_history' AND policyname = 'transit_history_select_policy'
  ) THEN
    CREATE POLICY transit_history_select_policy ON transit_location_history
      FOR SELECT USING (institution_id = get_auth_institution_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'transit_location_history' AND policyname = 'transit_history_insert_policy'
  ) THEN
    CREATE POLICY transit_history_insert_policy ON transit_location_history
      FOR INSERT WITH CHECK (institution_id = get_auth_institution_id());
  END IF;
END $$;

-- Service role bypass for backend writes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'transit_location_history' AND policyname = 'transit_history_service_role'
  ) THEN
    CREATE POLICY transit_history_service_role ON transit_location_history
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
