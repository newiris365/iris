-- ============================================================
-- MODULE 11: IRIS Admissions
-- Branded Admission Cycles, Multi-Step Applications, Academic
-- Audits, Auto-Merit calculations, Offer letters, and CRM Leads.
-- ============================================================

-- 1. CREATE admission_cycles TABLE
CREATE TABLE IF NOT EXISTS admission_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN (
    'upcoming','open','closed','processing','completed'
  )) DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE programs TABLE
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  degree_type TEXT,
  duration_years INTEGER,
  total_seats INTEGER,
  reserved_seats JSONB DEFAULT '{}'::jsonb,
  eligibility_criteria JSONB DEFAULT '{}'::jsonb,
  application_fee DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 3. CREATE applicants TABLE
CREATE TABLE IF NOT EXISTS applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES admission_cycles(id) ON DELETE SET NULL,
  application_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  dob DATE,
  gender TEXT,
  category TEXT,
  domicile_state TEXT,
  photo_url TEXT,
  aadhar_number TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_relation TEXT,
  status TEXT CHECK (status IN (
    'draft','submitted','under_review','shortlisted',
    'merit_listed','waitlisted','offered','admitted',
    'rejected','withdrawn'
  )) DEFAULT 'draft',
  merit_score DECIMAL DEFAULT 0.0,
  ai_score DECIMAL DEFAULT 0.0,
  rank_overall INTEGER,
  rank_category INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE applicant_programs TABLE
CREATE TABLE IF NOT EXISTS applicant_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  preference_order INTEGER,
  status TEXT DEFAULT 'pending',
  allocated BOOLEAN DEFAULT false
);

-- 5. CREATE academic_records TABLE
CREATE TABLE IF NOT EXISTS academic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  level TEXT NOT NULL, -- '10th', '12th', 'graduation'
  board_university TEXT,
  year_of_passing INTEGER,
  percentage DECIMAL,
  cgpa DECIMAL,
  subjects JSONB DEFAULT '[]'::jsonb,
  marksheet_url TEXT,
  certificate_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_notes TEXT
);

-- 6. CREATE entrance_scores TABLE
CREATE TABLE IF NOT EXISTS entrance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  exam_name TEXT NOT NULL,
  roll_number TEXT,
  score DECIMAL,
  percentile DECIMAL,
  rank INTEGER,
  scorecard_url TEXT,
  is_verified BOOLEAN DEFAULT false
);

-- 7. CREATE documents TABLE
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  doc_url TEXT NOT NULL,
  file_name TEXT,
  file_size_kb INTEGER,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 8. CREATE merit_lists TABLE
CREATE TABLE IF NOT EXISTS merit_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES admission_cycles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  round_number INTEGER DEFAULT 1,
  list_type TEXT CHECK (list_type IN ('merit','waitlist','spot')),
  published_at TIMESTAMPTZ,
  cutoff_score DECIMAL,
  is_published BOOLEAN DEFAULT false
);

-- 9. CREATE merit_list_entries TABLE
CREATE TABLE IF NOT EXISTS merit_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merit_list_id UUID REFERENCES merit_lists(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  rank INTEGER,
  category TEXT,
  merit_score DECIMAL,
  status TEXT DEFAULT 'listed', -- 'listed', 'offered', 'accepted', 'declined', 'expired'
  offer_sent_at TIMESTAMPTZ,
  offer_accepted_at TIMESTAMPTZ,
  offer_expires_at TIMESTAMPTZ
);

-- 10. CREATE admission_offers TABLE
CREATE TABLE IF NOT EXISTS admission_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  merit_list_id UUID REFERENCES merit_lists(id) ON DELETE SET NULL,
  offer_letter_url TEXT,
  offered_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'sent', -- 'sent', 'accepted', 'rejected', 'expired'
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- 11. CREATE admission_fees TABLE
CREATE TABLE IF NOT EXISTS admission_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  fee_type TEXT CHECK (fee_type IN ('application','confirmation','enrollment')),
  amount DECIMAL NOT NULL,
  razorpay_order_id TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  paid_at TIMESTAMPTZ,
  receipt_url TEXT
);

-- 12. CREATE counseling_sessions TABLE
CREATE TABLE IF NOT EXISTS counseling_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES admission_cycles(id) ON DELETE CASCADE,
  round_number INTEGER,
  scheduled_date DATE,
  mode TEXT CHECK (mode IN ('online','offline','hybrid')),
  venue TEXT,
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled' -- 'scheduled', 'completed', 'cancelled'
);

-- 13. CREATE counseling_slots TABLE
CREATE TABLE IF NOT EXISTS counseling_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES counseling_sessions(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  slot_time TIMESTAMPTZ,
  officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'assigned', -- 'assigned', 'attended', 'no_show', 'rescheduled'
  attended BOOLEAN DEFAULT false,
  notes TEXT
);

-- 14. CREATE waitlist_movements TABLE
CREATE TABLE IF NOT EXISTS waitlist_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  from_position INTEGER,
  to_position INTEGER,
  reason TEXT,
  moved_at TIMESTAMPTZ DEFAULT now()
);

-- 15. CREATE admission_analytics TABLE
CREATE TABLE IF NOT EXISTS admission_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES admission_cycles(id) ON DELETE CASCADE,
  date DATE,
  applications_received INTEGER DEFAULT 0,
  applications_submitted INTEGER DEFAULT 0,
  documents_pending INTEGER DEFAULT 0,
  merit_listed INTEGER DEFAULT 0,
  offers_sent INTEGER DEFAULT 0,
  offers_accepted INTEGER DEFAULT 0,
  seats_filled INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. CREATE crm_leads TABLE
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT, -- 'website', 'social', 'event', 'walkin', 'referral'
  program_interest TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'interested', 'applied', 'admitted', 'lost'
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  last_contacted TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_adm_cycles_inst ON admission_cycles(institution_id);
CREATE INDEX IF NOT EXISTS idx_adm_programs_inst ON programs(institution_id);
CREATE INDEX IF NOT EXISTS idx_applicants_inst ON applicants(institution_id);
CREATE INDEX IF NOT EXISTS idx_applicants_cycle ON applicants(cycle_id);
CREATE INDEX IF NOT EXISTS idx_applicants_status ON applicants(status);
CREATE INDEX IF NOT EXISTS idx_applicants_email ON applicants(email);
CREATE INDEX IF NOT EXISTS idx_crm_leads_inst ON crm_leads(institution_id);
CREATE INDEX IF NOT EXISTS idx_documents_applicant ON documents(applicant_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE merit_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- 1. APPLICANTS POLICIES
CREATE POLICY "applicant_own_data" ON applicants
  FOR SELECT USING (
    email = (SELECT email FROM users WHERE id = auth.uid())
  );

CREATE POLICY "admin_institution_applicants" ON applicants
  FOR ALL USING (
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
  );

-- 2. DOCUMENTS POLICIES
CREATE POLICY "applicant_own_documents" ON documents
  FOR ALL USING (
    applicant_id IN (SELECT id FROM applicants WHERE email = (SELECT email FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "admin_institution_documents" ON documents
  FOR ALL USING (
    applicant_id IN (SELECT id FROM applicants WHERE institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()))
  );

-- 3. ADMISSION OFFERS POLICIES
CREATE POLICY "applicant_own_offers" ON admission_offers
  FOR SELECT USING (
    applicant_id IN (SELECT id FROM applicants WHERE email = (SELECT email FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "admin_institution_offers" ON admission_offers
  FOR ALL USING (
    applicant_id IN (SELECT id FROM applicants WHERE institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()))
  );

-- 4. ADMISSION CYCLES POLICIES
CREATE POLICY "tenant_isolation_admission_cycles" ON admission_cycles
  FOR ALL USING (
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
  );

-- 5. PROGRAMS POLICIES
CREATE POLICY "tenant_isolation_programs" ON programs
  FOR ALL USING (
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
  );

-- ============================================================
-- SEED DATA - ADMISSION CYCLES & PROGRAMS FOR DEMO
-- ============================================================
INSERT INTO admission_cycles (id, institution_id, name, academic_year, start_date, end_date, status) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'Fall Admissions 2026', '2026-27', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '60 days', 'open')
  ON CONFLICT DO NOTHING;

INSERT INTO programs (id, institution_id, name, code, degree_type, duration_years, total_seats, reserved_seats, eligibility_criteria, application_fee) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'Bachelor of Technology in Computer Science (B.Tech CSE)', 'BTECH-CSE', 'UG', 4, 120, '{"general": 60, "obc": 32, "sc": 18, "st": 10}', '{"min_12th_pc": 60.0, "required_subjects": ["Physics", "Mathematics"]}', 1000.00),
  ('a1111111-1111-1111-1111-111111111112', 'a0000000-0000-0000-0000-000000000001', 'Bachelor of Technology in Artificial Intelligence (B.Tech AI-DS)', 'BTECH-AIDS', 'UG', 4, 60, '{"general": 30, "obc": 16, "sc": 9, "st": 5}', '{"min_12th_pc": 65.0, "required_subjects": ["Physics", "Mathematics"]}', 1200.00),
  ('a1111111-1111-1111-1111-111111111113', 'a0000000-0000-0000-0000-000000000001', 'Master of Business Administration (MBA)', 'MBA-CORE', 'PG', 2, 60, '{"general": 30, "obc": 16, "sc": 9, "st": 5}', '{"min_grad_cgpa": 6.0}', 1500.00)
  ON CONFLICT DO NOTHING;
