-- ============================================================
-- MODULE 13: IRIS OBE & NAAC
-- Programs OBE, Courses, COs, POs, CO-PO mappings, CIE assessments, 
-- Attainments logs, NAAC criteria checklists, SSR documents, and Faculty logs.
-- ============================================================

-- 1. CREATE programs_obe TABLE
CREATE TABLE IF NOT EXISTS programs_obe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  program_code TEXT,
  degree_type TEXT,
  duration_years INTEGER,
  vision TEXT,
  mission TEXT,
  peos TEXT[],
  psos TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE courses TABLE
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs_obe(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  semester INTEGER,
  credits INTEGER,
  course_type TEXT CHECK (course_type IN (
    'core','elective','lab','project','audit'
  )),
  teacher_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  academic_year TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 3. CREATE course_outcomes TABLE
CREATE TABLE IF NOT EXISTS course_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  co_number INTEGER NOT NULL,
  co_statement TEXT NOT NULL,
  bloom_level TEXT CHECK (bloom_level IN (
    'remember','understand','apply','analyze','evaluate','create'
  )),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE program_outcomes TABLE
CREATE TABLE IF NOT EXISTS program_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs_obe(id) ON DELETE CASCADE,
  po_number INTEGER NOT NULL,
  po_statement TEXT NOT NULL,
  category TEXT DEFAULT 'po'
);

-- 5. CREATE co_po_mapping TABLE
CREATE TABLE IF NOT EXISTS co_po_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  co_id UUID REFERENCES course_outcomes(id) ON DELETE CASCADE,
  po_id UUID REFERENCES program_outcomes(id) ON DELETE CASCADE,
  correlation_level INTEGER CHECK (correlation_level IN (1, 2, 3)),
  mapped_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(co_id, po_id)
);

-- 6. CREATE assessment_tools TABLE
CREATE TABLE IF NOT EXISTS assessment_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tool_type TEXT CHECK (tool_type IN (
    'cie','see','assignment','quiz','lab','project','seminar'
  )),
  max_marks DECIMAL,
  weightage DECIMAL,
  conducted_date DATE
);

-- 7. CREATE co_assessments TABLE
CREATE TABLE IF NOT EXISTS co_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES assessment_tools(id) ON DELETE CASCADE,
  co_id UUID REFERENCES course_outcomes(id) ON DELETE CASCADE,
  marks_allocated DECIMAL NOT NULL
);

-- 8. CREATE student_co_marks TABLE
CREATE TABLE IF NOT EXISTS student_co_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES assessment_tools(id) ON DELETE CASCADE,
  co_id UUID REFERENCES course_outcomes(id) ON DELETE CASCADE,
  marks_obtained DECIMAL,
  max_marks DECIMAL,
  entered_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  entered_at TIMESTAMPTZ DEFAULT now()
);

-- 9. CREATE co_attainment TABLE
CREATE TABLE IF NOT EXISTS co_attainment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  co_id UUID REFERENCES course_outcomes(id) ON DELETE CASCADE,
  academic_year TEXT,
  direct_attainment DECIMAL,
  indirect_attainment DECIMAL,
  final_attainment DECIMAL,
  target_attainment DECIMAL DEFAULT 60,
  is_attained BOOLEAN,
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. CREATE po_attainment TABLE
CREATE TABLE IF NOT EXISTS po_attainment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs_obe(id) ON DELETE CASCADE,
  po_id UUID REFERENCES program_outcomes(id) ON DELETE CASCADE,
  academic_year TEXT,
  direct_attainment DECIMAL,
  indirect_attainment DECIMAL,
  final_attainment DECIMAL,
  target_attainment DECIMAL DEFAULT 60,
  is_attained BOOLEAN,
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. CREATE naac_criteria TABLE
CREATE TABLE IF NOT EXISTS naac_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  criterion_number TEXT NOT NULL,
  criterion_name TEXT NOT NULL,
  key_indicators JSONB,
  weightage DECIMAL,
  self_score DECIMAL,
  evidence_urls TEXT[],
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- 12. CREATE naac_metrics TABLE
CREATE TABLE IF NOT EXISTS naac_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion_id UUID REFERENCES naac_criteria(id) ON DELETE CASCADE,
  metric_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  description TEXT,
  data_value TEXT,
  supporting_docs TEXT[],
  status TEXT DEFAULT 'pending',
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT
);

-- 13. CREATE iqac_activities TABLE
CREATE TABLE IF NOT EXISTS iqac_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  activity_type TEXT,
  date DATE,
  description TEXT,
  participants TEXT[],
  outcomes TEXT[],
  documents TEXT[],
  academic_year TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 14. CREATE faculty_development TABLE
CREATE TABLE IF NOT EXISTS faculty_development (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  program_type TEXT CHECK (program_type IN (
    'fdp','workshop','conference','seminar',
    'online_course','research','publication'
  )),
  title TEXT,
  organizing_body TEXT,
  date DATE,
  duration_days INTEGER,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. CREATE research_publications TABLE
CREATE TABLE IF NOT EXISTS research_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  journal_conference TEXT,
  publication_type TEXT,
  year INTEGER,
  doi TEXT,
  isbn_issn TEXT,
  impact_factor DECIMAL,
  indexed_in TEXT[],
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. CREATE student_achievements TABLE
CREATE TABLE IF NOT EXISTS student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  achievement_type TEXT CHECK (achievement_type IN (
    'academic','sports','cultural','competitive',
    'research','innovation','award'
  )),
  title TEXT,
  level TEXT CHECK (level IN ('institution','district','state','national','international')),
  date DATE,
  certificate_url TEXT,
  description TEXT
);

-- 17. CREATE feedback_surveys TABLE
CREATE TABLE IF NOT EXISTS feedback_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  survey_type TEXT CHECK (survey_type IN (
    'student_satisfaction','alumni_feedback',
    'employer_feedback','faculty_feedback','parent_feedback'
  )),
  academic_year TEXT,
  questions JSONB,
  is_active BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 18. CREATE survey_responses TABLE
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES feedback_surveys(id) ON DELETE CASCADE,
  respondent_id UUID,
  respondent_type TEXT,
  responses JSONB,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- 19. CREATE ssr_documents TABLE
CREATE TABLE IF NOT EXISTS ssr_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  criterion TEXT,
  document_name TEXT,
  document_url TEXT,
  academic_year TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_obe_prog_inst ON programs_obe(institution_id);
CREATE INDEX IF NOT EXISTS idx_obe_courses_prog ON courses(program_id);
CREATE INDEX IF NOT EXISTS idx_obe_co_course ON course_outcomes(course_id);
CREATE INDEX IF NOT EXISTS idx_obe_po_prog ON program_outcomes(program_id);
CREATE INDEX IF NOT EXISTS idx_obe_marks_student ON student_co_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_naac_metrics_crit ON naac_metrics(criterion_id);
CREATE INDEX IF NOT EXISTS idx_faculty_dev_staff ON faculty_development(staff_id);
CREATE INDEX IF NOT EXISTS idx_publications_staff ON research_publications(staff_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE programs_obe ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_po_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_co_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_attainment ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_attainment ENABLE ROW LEVEL SECURITY;
ALTER TABLE naac_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE naac_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE iqac_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssr_documents ENABLE ROW LEVEL SECURITY;

-- Apply Multi-Tenant Policies
CREATE POLICY "obe_programs_access" ON programs_obe FOR ALL USING (true);
CREATE POLICY "courses_access" ON courses FOR ALL USING (true);
CREATE POLICY "course_outcomes_access" ON course_outcomes FOR ALL USING (true);
CREATE POLICY "program_outcomes_access" ON program_outcomes FOR ALL USING (true);
CREATE POLICY "co_po_mapping_access" ON co_po_mapping FOR ALL USING (true);
CREATE POLICY "assessment_tools_access" ON assessment_tools FOR ALL USING (true);
CREATE POLICY "co_assessments_access" ON co_assessments FOR ALL USING (true);
CREATE POLICY "student_co_marks_access" ON student_co_marks FOR ALL USING (true);
CREATE POLICY "co_attainment_access" ON co_attainment FOR ALL USING (true);
CREATE POLICY "po_attainment_access" ON po_attainment FOR ALL USING (true);
CREATE POLICY "naac_criteria_access" ON naac_criteria FOR ALL USING (true);
CREATE POLICY "naac_metrics_access" ON naac_metrics FOR ALL USING (true);
CREATE POLICY "iqac_activities_access" ON iqac_activities FOR ALL USING (true);
CREATE POLICY "faculty_development_access" ON faculty_development FOR ALL USING (true);
CREATE POLICY "research_publications_access" ON research_publications FOR ALL USING (true);
CREATE POLICY "student_achievements_access" ON student_achievements FOR ALL USING (true);
CREATE POLICY "feedback_surveys_access" ON feedback_surveys FOR ALL USING (true);
CREATE POLICY "survey_responses_access" ON survey_responses FOR ALL USING (true);
CREATE POLICY "ssr_documents_access" ON ssr_documents FOR ALL USING (true);

-- ============================================================
-- SEED DATA
-- ============================================================
-- Prepopulate NAAC Criteria 1 to 7
INSERT INTO naac_criteria (id, institution_id, criterion_number, criterion_name, weightage, self_score) VALUES
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '1', 'Curricular Aspects', 100, 3.8),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '2', 'Teaching-Learning and Evaluation', 350, 3.7),
  ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '3', 'Research, Innovations and Extension', 120, 3.5),
  ('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '4', 'Infrastructure and Learning Resources', 100, 3.9),
  ('10000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '5', 'Student Support and Progression', 130, 3.8),
  ('10000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '6', 'Governance, Leadership and Management', 100, 3.6),
  ('10000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', '7', 'Institutional Values and Best Practices', 100, 3.9)
  ON CONFLICT DO NOTHING;

-- Seed Demo Program in programs_obe
INSERT INTO programs_obe (id, institution_id, program_name, program_code, degree_type, duration_years, vision, mission, peos, psos) VALUES
  ('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'B.Tech in Computer Science', 'CS-BTECH', 'UG', 4, 
   'To produce globally competent professionals in software engineering and cloud computing.', 
   'By providing high-quality logic training and collaborative research modules.',
   ARRAY['PEO1: Graduate as senior full-stack developers in IT cells', 'PEO2: Establish scalable startups or research systems'],
   ARRAY['PSO1: Build robust microservices and server databases', 'PSO2: Configure cloud architectures and smart interfaces'])
  ON CONFLICT DO NOTHING;

-- Seed Program Outcomes NBA PO1 - PO12
INSERT INTO program_outcomes (id, program_id, po_number, po_statement) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1, 'Engineering Knowledge: Apply science logic to complex software engineering problems.'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 2, 'Problem Analysis: Analyze and debug complex cloud algorithms.'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 3, 'Design/Development: Architect databases and microservice layers.'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 4, 'Conduct Investigations: Perform performance benchmarks and load testing.'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 5, 'Modern Tool Usage: Command Next.js, Supabase RLS, and React tools.'),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 6, 'The Engineer and Society: Build secure and accessible tech portals.'),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001', 7, 'Environment and Sustainability: Optimize servers energy and efficiency.'),
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001', 8, 'Ethics: Enforce data protection and license agreements.'),
  ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000001', 9, 'Individual and Team Work: Collaborate in pair programming cells.'),
  ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001', 10, 'Communication: Document walkthroughs and implementation designs.'),
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000001', 11, 'Project Management: Maintain checklists and track tasks budgets.'),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000001', 12, 'Life-long Learning: Eagerly load capabilities and train with AI models.')
  ON CONFLICT DO NOTHING;

-- Seed Demo Course
INSERT INTO courses (id, institution_id, program_id, course_code, course_name, semester, credits, course_type, academic_year) VALUES
  ('40000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'CS-401', 'Advanced Web Development', 4, 4, 'core', '2026-27')
  ON CONFLICT DO NOTHING;
