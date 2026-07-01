-- IRIS 365 Security Hardening Migration
-- Targets: Supabase (PostgreSQL) Row-Level Security (RLS) policies hardening

-- ============================================
-- 1. CLEANUP PREVIOUS BROAD POLICIES
-- ============================================
DROP POLICY IF EXISTS tenant_hostel_allocations_policy ON hostel_allocations;
DROP POLICY IF EXISTS tenant_gate_logs_policy ON gate_logs;

-- ============================================
-- 2. HARDENED HOSTEL ALLOCATIONS POLICY
-- ============================================
CREATE POLICY hostel_allocations_security_policy ON hostel_allocations
    FOR ALL TO authenticated
    USING (
        -- Admins and SuperAdmins have full access
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        OR (
            -- Wardens can only view/manage allocations in rooms belonging to their block
            get_auth_user_role() = 'Warden'
            AND EXISTS (
                SELECT 1 FROM hostel_rooms hr
                JOIN hostel_blocks hb ON hr.block_id = hb.id
                WHERE hr.id = hostel_allocations.room_id
                  AND hb.warden_id = (auth.jwt() ->> 'sub')::UUID
            )
        )
        OR (
            -- Students can view only their own allocations
            get_auth_user_role() = 'Student'
            AND student_id = (
                SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID
            )
        )
    );

-- ============================================
-- 3. HARDENED HOSTEL COMPLAINTS POLICY
-- ============================================
DROP POLICY IF EXISTS tenant_hostel_complaints_policy ON hostel_complaints;

CREATE POLICY hostel_complaints_security_policy ON hostel_complaints
    FOR ALL TO authenticated
    USING (
        -- Admins and SuperAdmins have full access
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        OR (
            -- Wardens can view and manage complaints assigned to them or in their block
            get_auth_user_role() = 'Warden'
            AND (
                assigned_to = (auth.jwt() ->> 'sub')::UUID
                OR EXISTS (
                    SELECT 1 FROM hostel_rooms hr
                    JOIN hostel_blocks hb ON hr.block_id = hb.id
                    WHERE hr.id = hostel_complaints.room_id
                      AND hb.warden_id = (auth.jwt() ->> 'sub')::UUID
                )
            )
        )
        OR (
            -- Students can view/create complaints for their own student id
            get_auth_user_role() = 'Student'
            AND student_id = (
                SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID
            )
        )
    );

-- ============================================
-- 4. HARDENED GATE LOGS POLICY
-- ============================================
CREATE POLICY gate_logs_security_policy ON gate_logs
    FOR ALL TO authenticated
    USING (
        -- Admins and SuperAdmins have full access
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        OR (
            -- Security guards can manage and create logs for anyone in the institution
            get_auth_user_role() = 'Security'
            AND institution_id = get_auth_institution_id()
        )
        OR (
            -- Students/Staff can only select/view their own gate logs
            get_auth_user_role() IN ('Student', 'Staff')
            AND person_id = (auth.jwt() ->> 'sub')::UUID
        )
    );
