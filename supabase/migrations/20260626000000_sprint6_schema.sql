-- Migration: Sprint 6 (Transit Module Gaps & Fixes)
-- Target: Supabase / PostgreSQL

-- 1. Create student_transit_logs table
CREATE TABLE IF NOT EXISTS student_transit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES bus_trips(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('boarding', 'alighting')),
    stop_name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE student_transit_logs ENABLE ROW LEVEL SECURITY;

-- Create Tenant Isolation Policy
DROP POLICY IF EXISTS tenant_isolation_student_transit_logs ON student_transit_logs;
CREATE POLICY tenant_isolation_student_transit_logs ON student_transit_logs
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

-- 2. Fix get_bus_eta_for_student function
CREATE OR REPLACE FUNCTION get_bus_eta_for_student(p_student_id UUID)
RETURNS TABLE (
    bus_id UUID,
    bus_name VARCHAR,
    route_name VARCHAR,
    stop_name VARCHAR,
    stop_index INTEGER,
    distance_km NUMERIC,
    eta_minutes INTEGER,
    latitude NUMERIC,
    longitude NUMERIC,
    last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription RECORD;
    v_bus RECORD;
    v_stop_index INTEGER;
    v_distance NUMERIC;
    v_velocity NUMERIC;
BEGIN
    -- Get student's active bus subscription from transport_subscriptions
    SELECT 
        ts.route_id, 
        ts.stop_name, 
        br.name AS route_name,
        br.stops,
        b.id AS bus_id,
        b.vehicle_number AS bus_name
    INTO v_subscription
    FROM transport_subscriptions ts
    JOIN bus_routes br ON ts.route_id = br.id
    LEFT JOIN buses b ON b.route_id = ts.route_id AND b.is_active = true
    WHERE ts.student_id = p_student_id AND ts.status = 'active' AND ts.end_date >= CURRENT_DATE
    LIMIT 1;

    IF v_subscription IS NULL THEN RETURN; END IF;

    -- Get latest bus location
    SELECT bl.bus_id, bl.latitude, bl.longitude, bl.speed, bl.timestamp AS recorded_at
    INTO v_bus
    FROM bus_tracking bl
    WHERE bl.bus_id = v_subscription.bus_id
    ORDER BY bl.timestamp DESC
    LIMIT 1;

    IF v_bus IS NULL THEN RETURN; END IF;

    -- Find stop_index matching stop_name in JSONB array stops
    SELECT (idx - 1) INTO v_stop_index
    FROM jsonb_array_elements(v_subscription.stops) WITH ORDINALITY arr(elem, idx)
    WHERE elem->>'name' = v_subscription.stop_name
    LIMIT 1;
    
    IF v_stop_index IS NULL THEN
        v_stop_index := 0;
    END IF;

    -- Calculate distance to student's stop using Haversine
    IF v_subscription.stops IS NOT NULL AND jsonb_array_length(v_subscription.stops) > 0 THEN
        DECLARE
            v_stop_lat NUMERIC;
            v_stop_lon NUMERIC;
        BEGIN
            v_stop_lat := (v_subscription.stops->v_stop_index->>'latitude')::NUMERIC;
            v_stop_lon := (v_subscription.stops->v_stop_index->>'longitude')::NUMERIC;

            v_distance := (
                6371 * acos(
                    cos(radians(v_bus.latitude)) * cos(radians(v_stop_lat)) *
                    cos(radians(v_stop_lon) - radians(v_bus.longitude)) +
                    sin(radians(v_bus.latitude)) * sin(radians(v_stop_lat))
                )
            );

            v_velocity := CASE WHEN v_bus.speed > 5 THEN v_bus.speed ELSE 25 END;

            bus_id := v_bus.bus_id;
            bus_name := v_subscription.bus_name;
            route_name := v_subscription.route_name;
            stop_name := v_subscription.stop_name;
            stop_index := v_stop_index;
            distance_km := ROUND(v_distance, 2);
            eta_minutes := ROUND((v_distance / v_velocity) * 60);
            latitude := v_bus.latitude;
            longitude := v_bus.longitude;
            last_updated := v_bus.recorded_at;
            RETURN NEXT;
        END;
    END IF;
END;
$$;

-- 3. Fix get_child_bus_status function
CREATE OR REPLACE FUNCTION get_child_bus_status()
RETURNS TABLE (
    is_on_bus BOOLEAN,
    bus_name VARCHAR,
    route_name VARCHAR,
    last_stop VARCHAR,
    eta_minutes INTEGER,
    latitude NUMERIC,
    longitude NUMERIC,
    last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_subscription RECORD;
    v_bus RECORD;
    v_stop_index INTEGER;
    v_distance NUMERIC;
    v_velocity NUMERIC;
    v_latest_log RECORD;
BEGIN
    -- Get parent's linked child
    SELECT psl.student_id INTO v_student_id
    FROM parent_student_links psl
    WHERE psl.parent_user_id = auth.uid() AND psl.verified = true
    ORDER BY psl.is_primary DESC NULLS LAST LIMIT 1;

    IF v_student_id IS NULL THEN RETURN; END IF;

    -- Get student's bus subscription from transport_subscriptions
    SELECT 
        ts.route_id, 
        ts.stop_name, 
        br.name AS route_name,
        br.stops,
        b.id AS bus_id,
        b.vehicle_number AS bus_name
    INTO v_subscription
    FROM transport_subscriptions ts
    JOIN bus_routes br ON ts.route_id = br.id
    LEFT JOIN buses b ON b.route_id = ts.route_id AND b.is_active = true
    WHERE ts.student_id = v_student_id AND ts.status = 'active' AND ts.end_date >= CURRENT_DATE
    LIMIT 1;

    IF v_subscription IS NULL THEN
        is_on_bus := false;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Check if student is boarded on the bus today based on student_transit_logs
    SELECT stl.direction, stl.stop_name, stl.timestamp 
    INTO v_latest_log
    FROM student_transit_logs stl
    WHERE stl.student_id = v_student_id 
      AND stl.timestamp::DATE = CURRENT_DATE
    ORDER BY stl.timestamp DESC
    LIMIT 1;

    IF v_latest_log IS NULL OR v_latest_log.direction <> 'boarding' THEN
        is_on_bus := false;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Get latest bus location
    SELECT bt.latitude, bt.longitude, bt.speed, bt.timestamp
    INTO v_bus
    FROM bus_tracking bt
    WHERE bt.bus_id = v_subscription.bus_id
    ORDER BY bt.timestamp DESC
    LIMIT 1;

    is_on_bus := true;
    bus_name := v_subscription.bus_name;
    route_name := v_subscription.route_name;
    last_stop := v_latest_log.stop_name;
    last_updated := COALESCE(v_bus.timestamp, v_latest_log.timestamp);
    
    IF v_bus IS NOT NULL THEN
        latitude := v_bus.latitude;
        longitude := v_bus.longitude;
        
        -- Find stop index in stops array
        SELECT (idx - 1) INTO v_stop_index
        FROM jsonb_array_elements(v_subscription.stops) WITH ORDINALITY arr(elem, idx)
        WHERE elem->>'name' = v_subscription.stop_name
        LIMIT 1;
        
        IF v_stop_index IS NULL THEN v_stop_index := 0; END IF;
        
        -- Calculate ETA to student's stop
        IF v_subscription.stops IS NOT NULL AND jsonb_array_length(v_subscription.stops) > 0 THEN
            DECLARE
                v_stop_lat NUMERIC;
                v_stop_lon NUMERIC;
            BEGIN
                v_stop_lat := (v_subscription.stops->v_stop_index->>'latitude')::NUMERIC;
                v_stop_lon := (v_subscription.stops->v_stop_index->>'longitude')::NUMERIC;
                
                v_distance := (
                    6371 * acos(
                        cos(radians(v_bus.latitude)) * cos(radians(v_stop_lat)) *
                        cos(radians(v_stop_lon) - radians(v_bus.longitude)) +
                        sin(radians(v_bus.latitude)) * sin(radians(v_stop_lat))
                    )
                );
                
                v_velocity := CASE WHEN v_bus.speed > 5 THEN v_bus.speed ELSE 25 END;
                eta_minutes := ROUND((v_distance / v_velocity) * 60);
            END;
        ELSE
            eta_minutes := 15; -- Fallback
        END IF;
    ELSE
        latitude := 26.2912;
        longitude := 73.0156;
        eta_minutes := 15;
    END IF;
    
    RETURN NEXT;
END;
$$;
