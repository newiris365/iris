-- =========================================================================
-- SPRINT 4 DATABASE SCHEMA & SECURITY POLICIES
-- =========================================================================

-- 1. STUDENT DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
    '10th_marksheet', '12th_marksheet', 'degree', 'id_proof', 'address_proof', 'other'
  )),
  file_url TEXT NOT NULL,
  file_size_kb INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Staff can manage student documents"
  ON student_documents FOR ALL
  USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director', 'Staff', 'Teacher', 'HOD')
    AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
  );

CREATE POLICY "Students can view their own documents"
  ON student_documents FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_student_documents_student ON student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_institution ON student_documents(institution_id);

-- 2. TIMETABLE HISTORY TABLE
CREATE TABLE IF NOT EXISTS timetable_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  batch_year VARCHAR(10) NOT NULL,
  version INTEGER NOT NULL,
  timetable_data JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT unique_timetable_version UNIQUE (department_id, semester, batch_year, version)
);

ALTER TABLE timetable_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage timetable history"
  ON timetable_history FOR ALL
  USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
  );

CREATE POLICY "Everyone can view timetable history"
  ON timetable_history FOR SELECT
  USING (
    institution_id = get_auth_institution_id()
  );

CREATE INDEX IF NOT EXISTS idx_timetable_history_lookup ON timetable_history(department_id, semester, batch_year);

-- 3. SUPPLEMENTARY EXAMS TABLE
CREATE TABLE IF NOT EXISTS supplementary_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject VARCHAR(150) NOT NULL,
  status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'approved', 'rejected', 'completed')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  remarks TEXT,
  CONSTRAINT unique_supplementary_application UNIQUE (student_id, exam_id, subject)
);

ALTER TABLE supplementary_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Staff can manage supplementary exams"
  ON supplementary_exams FOR ALL
  USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director', 'Staff', 'Teacher', 'HOD')
    AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
  );

CREATE POLICY "Students can view and create their own supplementary applications"
  ON supplementary_exams FOR ALL
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_supplementary_exams_student ON supplementary_exams(student_id);
CREATE INDEX IF NOT EXISTS idx_supplementary_exams_exam ON supplementary_exams(exam_id);

-- 4. RE-EVALUATION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS re_evaluation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  result_id UUID NOT NULL REFERENCES exam_results(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  subject VARCHAR(150) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'under_review', 'approved', 'rejected', 'completed')),
  previous_marks DECIMAL(5, 2),
  new_marks DECIMAL(5, 2),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  remarks TEXT,
  CONSTRAINT unique_re_evaluation_application UNIQUE (student_id, result_id)
);

ALTER TABLE re_evaluation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Staff can manage re-evaluation requests"
  ON re_evaluation_requests FOR ALL
  USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director', 'Staff', 'Teacher', 'HOD')
    AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
  );

CREATE POLICY "Students can view and create their own re-evaluation requests"
  ON re_evaluation_requests FOR ALL
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_re_evaluation_requests_student ON re_evaluation_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_re_evaluation_requests_exam ON re_evaluation_requests(exam_id);
