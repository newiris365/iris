-- Migration for Module 14: HR Management

CREATE TABLE IF NOT EXISTS employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id),
  user_id uuid REFERENCES users(id),
  staff_id uuid REFERENCES staff(id),
  employee_code TEXT UNIQUE NOT NULL,
  title TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  blood_group TEXT,
  personal_email TEXT,
  personal_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address_permanent JSONB,
  address_current JSONB,
  photo_url TEXT,
  aadhar_number TEXT,
  pan_number TEXT,
  uan_number TEXT,
  bank_account_number TEXT,
  bank_name TEXT,
  bank_ifsc TEXT,
  bank_branch TEXT,
  nationality TEXT DEFAULT 'Indian',
  religion TEXT,
  category TEXT,
  marital_status TEXT,
  disability BOOLEAN DEFAULT false,
  disability_details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employment_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  institution_id uuid REFERENCES institutions(id),
  department_id uuid REFERENCES departments(id),
  designation TEXT NOT NULL,
  employee_type TEXT CHECK (employee_type IN (
    'permanent','probation','contract','visiting',
    'part_time','adhoc','guest'
  )),
  joining_date DATE NOT NULL,
  confirmation_date DATE,
  retirement_date DATE,
  reporting_to uuid REFERENCES employee_profiles(id),
  work_location TEXT,
  qualification TEXT,
  specialization TEXT,
  experience_years DECIMAL,
  previous_employer TEXT,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS salary_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id),
  name TEXT NOT NULL,
  components JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  structure_id uuid REFERENCES salary_structures(id),
  basic DECIMAL NOT NULL,
  hra DECIMAL DEFAULT 0,
  da DECIMAL DEFAULT 0,
  ta DECIMAL DEFAULT 0,
  medical_allowance DECIMAL DEFAULT 0,
  special_allowance DECIMAL DEFAULT 0,
  other_allowances JSONB,
  gross_salary DECIMAL NOT NULL,
  pf_employee DECIMAL DEFAULT 0,
  pf_employer DECIMAL DEFAULT 0,
  esi_employee DECIMAL DEFAULT 0,
  esi_employer DECIMAL DEFAULT 0,
  professional_tax DECIMAL DEFAULT 0,
  tds DECIMAL DEFAULT 0,
  other_deductions JSONB,
  net_salary DECIMAL NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_current BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status TEXT CHECK (status IN (
    'draft','processing','approved','disbursed','locked'
  )) DEFAULT 'draft',
  total_gross DECIMAL,
  total_deductions DECIMAL,
  total_net DECIMAL,
  employee_count INTEGER,
  created_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  disbursed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(institution_id, month, year)
);

CREATE TABLE IF NOT EXISTS payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id uuid REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  month INTEGER,
  year INTEGER,
  working_days INTEGER,
  present_days DECIMAL,
  absent_days DECIMAL,
  lop_days DECIMAL DEFAULT 0,
  basic DECIMAL,
  hra DECIMAL,
  da DECIMAL,
  ta DECIMAL,
  other_allowances JSONB,
  gross_earnings DECIMAL,
  pf_deduction DECIMAL,
  esi_deduction DECIMAL,
  professional_tax DECIMAL,
  tds_deduction DECIMAL,
  loan_deduction DECIMAL DEFAULT 0,
  other_deductions JSONB,
  total_deductions DECIMAL,
  net_salary DECIMAL,
  pdf_url TEXT,
  is_published BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  days_per_year INTEGER,
  is_paid BOOLEAN DEFAULT true,
  carry_forward BOOLEAN DEFAULT false,
  max_carry_forward INTEGER DEFAULT 0,
  applicable_to TEXT[],
  encashable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  leave_type_id uuid REFERENCES leave_types(id) ON DELETE CASCADE,
  year INTEGER,
  entitled_days DECIMAL,
  used_days DECIMAL DEFAULT 0,
  remaining_days DECIMAL,
  carried_forward DECIMAL DEFAULT 0,
  UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  leave_type_id uuid REFERENCES leave_types(id),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  total_days DECIMAL NOT NULL,
  reason TEXT NOT NULL,
  supporting_doc_url TEXT,
  status TEXT CHECK (status IN (
    'pending','approved','rejected','cancelled','recalled'
  )) DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT now(),
  approved_by uuid REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  substitute_id uuid REFERENCES employee_profiles(id),
  handover_notes TEXT
);

CREATE TABLE IF NOT EXISTS attendance_hr (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  in_time TIMESTAMPTZ,
  out_time TIMESTAMPTZ,
  total_hours DECIMAL,
  status TEXT CHECK (status IN (
    'present','absent','half_day','late','on_leave',
    'work_from_home','holiday','weekly_off'
  )),
  source TEXT DEFAULT 'biometric',
  remarks TEXT,
  UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS performance_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id),
  name TEXT NOT NULL,
  year INTEGER,
  period_start DATE,
  period_end DATE,
  self_appraisal_deadline DATE,
  hod_review_deadline DATE,
  principal_review_deadline DATE,
  status TEXT DEFAULT 'upcoming'
);

CREATE TABLE IF NOT EXISTS performance_appraisals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid REFERENCES performance_cycles(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  self_score DECIMAL,
  self_comments TEXT,
  hod_score DECIMAL,
  hod_comments TEXT,
  principal_score DECIMAL,
  principal_comments TEXT,
  final_score DECIMAL,
  rating TEXT CHECK (rating IN (
    'outstanding','excellent','good','average','below_average'
  )),
  increment_recommended DECIMAL,
  promotion_recommended BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending_self'
);

CREATE TABLE IF NOT EXISTS appraisal_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id),
  category TEXT,
  parameter TEXT NOT NULL,
  description TEXT,
  max_score INTEGER,
  weightage DECIMAL,
  applicable_to TEXT[]
);

CREATE TABLE IF NOT EXISTS employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  doc_name TEXT,
  doc_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS increments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  effective_date DATE,
  previous_basic DECIMAL,
  new_basic DECIMAL,
  increment_amount DECIMAL,
  increment_percent DECIMAL,
  reason TEXT,
  appraisal_id uuid REFERENCES performance_appraisals(id),
  approved_by uuid REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loan_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  loan_type TEXT,
  amount DECIMAL,
  applied_date DATE,
  approved_amount DECIMAL,
  tenure_months INTEGER,
  emi_amount DECIMAL,
  deduction_start DATE,
  outstanding_balance DECIMAL,
  status TEXT DEFAULT 'pending',
  approved_by uuid REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('national','state','restricted','institution')),
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tds_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  financial_year TEXT,
  regime TEXT CHECK (regime IN ('old','new')) DEFAULT 'new',
  hra_claimed DECIMAL DEFAULT 0,
  section_80c DECIMAL DEFAULT 0,
  section_80d DECIMAL DEFAULT 0,
  section_80g DECIMAL DEFAULT 0,
  home_loan_interest DECIMAL DEFAULT 0,
  other_deductions DECIMAL DEFAULT 0,
  declarations JSONB,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tds_declarations ENABLE ROW LEVEL SECURITY;

-- RLS: employee sees own payslip
DROP POLICY IF EXISTS "employee_own_payslip" ON payslips;
CREATE POLICY "employee_own_payslip" ON payslips
  FOR SELECT USING (
    employee_id = (
      SELECT id FROM employee_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Seed defaults
INSERT INTO leave_types (name, code, days_per_year, is_paid, carry_forward, max_carry_forward, encashable)
VALUES 
  ('Casual Leave', 'CL', 12, true, false, 0, false),
  ('Earned Leave', 'EL', 18, true, true, 30, true),
  ('Sick Leave', 'SL', 10, true, true, 15, false)
ON CONFLICT DO NOTHING;

INSERT INTO holidays (institution_id, name, date, type, year)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'Independence Day', '2026-08-15', 'national', 2026),
  ('a0000000-0000-0000-0000-000000000001', 'Republic Day', '2026-01-26', 'national', 2026)
ON CONFLICT DO NOTHING;
