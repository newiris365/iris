-- ============================================================
-- DRIVER MODULE: RLS, Trip Console, Route Schedule, Headcount,
-- Emergency Reports
-- ============================================================

-- ============================================================
-- 1. DRIVER RLS: Scoped to own bus, own trips, own route
-- ============================================================

-- Drop overly-broad bus_trips policy (replaced with driver-scoped)
DROP POLICY IF EXISTS tenant_bus_trips_policy ON bus_trips;
CREATE POLICY "bus_trips_admin_select" ON bus_trips
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "bus_trips_driver_select" ON bus_trips
    FOR SELECT USING (
        get_auth_user_role() = 'Driver'
        AND driver_id IN (
            SELECT bd.id FROM bus_drivers bd
            WHERE bd.user_id = auth.uid()
        )
    );

CREATE POLICY "bus_trips_driver_insert" ON bus_trips
    FOR INSERT WITH CHECK (
        get_auth_user_role() = 'Driver'
        AND driver_id IN (
            SELECT bd.id FROM bus_drivers bd
            WHERE bd.user_id = auth.uid()
        )
    );

CREATE POLICY "bus_trips_driver_update" ON bus_trips
    FOR UPDATE USING (
        get_auth_user_role() = 'Driver'
        AND driver_id IN (
            SELECT bd.id FROM bus_drivers bd
            WHERE bd.user_id = auth.uid()
        )
    );

-- Drop overly-broad trip_stop_logs policy
DROP POLICY IF EXISTS tenant_trip_stop_logs_policy ON trip_stop_logs;
CREATE POLICY "trip_stop_logs_admin_all" ON trip_stop_logs
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "trip_stop_logs_driver_select" ON trip_stop_logs
    FOR SELECT USING (
        get_auth_user_role() = 'Driver'
        AND trip_id IN (
            SELECT bt.id FROM bus_trips bt
            JOIN bus_drivers bd ON bt.driver_id = bd.id
            WHERE bd.user_id = auth.uid()
        )
    );

CREATE POLICY "trip_stop_logs_driver_insert" ON trip_stop_logs
    FOR INSERT WITH CHECK (
        get_auth_user_role() = 'Driver'
        AND trip_id IN (
            SELECT bt.id FROM bus_trips bt
            JOIN bus_drivers bd ON bt.driver_id = bd.id
            WHERE bd.user_id = auth.uid()
        )
    );

CREATE POLICY "trip_stop_logs_driver_update" ON trip_stop_logs
    FOR UPDATE USING (
        get_auth_user_role() = 'Driver'
        AND trip_id IN (
            SELECT bt.id FROM bus_trips bt
            JOIN bus_drivers bd ON bt.driver_id = bd.id
            WHERE bd.user_id = auth.uid()
        )
    );

-- Drop overly-broad bus_incidents policy
DROP POLICY IF EXISTS tenant_bus_incidents_policy ON bus_incidents;
CREATE POLICY "bus_incidents_admin_all" ON bus_incidents
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "bus_incidents_driver_select" ON bus_incidents
    FOR SELECT USING (
        get_auth_user_role() = 'Driver'
        AND reported_by = auth.uid()
    );

CREATE POLICY "bus_incidents_driver_insert" ON bus_incidents
    FOR INSERT WITH CHECK (
        get_auth_user_role() = 'Driver'
        AND institution_id = get_auth_institution_id()
    );

-- Driver can only see their own bus
DROP POLICY IF EXISTS "buses_select" ON buses;
CREATE POLICY "buses_admin_select" ON buses
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden', 'Student', 'Parent', 'Staff', 'Teacher')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "buses_driver_select" ON buses
    FOR SELECT USING (
        get_auth_user_role() = 'Driver'
        AND id IN (
            SELECT b.id FROM buses b
            JOIN bus_drivers bd ON b.driver_id = bd.id
            WHERE bd.user_id = auth.uid()
        )
    );

-- Driver can only see their own route
DROP POLICY IF EXISTS "bus_routes_select" ON bus_routes;
CREATE POLICY "bus_routes_admin_select" ON bus_routes
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden', 'Student', 'Parent', 'Staff', 'Teacher')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "bus_routes_driver_select" ON bus_routes
    FOR SELECT USING (
        get_auth_user_role() = 'Driver'
        AND id IN (
            SELECT b.route_id FROM buses b
            JOIN bus_drivers bd ON b.driver_id = bd.id
            WHERE bd.user_id = auth.uid()
        )
    );

-- Driver can see their route's subscriptions (headcount)
DROP POLICY IF EXISTS "transport_subscriptions_select" ON transport_subscriptions;
CREATE POLICY "transport_subscriptions_admin_select" ON transport_subscriptions
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "transport_subscriptions_student_select" ON transport_subscriptions
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "transport_subscriptions_driver_select" ON transport_subscriptions
    FOR SELECT USING (
        get_auth_user_role() = 'Driver'
        AND route_id IN (
            SELECT b.route_id FROM buses b
            JOIN bus_drivers bd ON b.driver_id = bd.id
            WHERE bd.user_id = auth.uid()
        )
        AND status = 'active'
    );

-- ============================================================
-- 2. DRIVER RPCs: Get own bus, route, trips
-- ============================================================

-- Get driver's assigned bus and route
CREATE OR REPLACE FUNCTION get_driver_assignments()
RETURNS TABLE (
    bus_id UUID,
    vehicle_number TEXT,
    bus_name TEXT,
    capacity INTEGER,
    bus_model TEXT,
    route_id UUID,
    route_name TEXT,
    route_number TEXT,
    stops JSONB,
    distance_km DECIMAL,
    duration_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT
        b.id, b.vehicle_number, b.name, b.capacity, b.model,
        br.id, br.name, br.route_number, br.stops,
        br.distance_km, br.duration_minutes
    FROM buses b
    JOIN bus_routes br ON b.route_id = br.id
    WHERE b.driver_id = v_driver_id
    AND b.is_active = true;
END;
$$;

-- Get driver's today's trip
CREATE OR REPLACE FUNCTION get_driver_today_trip()
RETURNS TABLE (
    trip_id UUID,
    bus_id UUID,
    route_id UUID,
    trip_type TEXT,
    status TEXT,
    scheduled_start TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    delay_minutes INTEGER,
    passenger_count INTEGER,
    route_name TEXT,
    stops JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT
        bt.id, bt.bus_id, bt.route_id, bt.trip_type, bt.status,
        bt.scheduled_start, bt.actual_start, bt.actual_end,
        bt.delay_minutes, bt.passenger_count,
        br.name, br.stops
    FROM bus_trips bt
    JOIN buses b ON bt.bus_id = b.id
    JOIN bus_routes br ON bt.route_id = br.id
    WHERE bt.driver_id = v_driver_id
    AND bt.trip_date = CURRENT_DATE
    ORDER BY bt.scheduled_start DESC
    LIMIT 1;
END;
$$;

-- Start a trip
CREATE OR REPLACE FUNCTION start_bus_trip(
    p_bus_id UUID,
    p_route_id UUID,
    p_trip_type TEXT DEFAULT 'morning'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
    v_trip_id UUID;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Driver profile not found.');
    END IF;

    -- Check no active trip already
    IF EXISTS (
        SELECT 1 FROM bus_trips
        WHERE driver_id = v_driver_id
        AND trip_date = CURRENT_DATE
        AND status = 'active'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'You already have an active trip. End it first.');
    END IF;

    INSERT INTO bus_trips (
        institution_id, bus_id, route_id, driver_id,
        trip_date, trip_type, scheduled_start, actual_start, status
    ) VALUES (
        (SELECT institution_id FROM bus_drivers WHERE id = v_driver_id),
        p_bus_id, p_route_id, v_driver_id,
        CURRENT_DATE, p_trip_type, NOW(), NOW(), 'active'
    ) RETURNING id INTO v_trip_id;

    -- Update bus is_active
    UPDATE buses SET is_active = true WHERE id = p_bus_id;

    RETURN json_build_object('success', true, 'trip_id', v_trip_id, 'message', 'Trip started.');
END;
$$;

-- End a trip
CREATE OR REPLACE FUNCTION end_bus_trip(p_trip_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Driver profile not found.');
    END IF;

    UPDATE bus_trips
    SET status = 'completed', actual_end = NOW()
    WHERE id = p_trip_id
    AND driver_id = v_driver_id
    AND status = 'active';

    IF FOUND THEN
        -- Deactivate old tracking
        UPDATE bus_tracking SET is_active = false
        WHERE bus_id = (SELECT bus_id FROM bus_trips WHERE id = p_trip_id)
        AND is_active = true;

        RETURN json_build_object('success', true, 'message', 'Trip ended.');
    ELSE
        RETURN json_build_object('success', false, 'error', 'Trip not found or already ended.');
    END IF;
END;
$$;

-- Get student headcount for driver's route today
CREATE OR REPLACE FUNCTION get_driver_route_headcount()
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number TEXT,
    stop_name TEXT,
    has_boarded BOOLEAN,
    boarded_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
    v_route_id UUID;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN RETURN; END IF;

    SELECT b.route_id INTO v_route_id
    FROM buses b WHERE b.driver_id = v_driver_id AND b.is_active = true
    LIMIT 1;

    IF v_route_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT
        s.id,
        u.name,
        s.roll_number,
        ts.stop_name,
        CASE WHEN bt.boarded_at IS NOT NULL THEN true ELSE false END,
        bt.boarded_at
    FROM transport_subscriptions ts
    JOIN students s ON ts.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN bus_tracking bt ON bt.student_id = s.id
        AND bt.bus_id = (SELECT id FROM buses WHERE driver_id = v_driver_id AND is_active = true LIMIT 1)
        AND bt.boarded_at::DATE = CURRENT_DATE
    WHERE ts.route_id = v_route_id
    AND ts.status = 'active'
    ORDER BY ts.stop_name, u.name;
END;
$$;

-- Get trip stop schedule (from route stops)
CREATE OR REPLACE FUNCTION get_driver_stop_schedule()
RETURNS TABLE (
    stop_index INTEGER,
    stop_name TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    scheduled_time TEXT,
    is_reached BOOLEAN,
    reached_at TIMESTAMPTZ,
    passengers_boarded INTEGER,
    passengers_alighted INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
    v_route_id UUID;
    v_trip_id UUID;
    v_stops JSONB;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN RETURN; END IF;

    SELECT b.route_id INTO v_route_id
    FROM buses b WHERE b.driver_id = v_driver_id AND b.is_active = true
    LIMIT 1;

    IF v_route_id IS NULL THEN RETURN; END IF;

    -- Get today's trip
    SELECT bt.id INTO v_trip_id
    FROM bus_trips bt
    WHERE bt.driver_id = v_driver_id
    AND bt.trip_date = CURRENT_DATE
    AND bt.status = 'active'
    LIMIT 1;

    -- Get stops from route
    SELECT br.stops INTO v_stops
    FROM bus_routes br WHERE br.id = v_route_id;

    IF v_stops IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT
        (stop->>'stop_index')::INTEGER,
        stop->>'name',
        (stop->>'latitude')::DECIMAL,
        (stop->>'longitude')::DECIMAL,
        COALESCE(stop->>'scheduled_time_morning', stop->>'scheduled_time_evening'),
        COALESCE(tsl.actual_arrival IS NOT NULL, false),
        tsl.actual_arrival,
        COALESCE(tsl.passengers_boarded, 0),
        COALESCE(tsl.passengers_alighted, 0)
    FROM jsonb_array_elements(v_stops) AS stop
    LEFT JOIN trip_stop_logs tsl ON tsl.trip_id = v_trip_id
        AND tsl.stop_index = (stop->>'stop_index')::INTEGER
    ORDER BY (stop->>'stop_index')::INTEGER;
END;
$$;

-- Mark a stop as reached
CREATE OR REPLACE FUNCTION mark_stop_reached(
    p_stop_index INTEGER,
    p_passengers_boarded INTEGER DEFAULT 0,
    p_passengers_alighted INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
    v_trip_id UUID;
    v_stop_name TEXT;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Driver profile not found.');
    END IF;

    SELECT bt.id INTO v_trip_id
    FROM bus_trips bt
    WHERE bt.driver_id = v_driver_id
    AND bt.trip_date = CURRENT_DATE
    AND bt.status = 'active'
    LIMIT 1;

    IF v_trip_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No active trip found.');
    END IF;

    -- Get stop name from route
    SELECT stop->>'name' INTO v_stop_name
    FROM bus_routes br,
         jsonb_array_elements(br.stops) stop
    WHERE br.id = (SELECT route_id FROM bus_trips WHERE id = v_trip_id)
    AND (stop->>'stop_index')::INTEGER = p_stop_index
    LIMIT 1;

    INSERT INTO trip_stop_logs (
        institution_id, trip_id, stop_index, stop_name,
        scheduled_time, actual_arrival, passengers_boarded, passengers_alighted
    ) VALUES (
        (SELECT institution_id FROM bus_trips WHERE id = v_trip_id),
        v_trip_id, p_stop_index, COALESCE(v_stop_name, 'Stop ' || p_stop_index),
        NOW(), NOW(), p_passengers_boarded, p_passengers_alighted
    )
    ON CONFLICT (trip_id, stop_index) DO UPDATE SET
        actual_arrival = NOW(),
        passengers_boarded = EXCLUDED.passengers_boarded,
        passengers_alighted = EXCLUDED.passengers_alighted;

    RETURN json_build_object('success', true, 'message', 'Stop marked as reached.');
END;
$$;

-- Add unique constraint for trip_stop_logs if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'trip_stop_logs_trip_stop_unique'
    ) THEN
        ALTER TABLE trip_stop_logs ADD CONSTRAINT trip_stop_logs_trip_stop_unique UNIQUE (trip_id, stop_index);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Constraint may already exist
    NULL;
END $$;

-- Report emergency/breakdown
CREATE OR REPLACE FUNCTION report_bus_incident(
    p_incident_type TEXT,
    p_description TEXT,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_severity TEXT DEFAULT 'high'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
    v_bus_id UUID;
    v_trip_id UUID;
    v_incident_id UUID;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Driver profile not found.');
    END IF;

    SELECT b.id, bt.id INTO v_bus_id, v_trip_id
    FROM buses b
    LEFT JOIN bus_trips bt ON bt.bus_id = b.id AND bt.status = 'active' AND bt.trip_date = CURRENT_DATE
    WHERE b.driver_id = v_driver_id AND b.is_active = true
    LIMIT 1;

    INSERT INTO bus_incidents (
        institution_id, bus_id, trip_id, incident_type,
        description, latitude, longitude, reported_by, severity, status
    ) VALUES (
        (SELECT institution_id FROM bus_drivers WHERE id = v_driver_id),
        v_bus_id, v_trip_id, p_incident_type,
        p_description, p_latitude, p_longitude, auth.uid(),
        p_severity, 'reported'
    ) RETURNING id INTO v_incident_id;

    RETURN json_build_object(
        'success', true,
        'incident_id', v_incident_id,
        'message', 'Emergency reported. Admin and warden have been alerted.'
    );
END;
$$;
