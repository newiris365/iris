-- ============================================================
-- MODULE 4: IRIS Events — Complete Schema Extensions & New Tables
-- ============================================================

-- 1. ALTER events TABLE
ALTER TABLE events ADD COLUMN IF NOT EXISTS ai_plan JSONB DEFAULT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_hybrid BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS virtual_link TEXT DEFAULT NULL;

-- 2. ALTER event_registrations TABLE
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS registration_type VARCHAR(30) DEFAULT 'in_person';
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS transaction_id TEXT DEFAULT NULL;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- 3. ALTER event_volunteers TABLE
ALTER TABLE event_volunteers ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]';
ALTER TABLE event_volunteers ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE event_volunteers ADD COLUMN IF NOT EXISTS hours_worked DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE event_volunteers ADD COLUMN IF NOT EXISTS certificate_url TEXT DEFAULT NULL;

-- 4. CREATE volunteer_applications TABLE
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  preferred_role VARCHAR(100) NOT NULL,
  motivation TEXT,
  status VARCHAR(30) DEFAULT 'pending', -- pending, approved, rejected
  applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. ALTER event_sponsors TABLE
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) DEFAULT NULL;
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS website_url TEXT DEFAULT NULL;
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'pending';
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR(50) DEFAULT 'prospect'; -- prospect, contacted, negotiating, confirmed, paid
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS communication_log JSONB DEFAULT '[]';
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]';
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- 6. ALTER event_budget TABLE
ALTER TABLE event_budget ADD COLUMN IF NOT EXISTS item VARCHAR(255) DEFAULT NULL;
ALTER TABLE event_budget ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'expense'; -- income, expense
ALTER TABLE event_budget DROP CONSTRAINT IF EXISTS budget_type_check;
ALTER TABLE event_budget ADD CONSTRAINT budget_type_check CHECK (type IN ('income', 'expense'));

-- 7. ALTER event_photos TABLE
ALTER TABLE event_photos ADD COLUMN IF NOT EXISTS tagged_students UUID[] DEFAULT '{}';
ALTER TABLE event_photos ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- 8. ALTER event_feedback TABLE
ALTER TABLE event_feedback ADD COLUMN IF NOT EXISTS organization_rating INTEGER DEFAULT 5;
ALTER TABLE event_feedback ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 9. CREATE live_polls TABLE
CREATE TABLE IF NOT EXISTS live_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of string options e.g. ["Option A", "Option B"]
  is_active BOOLEAN DEFAULT false,
  show_results BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. CREATE poll_responses TABLE
CREATE TABLE IF NOT EXISTS poll_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES live_polls(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  selected_option INTEGER NOT NULL, -- 0-based index
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_poll_student UNIQUE (poll_id, student_id)
);

-- 11. CREATE live_questions TABLE
CREATE TABLE IF NOT EXISTS live_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_answered BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. CREATE event_certificates TABLE
CREATE TABLE IF NOT EXISTS event_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  certificate_type VARCHAR(50) NOT NULL, -- participation, winner, volunteer, speaker
  rank INTEGER DEFAULT NULL,              -- 1, 2, 3 for winners
  url TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  verification_code VARCHAR(100) UNIQUE NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_event ON volunteer_applications(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_student ON volunteer_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_live_polls_event ON live_polls(event_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_poll ON poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_live_questions_event ON live_questions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_certificates_event ON event_certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_event_certificates_student ON event_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_event_certificates_code ON event_certificates(verification_code);

-- ============================================================
-- ROW LEVEL SECURITY AND POLICIES
-- ============================================================
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS tenant_isolation_volunteer_applications ON volunteer_applications;
CREATE POLICY tenant_isolation_volunteer_applications ON volunteer_applications
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_live_polls ON live_polls;
CREATE POLICY tenant_isolation_live_polls ON live_polls
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_poll_responses ON poll_responses;
CREATE POLICY tenant_isolation_poll_responses ON poll_responses
  USING (
    EXISTS (
      SELECT 1 FROM live_polls
      WHERE live_polls.id = poll_responses.poll_id
      AND live_polls.institution_id = get_auth_institution_id()
    )
  );

DROP POLICY IF EXISTS tenant_isolation_live_questions ON live_questions;
CREATE POLICY tenant_isolation_live_questions ON live_questions
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_event_certificates ON event_certificates;
CREATE POLICY tenant_isolation_event_certificates ON event_certificates
  USING (institution_id = get_auth_institution_id());
