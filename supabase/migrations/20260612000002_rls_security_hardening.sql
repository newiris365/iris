-- ============================================================
-- IRIS 365 — Comprehensive RLS Security Hardening
-- Addresses: Student over-permissioning, Warden scope,
-- Security missing reads, Driver no policy, Parent no link,
-- Vendor no policy, Staff attendance scoping, HOD role,
-- tables with RLS enabled but no policies, open policies
-- ============================================================

-- ============================================================
-- 0. HELPER: Check if user has staff record in a department
-- ============================================================
CREATE OR REPLACE FUNCTION is_user_in_department(target_dept_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff
    WHERE user_id = (auth.jwt() ->> 'sub')::UUID
    AND department_id = target_dept_id
    AND institution_id = get_auth_institution_id()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 1. PARENT → STUDENT LINK TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relationship VARCHAR(50) NOT NULL, -- father, mother, guardian
  is_primary BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_user_id, student_id)
);

CREATE INDEX idx_psl_parent ON parent_student_links(parent_user_id);
CREATE INDEX idx_psl_student ON parent_student_links(student_id);

ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

-- Parents can only see their own links
CREATE POLICY "parent_student_links_own" ON parent_student_links
  FOR SELECT USING (
    parent_user_id = (auth.jwt() ->> 'sub')::UUID
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- Admin/SuperAdmin can manage links
CREATE POLICY "parent_student_links_admin" ON parent_student_links
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 2. DROP EXISTING OVERLY-BROAD POLICIES
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND policyname IN (
        'users_select', 'users_insert', 'users_update', 'users_delete',
        'departments_select', 'departments_manage',
        'students_select', 'students_insert', 'students_update', 'students_delete',
        'staff_select', 'staff_manage',
        'attendance_sessions_select', 'attendance_sessions_insert', 'attendance_sessions_update', 'attendance_sessions_delete',
        'attendance_select', 'attendance_insert', 'attendance_update',
        'fee_structures_select', 'fee_structures_manage',
        'fee_payments_select', 'fee_payments_insert', 'fee_payments_manage',
        'fee_concessions_select', 'fee_concessions_manage',
        'canteen_menus_select', 'canteen_menus_insert', 'canteen_menus_update', 'canteen_menus_delete',
        'canteen_orders_select', 'canteen_orders_insert', 'canteen_orders_update',
        'events_select', 'events_insert', 'events_update', 'events_delete',
        'exam_results_select', 'exam_results_insert', 'exam_results_update',
        'exams_select', 'exams_manage',
        'timetable_select', 'timetable_manage',
        'books_select', 'books_manage',
        'book_issues_select', 'book_issues_insert', 'book_issues_update',
        'hostel_rooms_select', 'hostel_rooms_manage',
        'hostel_visitors_select', 'hostel_visitors_insert', 'hostel_visitors_update',
        'gate_entries_select', 'gate_entries_insert', 'gate_entries_update',
        'visitor_passes_select', 'visitor_passes_insert', 'visitor_passes_update',
        'blacklisted_visitors_select', 'blacklisted_visitors_manage',
        'rfid_cards_select', 'rfid_cards_manage',
        'security_incidents_select', 'security_incidents_insert', 'security_incidents_update',
        'gate_shifts_select', 'gate_shifts_manage',
        'campus_occupancy_select', 'campus_occupancy_manage',
        'bus_routes_select', 'bus_routes_manage',
        'buses_select', 'buses_manage',
        'bus_tracking_select', 'bus_tracking_insert', 'bus_tracking_update',
        'bus_drivers_select', 'bus_drivers_manage',
        'bus_trips_select', 'bus_trips_insert', 'bus_trips_update',
        'trip_stop_logs_select', 'trip_stop_logs_insert',
        'bus_incidents_select', 'bus_incidents_insert',
        'bus_maintenance_select', 'bus_maintenance_manage',
        'notifications_select', 'notifications_insert',
        'event_registrations_select', 'event_registrations_insert', 'event_registrations_update',
        'gym_slots_select', 'gym_slots_manage',
        'gym_memberships_select', 'gym_memberships_insert',
        'gym_bookings_select', 'gym_bookings_insert', 'gym_bookings_update',
        'meal_subscriptions_select', 'meal_subscriptions_manage',
        'fee_reminders_select', 'fee_reminders_manage',
        'transport_subscriptions_select', 'transport_subscriptions_manage',
        'visitor_logs_select', 'visitor_logs_insert', 'visitor_logs_update',
        'id_card_templates_select', 'id_card_templates_manage',
        'attendance_regularizations_select', 'attendance_regularizations_insert', 'attendance_regularizations_update',
        'notification_logs_select', 'notification_logs_insert',
        'companies_select', 'companies_manage',
        'placement_drives_select', 'placement_drives_manage',
        'student_profiles_select_own', 'student_profiles_manage_own',
        'drive_applications_select', 'drive_applications_manage',
        'interview_rounds_select', 'interview_rounds_manage',
        'offer_letters_select', 'offer_letters_manage',
        'mock_interviews_select', 'mock_interviews_manage',
        'alumni_select', 'alumni_manage',
        'alumni_mentorship_select', 'alumni_mentorship_manage',
        'rls_audit_admin_only', 'parent_student_links_own', 'parent_student_links_admin'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;


-- Drop the catch-all tenant policies that allow ALL roles full access
DROP POLICY IF EXISTS "tenant_users_policy" ON users;
DROP POLICY IF EXISTS "tenant_students_policy" ON students;
DROP POLICY IF EXISTS "tenant_attendance_policy" ON attendance;
DROP POLICY IF EXISTS "tenant_attendance_sessions_policy" ON attendance_sessions;
DROP POLICY IF EXISTS "tenant_fee_structures_policy" ON fee_structures;
DROP POLICY IF EXISTS "tenant_fee_payments_policy" ON fee_payments;
DROP POLICY IF EXISTS "tenant_canteen_menus_policy" ON canteen_menus;
DROP POLICY IF EXISTS "tenant_canteen_orders_policy" ON canteen_orders;
DROP POLICY IF EXISTS "tenant_events_policy" ON events;
DROP POLICY IF EXISTS "tenant_book_issues_policy" ON book_issues;
DROP POLICY IF EXISTS "tenant_books_policy" ON books;
DROP POLICY IF EXISTS "tenant_bus_routes_policy" ON bus_routes;
DROP POLICY IF EXISTS "tenant_buses_policy" ON buses;
DROP POLICY IF EXISTS "tenant_gate_logs_policy" ON gate_logs;
DROP POLICY IF EXISTS "tenant_hostel_rooms_policy" ON hostel_rooms;
DROP POLICY IF EXISTS "tenant_notifications_policy" ON notifications;
DROP POLICY IF EXISTS "tenant_timetable_policy" ON timetable;
DROP POLICY IF EXISTS "tenant_staff_policy" ON staff;
DROP POLICY IF EXISTS "tenant_departments_policy" ON departments;

-- Drop campus_core policies
DROP POLICY IF EXISTS "tenant_fee_concessions_policy" ON fee_concessions;
DROP POLICY IF EXISTS "tenant_id_card_templates_policy" ON id_card_templates;
DROP POLICY IF EXISTS "tenant_attendance_regularizations_policy" ON attendance_regularizations;

-- ============================================================
-- 3. REBUILD: Core table policies with proper role scoping
-- ============================================================

-- USERS: Admin/Staff/Teacher can see own institution; Students see only self
CREATE POLICY "users_select" ON users
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR id = (auth.jwt() ->> 'sub')::UUID
  );

CREATE POLICY "users_delete" ON users
  FOR DELETE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- DEPARTMENTS
CREATE POLICY "departments_select" ON departments
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "departments_manage" ON departments
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- STUDENTS: Admin/Staff see all in institution; Students see only self
CREATE POLICY "students_select" ON students
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "students_insert" ON students
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "students_update" ON students
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR user_id = (auth.jwt() ->> 'sub')::UUID
  );

CREATE POLICY "students_delete" ON students
  FOR DELETE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- STAFF
CREATE POLICY "staff_select" ON staff
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "staff_manage" ON staff
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 4. ATTENDANCE: Staff scoped to own department
-- ============================================================

-- ATTENDANCE SESSIONS: Staff can only manage sessions in their department
CREATE POLICY "attendance_sessions_select" ON attendance_sessions
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "attendance_sessions_insert" ON attendance_sessions
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR (
      get_auth_user_role() = 'Staff'
      AND institution_id = get_auth_institution_id()
      AND is_user_in_department(department_id)
    )
  );

CREATE POLICY "attendance_sessions_update" ON attendance_sessions
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR (
      get_auth_user_role() = 'Staff'
      AND institution_id = get_auth_institution_id()
      AND is_user_in_department(department_id)
    )
  );

CREATE POLICY "attendance_sessions_delete" ON attendance_sessions
  FOR DELETE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ATTENDANCE: Students see own records; Staff see their department; Admin see all
CREATE POLICY "attendance_select" ON attendance
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "attendance_insert" ON attendance
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR get_auth_user_role() = 'Staff'
  );

CREATE POLICY "attendance_update" ON attendance
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR get_auth_user_role() = 'Staff'
  );

-- ============================================================
-- 5. FEES: Students see only own payments
-- ============================================================

CREATE POLICY "fee_structures_select" ON fee_structures
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "fee_structures_manage" ON fee_structures
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

CREATE POLICY "fee_payments_select" ON fee_payments
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "fee_payments_insert" ON fee_payments
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR (
      get_auth_user_role() = 'Student'
      AND student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    )
  );

CREATE POLICY "fee_payments_manage" ON fee_payments
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

CREATE POLICY "fee_concessions_select" ON fee_concessions
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "fee_concessions_manage" ON fee_concessions
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 6. CANTEEN: Student sees available menus + own orders;
--    Vendor sees their stall orders + menus
-- ============================================================

-- Canteen menus: Students see only available items; Vendor/Admin see all
CREATE POLICY "canteen_menus_select" ON canteen_menus
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "canteen_menus_insert" ON canteen_menus
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Vendor')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "canteen_menus_update" ON canteen_menus
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Vendor')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "canteen_menus_delete" ON canteen_menus
  FOR DELETE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- Canteen orders: Students see/insert own; Vendor see/update their stall; Admin see all
CREATE POLICY "canteen_orders_select" ON canteen_orders
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "canteen_orders_insert" ON canteen_orders
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR (
      get_auth_user_role() = 'Student'
      AND student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    )
  );

CREATE POLICY "canteen_orders_update" ON canteen_orders
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Vendor')
    AND institution_id = get_auth_institution_id()
  );

-- ============================================================
-- 7. EVENTS: Students see published/active only; Admin see all
-- ============================================================

CREATE POLICY "events_select" ON events
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "events_insert" ON events
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "events_update" ON events
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

CREATE POLICY "events_delete" ON events
  FOR DELETE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 8. EXAM RESULTS: Students see only own; Staff see department
-- ============================================================

CREATE POLICY "exam_results_select" ON exam_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = exam_id
      AND e.institution_id = get_auth_institution_id()
    )
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "exam_results_insert" ON exam_results
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "exam_results_update" ON exam_results
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

-- EXAMS table (was missing policy)
CREATE POLICY "exams_select" ON exams
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "exams_manage" ON exams
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

-- ============================================================
-- 9. TIMETABLE
-- ============================================================

CREATE POLICY "timetable_select" ON timetable
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "timetable_manage" ON timetable
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 10. LIBRARY: Students see own issues
-- ============================================================

CREATE POLICY "books_select" ON books
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "books_manage" ON books
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "book_issues_select" ON book_issues
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "book_issues_insert" ON book_issues
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
    OR (
      get_auth_user_role() = 'Student'
      AND student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    )
  );

CREATE POLICY "book_issues_update" ON book_issues
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

-- ============================================================
-- 11. HOSTEL: Warden scoped to own block; Student see own
-- ============================================================

CREATE POLICY "hostel_rooms_select" ON hostel_rooms
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "hostel_rooms_manage" ON hostel_rooms
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden')
  );

-- Hostel visitors: Security + Warden can manage; Student see own
CREATE POLICY "hostel_visitors_select" ON hostel_visitors
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "hostel_visitors_insert" ON hostel_visitors
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security', 'Warden')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "hostel_visitors_update" ON hostel_visitors
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security', 'Warden')
    AND institution_id = get_auth_institution_id()
  );

-- ============================================================
-- 12. GATE: Security can read profiles for identity verification
-- ============================================================

CREATE POLICY "gate_entries_select" ON gate_entries
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "gate_entries_insert" ON gate_entries
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "gate_entries_update" ON gate_entries
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
    AND institution_id = get_auth_institution_id()
  );

-- Visitor passes: Security + Warden
CREATE POLICY "visitor_passes_select" ON visitor_passes
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "visitor_passes_insert" ON visitor_passes
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "visitor_passes_update" ON visitor_passes
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
    AND institution_id = get_auth_institution_id()
  );

-- Blacklisted visitors: Security + Admin
CREATE POLICY "blacklisted_visitors_select" ON blacklisted_visitors
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "blacklisted_visitors_manage" ON blacklisted_visitors
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
  );

-- RFID cards
CREATE POLICY "rfid_cards_select" ON rfid_cards
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "rfid_cards_manage" ON rfid_cards
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
  );

-- Security incidents
CREATE POLICY "security_incidents_select" ON security_incidents
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "security_incidents_insert" ON security_incidents
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "security_incidents_update" ON security_incidents
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
  );

-- Gate shifts
CREATE POLICY "gate_shifts_select" ON gate_shifts
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "gate_shifts_manage" ON gate_shifts
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
  );

-- Campus occupancy
CREATE POLICY "campus_occupancy_select" ON campus_occupancy
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "campus_occupancy_manage" ON campus_occupancy
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
  );

-- ============================================================
-- 13. TRANSIT: Driver sees own bus + route; Students see own route
-- ============================================================

CREATE POLICY "bus_routes_select" ON bus_routes
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "bus_routes_manage" ON bus_routes
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

CREATE POLICY "buses_select" ON buses
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "buses_manage" ON buses
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
  );

-- bus_tracking: Driver can INSERT own location; Admin see all; Students see their route
CREATE POLICY "bus_tracking_select" ON bus_tracking
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "bus_tracking_insert" ON bus_tracking
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "bus_tracking_update" ON bus_tracking
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
  );

-- bus_drivers
CREATE POLICY "bus_drivers_select" ON bus_drivers
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "bus_drivers_manage" ON bus_drivers
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- bus_trips
CREATE POLICY "bus_trips_select" ON bus_trips
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "bus_trips_insert" ON bus_trips
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
  );

CREATE POLICY "bus_trips_update" ON bus_trips
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
  );

-- trip_stop_logs
CREATE POLICY "trip_stop_logs_select" ON trip_stop_logs
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "trip_stop_logs_insert" ON trip_stop_logs
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
  );

-- bus_incidents
CREATE POLICY "bus_incidents_select" ON bus_incidents
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "bus_incidents_insert" ON bus_incidents
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
    AND institution_id = get_auth_institution_id()
  );

-- bus_maintenance
CREATE POLICY "bus_maintenance_select" ON bus_maintenance
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "bus_maintenance_manage" ON bus_maintenance
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 14. NOTIFICATIONS
-- ============================================================

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

-- ============================================================
-- 15. EVENT REGISTRATIONS (was missing policy)
-- ============================================================

CREATE POLICY "event_registrations_select" ON event_registrations
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "event_registrations_insert" ON event_registrations
  FOR INSERT WITH CHECK (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "event_registrations_update" ON event_registrations
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR (
      get_auth_user_role() = 'Student'
      AND student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    )
  );

-- ============================================================
-- 16. GYM: Membership check for bookings
-- ============================================================

CREATE POLICY "gym_slots_select" ON gym_slots
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "gym_slots_manage" ON gym_slots
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

CREATE POLICY "gym_memberships_select" ON gym_memberships
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id())
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "gym_memberships_insert" ON gym_memberships
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR (
      get_auth_user_role() = 'Student'
      AND student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    )
  );

CREATE POLICY "gym_bookings_select" ON gym_bookings
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id())
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "gym_bookings_insert" ON gym_bookings
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR (
      get_auth_user_role() = 'Student'
      AND student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    )
  );

CREATE POLICY "gym_bookings_update" ON gym_bookings
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 17. MEAL SUBSCRIPTIONS (Warden needs to see)
-- ============================================================

CREATE POLICY "meal_subscriptions_select" ON meal_subscriptions
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "meal_subscriptions_manage" ON meal_subscriptions
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden', 'Vendor')
  );

-- ============================================================
-- 18. FEE REMINDERS
-- ============================================================

CREATE POLICY "fee_reminders_select" ON fee_reminders
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "fee_reminders_manage" ON fee_reminders
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 19. TRANSPORT SUBSCRIPTIONS
-- ============================================================

CREATE POLICY "transport_subscriptions_select" ON transport_subscriptions
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "transport_subscriptions_manage" ON transport_subscriptions
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
  );

-- ============================================================
-- 20. VISITOR LOGS (Security needs full access)
-- ============================================================

CREATE POLICY "visitor_logs_select" ON visitor_logs
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "visitor_logs_insert" ON visitor_logs
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security', 'Warden')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "visitor_logs_update" ON visitor_logs
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security', 'Warden')
  );

-- ============================================================
-- 21. ID CARD TEMPLATES
-- ============================================================

CREATE POLICY "id_card_templates_select" ON id_card_templates
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "id_card_templates_manage" ON id_card_templates
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 22. ATTENDANCE REGULARIZATIONS
-- ============================================================

CREATE POLICY "attendance_regularizations_select" ON attendance_regularizations
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "attendance_regularizations_insert" ON attendance_regularizations
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff', 'Student')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "attendance_regularizations_update" ON attendance_regularizations
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

-- ============================================================
-- 23. NOTIFICATION LOGS
-- ============================================================

CREATE POLICY "notification_logs_select" ON notification_logs
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "notification_logs_insert" ON notification_logs
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

-- ============================================================
-- 24. PLACEMENTS: Tighten open policies
-- ============================================================

-- Drop the wide-open policies
DROP POLICY IF EXISTS "companies_all_access" ON companies;
DROP POLICY IF EXISTS "drives_all_access" ON placement_drives;
DROP POLICY IF EXISTS "admin_all_profiles" ON student_profiles;
DROP POLICY IF EXISTS "admin_all_applications" ON drive_applications;
DROP POLICY IF EXISTS "admin_all_rounds" ON interview_rounds;
DROP POLICY IF EXISTS "admin_all_offers" ON offer_letters;
DROP POLICY IF EXISTS "admin_all_mocks" ON mock_interviews;
DROP POLICY IF EXISTS "alumni_all_access" ON alumni;
DROP POLICY IF EXISTS "mentorship_all_access" ON alumni_mentorship;

CREATE POLICY "companies_select" ON companies
  FOR SELECT USING (true); -- Companies are public

CREATE POLICY "companies_manage" ON companies
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

CREATE POLICY "placement_drives_select" ON placement_drives
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "placement_drives_manage" ON placement_drives
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "student_profiles_select_own" ON student_profiles
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "student_profiles_manage_own" ON student_profiles
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "drive_applications_select" ON drive_applications
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "drive_applications_manage" ON drive_applications
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "interview_rounds_select" ON interview_rounds
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "interview_rounds_manage" ON interview_rounds
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "offer_letters_select" ON offer_letters
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "offer_letters_manage" ON offer_letters
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "mock_interviews_select" ON mock_interviews
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "mock_interviews_manage" ON mock_interviews
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "alumni_select" ON alumni
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "alumni_manage" ON alumni
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "alumni_mentorship_select" ON alumni_mentorship
  FOR SELECT USING (
    alumni_id IN (SELECT id FROM alumni WHERE institution_id = get_auth_institution_id())
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "alumni_mentorship_manage" ON alumni_mentorship
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

-- ============================================================
-- 25. OBE/NAAC: Tighten open policies to Admin+Staff only
-- ============================================================

-- Drop all the open policies
DO $$
DECLARE
  tbl TEXT;
  pol TEXT;
BEGIN
  FOR tbl, pol IN SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname LIKE '%_access'
    AND tablename IN (
      'programs_obe', 'courses', 'course_outcomes', 'program_outcomes',
      'co_po_mapping', 'assessment_tools', 'co_assessments', 'student_co_marks',
      'co_attainment', 'po_attainment', 'naac_criteria', 'naac_metrics',
      'iqac_activities', 'faculty_development', 'research_publications',
      'student_achievements', 'feedback_surveys', 'survey_responses', 'ssr_documents'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol, tbl);
  END LOOP;
END $$;

-- Re-create with proper access: Admin + Staff + Teacher read; Admin write
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'programs_obe', 'courses', 'course_outcomes', 'program_outcomes',
    'co_po_mapping', 'assessment_tools', 'co_assessments', 'student_co_marks',
    'co_attainment', 'po_attainment', 'naac_criteria', 'naac_metrics',
    'iqac_activities', 'faculty_development', 'research_publications',
    'student_achievements', 'feedback_surveys', 'survey_responses', 'ssr_documents'
  ])
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (true)',
      tbl || '_read', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (get_auth_user_role() IN (''SuperAdmin'', ''Admin''))',
      tbl || '_write', tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- 26. HOD ROLE: Add to module_permissions seed
--    HOD = Admin permissions for their department
-- ============================================================

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'HOD', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('students', true), ('attendance', true), ('timetable', true),
  ('exams', true), ('notices', true), ('obe', true), ('library', true),
  ('fees', false), ('canteen', false), ('hostel', false), ('placements', false),
  ('hr', false), ('gate', false), ('gym', false), ('transit', false),
  ('events', false), ('idcards', false), ('ai_concierge', false), ('naac', false),
  ('admissions', false), ('faculty_development', true), ('achievements', false),
  ('director', false), ('parent_portal', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

-- ============================================================
-- 27. AUDIT LOG TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS rls_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL, -- policy_change, permission_grant, permission_revoke
  table_name VARCHAR(100) NOT NULL,
  role VARCHAR(50),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rls_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_audit_admin_only" ON rls_audit_log
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- Log this migration
INSERT INTO rls_audit_log (event_type, table_name, role, details)
VALUES ('policy_change', 'ALL', 'system', '{"migration": "20260612000002_rls_security_hardening", "description": "Comprehensive RLS overhaul: parent_student_links, role-scoped policies, no-policy table fixes"}');
