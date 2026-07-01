-- ============================================================
-- MODULE 12: IRIS Placements
-- Company CRM, Drives management, Student profile builder, AI
-- interview checks, Offer tracking, and Alumni mentoring network.
-- ============================================================

-- 1. CREATE companies TABLE
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  company_type TEXT CHECK (company_type IN (
    'product','service','startup','mnc','psu','ngo'
  )),
  hr_name TEXT,
  hr_email TEXT,
  hr_phone TEXT,
  linkedin_url TEXT,
  address TEXT,
  tier TEXT CHECK (tier IN ('dream','core','mass')),
  last_visited DATE,
  total_offers_given INTEGER DEFAULT 0,
  relationship_status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE placement_drives TABLE
CREATE TABLE IF NOT EXISTS placement_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  job_description TEXT,
  jd_url TEXT,
  role TEXT NOT NULL,
  department TEXT,
  job_type TEXT CHECK (job_type IN (
    'full_time','internship','ppo','contract'
  )),
  location TEXT[],
  ctc_min DECIMAL,
  ctc_max DECIMAL,
  ctc_display TEXT,
  stipend DECIMAL,
  bond_years INTEGER DEFAULT 0,
  eligibility_criteria JSONB DEFAULT '{}'::jsonb,
  min_cgpa DECIMAL DEFAULT 0.0,
  eligible_branches TEXT[],
  eligible_batches TEXT[],
  backlogs_allowed INTEGER DEFAULT 0,
  application_deadline TIMESTAMPTZ,
  drive_date DATE,
  drive_mode TEXT CHECK (drive_mode IN ('online','offline','hybrid')),
  venue TEXT,
  meeting_link TEXT,
  rounds JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN (
    'upcoming','open','closed','processing','completed'
  )) DEFAULT 'upcoming',
  max_applications INTEGER,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE student_profiles TABLE
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  resume_url TEXT,
  resume_updated_at TIMESTAMPTZ,
  cgpa DECIMAL DEFAULT 0.0,
  active_backlogs INTEGER DEFAULT 0,
  total_backlogs INTEGER DEFAULT 0,
  skills TEXT[],
  certifications JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  internships JSONB DEFAULT '[]'::jsonb,
  achievements TEXT[],
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  is_placed BOOLEAN DEFAULT false,
  placed_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  placed_ctc DECIMAL,
  placed_role TEXT,
  placed_at TIMESTAMPTZ,
  placement_type TEXT,
  opted_out BOOLEAN DEFAULT false,
  opt_out_reason TEXT,
  ai_resume_score DECIMAL DEFAULT 0.0,
  ai_resume_feedback TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE drive_applications TABLE
CREATE TABLE IF NOT EXISTS drive_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ DEFAULT now(),
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT CHECK (status IN (
    'applied','shortlisted','test_scheduled','interview_scheduled',
    'selected','offered','offer_accepted','offer_rejected',
    'rejected','withdrawn'
  )) DEFAULT 'applied',
  current_round INTEGER DEFAULT 0,
  rejection_reason TEXT,
  feedback TEXT
);

-- 5. CREATE interview_rounds TABLE
CREATE TABLE IF NOT EXISTS interview_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES drive_applications(id) ON DELETE CASCADE,
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  round_number INTEGER,
  round_type TEXT CHECK (round_type IN (
    'aptitude','coding','technical','hr','gd','case_study','final'
  )),
  scheduled_at TIMESTAMPTZ,
  venue TEXT,
  meeting_link TEXT,
  interviewer_name TEXT,
  interviewer_email TEXT,
  duration_minutes INTEGER,
  result TEXT CHECK (result IN ('pass','fail','hold','no_show')),
  score DECIMAL,
  feedback TEXT,
  status TEXT DEFAULT 'scheduled'
);

-- 6. CREATE offer_letters TABLE
CREATE TABLE IF NOT EXISTS offer_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES drive_applications(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  offer_number TEXT UNIQUE,
  role TEXT,
  ctc DECIMAL,
  joining_date DATE,
  location TEXT,
  offer_letter_url TEXT,
  company_offer_url TEXT,
  status TEXT DEFAULT 'received',
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CREATE placement_stats TABLE
CREATE TABLE IF NOT EXISTS placement_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  batch TEXT,
  branch TEXT,
  total_eligible INTEGER DEFAULT 0,
  total_registered INTEGER DEFAULT 0,
  total_placed INTEGER DEFAULT 0,
  total_companies INTEGER DEFAULT 0,
  avg_ctc DECIMAL DEFAULT 0.0,
  median_ctc DECIMAL DEFAULT 0.0,
  highest_ctc DECIMAL DEFAULT 0.0,
  lowest_ctc DECIMAL DEFAULT 0.0,
  ppo_count INTEGER DEFAULT 0,
  dream_offers INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. CREATE mock_interviews TABLE
CREATE TABLE IF NOT EXISTS mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  interview_type TEXT,
  questions JSONB DEFAULT '[]'::jsonb,
  responses JSONB DEFAULT '[]'::jsonb,
  ai_feedback TEXT,
  score DECIMAL DEFAULT 0.0,
  duration_minutes INTEGER,
  conducted_at TIMESTAMPTZ DEFAULT now()
);

-- 9. CREATE alumni TABLE
CREATE TABLE IF NOT EXISTS alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  graduation_year INTEGER,
  current_company TEXT,
  "current_role" TEXT,
  current_ctc DECIMAL,
  location TEXT,
  linkedin_url TEXT,
  is_mentor BOOLEAN DEFAULT false,
  mentoring_slots INTEGER DEFAULT 0,
  achievements TEXT[],
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. CREATE alumni_mentorship TABLE
CREATE TABLE IF NOT EXISTS alumni_mentorship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID REFERENCES alumni(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  session_date TIMESTAMPTZ,
  duration_minutes INTEGER,
  topic TEXT,
  feedback TEXT,
  student_rating INTEGER,
  status TEXT DEFAULT 'scheduled'
);

-- 11. CREATE placement_notifications TABLE
CREATE TABLE IF NOT EXISTS placement_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  type TEXT,
  message TEXT,
  sent_via TEXT[],
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_companies_inst ON companies(institution_id);
CREATE INDEX IF NOT EXISTS idx_drives_company ON placement_drives(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_drive ON drive_applications(drive_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON drive_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_rounds_application ON interview_rounds(application_id);
CREATE INDEX IF NOT EXISTS idx_offers_student ON offer_letters(student_id);
CREATE INDEX IF NOT EXISTS idx_alumni_student ON alumni(student_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_mentorship ENABLE ROW LEVEL SECURITY;

-- 1. COMPANIES POLICY
CREATE POLICY "companies_all_access" ON companies FOR ALL USING (true);

-- 2. PLACEMENT DRIVES POLICY
CREATE POLICY "drives_all_access" ON placement_drives FOR ALL USING (true);

-- 3. STUDENT PROFILES POLICY
CREATE POLICY "student_own_profile" ON student_profiles
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_profiles" ON student_profiles FOR ALL USING (true);

-- 4. APPLICATIONS POLICY
CREATE POLICY "student_own_applications" ON drive_applications
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_applications" ON drive_applications FOR ALL USING (true);

-- 5. INTERVIEW ROUDS POLICY
CREATE POLICY "student_own_rounds" ON interview_rounds
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_rounds" ON interview_rounds FOR ALL USING (true);

-- 6. OFFER LETTERS POLICY
CREATE POLICY "student_own_offers" ON offer_letters
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_offers" ON offer_letters FOR ALL USING (true);

-- 7. MOCK INTERVIEWS POLICY
CREATE POLICY "student_own_mocks" ON mock_interviews
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_mocks" ON mock_interviews FOR ALL USING (true);

-- 8. ALUMNI POLICY
CREATE POLICY "alumni_all_access" ON alumni FOR ALL USING (true);

-- 9. MENTORSHIP POLICY
CREATE POLICY "mentorship_all_access" ON alumni_mentorship FOR ALL USING (true);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO companies (id, institution_id, name, logo_url, website, industry, company_type, hr_name, hr_email, hr_phone, tier, relationship_status) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Google India', 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=120', 'https://google.com', 'Technology', 'mnc', 'Neha Sen', 'neha.sen@google.com', '+91 99881 23456', 'dream', 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Infosys', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120', 'https://infosys.com', 'IT Services', 'service', 'Rajesh K.', 'rajesh.k@infosys.com', '+91 94140 12891', 'mass', 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'ZS Associates', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=120', 'https://zs.com', 'Consulting', 'product', 'Preeti Sharma', 'preeti.sharma@zs.com', '+91 99290 12347', 'core', 'active')
  ON CONFLICT DO NOTHING;

INSERT INTO placement_drives (id, institution_id, company_id, title, role, job_type, location, ctc_min, ctc_max, ctc_display, min_cgpa, eligible_branches, eligible_batches, status, application_deadline, drive_date) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Google SWE Summer Drive 2026', 'Software Engineer (L3)', 'full_time', ARRAY['Bangalore', 'Hyderabad'], 32.0, 42.0, '32 - 42 LPA', 8.0, ARRAY['CSE', 'AIDS'], ARRAY['2026'], 'open', CURRENT_TIMESTAMP + INTERVAL '10 days', CURRENT_DATE + INTERVAL '15 days'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'ZS Consulting Campus Hiring', 'Business Technology Analyst', 'full_time', ARRAY['Pune', 'Gurgaon'], 8.5, 12.0, '8.5 - 12 LPA', 7.0, ARRAY['CSE', 'AIDS', 'ECE'], ARRAY['2026'], 'open', CURRENT_TIMESTAMP + INTERVAL '5 days', CURRENT_DATE + INTERVAL '8 days')
  ON CONFLICT DO NOTHING;
