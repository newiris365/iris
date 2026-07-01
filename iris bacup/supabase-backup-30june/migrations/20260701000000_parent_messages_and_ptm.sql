-- Migration: Parent messaging and PTM slots/bookings tables
-- Target: Supabase / PostgreSQL

-- 1. Create parent_messages table
CREATE TABLE IF NOT EXISTS parent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    sender_role VARCHAR(50) NOT NULL,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sla_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on parent_messages
ALTER TABLE parent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select parent messages they are involved in" ON parent_messages
    FOR SELECT USING (
        (sender_id = auth.uid() OR receiver_id = auth.uid())
        AND (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
    );

CREATE POLICY "Users can insert parent messages" ON parent_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
    );

CREATE INDEX IF NOT EXISTS idx_parent_messages_sender ON parent_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_receiver ON parent_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_institution ON parent_messages(institution_id);


-- 2. Create ptm_slots table
CREATE TABLE IF NOT EXISTS ptm_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot_time VARCHAR(100) NOT NULL,
    available BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_ptm_slot_teacher UNIQUE (teacher_id, date, slot_time)
);

-- Enable RLS on ptm_slots
ALTER TABLE ptm_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone authenticated can view ptm slots" ON ptm_slots
    FOR SELECT USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

CREATE POLICY "Teachers and admins can manage ptm slots" ON ptm_slots
    FOR ALL USING (
        (get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'HOD', 'Principal'))
        AND (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
    );

CREATE INDEX IF NOT EXISTS idx_ptm_slots_teacher ON ptm_slots(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ptm_slots_date ON ptm_slots(date);


-- 3. Create ptm_bookings table
CREATE TABLE IF NOT EXISTS ptm_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot_time VARCHAR(100) NOT NULL,
    meet_link TEXT,
    status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_ptm_booking_slot UNIQUE (teacher_id, date, slot_time)
);

-- Enable RLS on ptm_bookings
ALTER TABLE ptm_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ptm bookings" ON ptm_bookings
    FOR SELECT USING (
        (parent_id = auth.uid() OR teacher_id = auth.uid())
        AND (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
    );

CREATE POLICY "Parents can insert ptm bookings" ON ptm_bookings
    FOR INSERT WITH CHECK (
        parent_id = auth.uid()
        AND get_auth_user_role() = 'Parent'
        AND (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
    );

CREATE POLICY "Involved users can update ptm bookings" ON ptm_bookings
    FOR UPDATE USING (
        (parent_id = auth.uid() OR teacher_id = auth.uid() OR get_auth_user_role() IN ('SuperAdmin', 'Admin'))
        AND (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
    );

CREATE INDEX IF NOT EXISTS idx_ptm_bookings_parent ON ptm_bookings(parent_id);
CREATE INDEX IF NOT EXISTS idx_ptm_bookings_teacher ON ptm_bookings(teacher_id);
