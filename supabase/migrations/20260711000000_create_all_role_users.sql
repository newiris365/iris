-- Migration: Create all missing users for all roles
-- This ensures every role in the login page has a real user in the database
-- School and College are SEPARATE institutions with separate admins

-- ============================================================
-- INSTITUTION CONSTANTS
-- ============================================================
-- a0000000-0000-0000-0000-000000000001 = SIN Institute of Engineering & Technology (SIET) — College
-- a0000000-0000-0000-0000-000000000002 = SIET School — School

-- ============================================================
-- 0. CREATE SCHOOL INSTITUTION (if not exists)
-- ============================================================
INSERT INTO public.institutions (id, name, type, plan_tier, is_active, created_at)
VALUES ('a0000000-0000-0000-0000-000000000002', 'SIET School', 'school', 'Campus', true, now())
ON CONFLICT (id) DO NOTHING;

-- Set institute_type column if the column exists
UPDATE public.institutions SET institute_type = 'school' WHERE id = 'a0000000-0000-0000-0000-000000000002';

-- ============================================================
-- 1. INSERT COLLEGE USERS INTO public.users
-- ============================================================
-- College institution: a0000000-0000-0000-0000-000000000001

INSERT INTO public.users (id, name, email, role, is_active, institution_id) VALUES
  -- Director
  ('b0000000-0000-0000-0000-000000000019', 'Director SIET', 'director2@siet.edu.in', 'Director', true, 'a0000000-0000-0000-0000-000000000001'),
  -- HOD
  ('b0000000-0000-0000-0000-000000000017', 'HOD Member', 'hod@sin.education', 'HOD', true, 'a0000000-0000-0000-0000-000000000001'),
  -- Warden
  ('b0000000-0000-0000-0000-000000000012', 'Jaswant Singh', 'warden@siet.edu.in', 'Warden', true, 'a0000000-0000-0000-0000-000000000001'),
  -- Librarian
  ('b0000000-0000-0000-0000-000000000018', 'Librarian Head', 'librarian@sin.education', 'Librarian', true, 'a0000000-0000-0000-0000-000000000001'),
  -- Vendor
  ('b0000000-0000-0000-0000-000000000020', 'Canteen Vendor', 'canteen@siet.edu.in', 'Vendor', true, 'a0000000-0000-0000-0000-000000000001'),
  -- Security
  ('b0000000-0000-0000-0000-000000000015', 'Guard Sher Singh', 'security@siet.edu.in', 'Security', true, 'a0000000-0000-0000-0000-000000000001'),
  -- Staff
  ('b0000000-0000-0000-0000-000000000030', 'Faculty Staff Member', 'staff@sin.education', 'Staff', true, 'a0000000-0000-0000-0000-000000000001'),
  -- TPO
  ('b0000000-0000-0000-0000-000000000023', 'TPO Cell Head', 'tpo@siet.edu.in', 'TPO', true, 'a0000000-0000-0000-0000-000000000001'),
  -- IQAC Coordinator
  ('b0000000-0000-0000-0000-000000000024', 'IQAC Coordinator', 'iqac@sin.education', 'IQAC Coordinator', true, 'a0000000-0000-0000-0000-000000000001'),
  -- Admissions Officer
  ('b0000000-0000-0000-0000-000000000025', 'Admissions Officer', 'admissions@siet.edu.in', 'Admissions Officer', true, 'a0000000-0000-0000-0000-000000000001'),
  -- Gym Trainer
  ('b0000000-0000-0000-0000-000000000026', 'Gym Trainer', 'gym@sin.education', 'Gym Trainer', true, 'a0000000-0000-0000-0000-000000000001'),
  -- HR Admin
  ('b0000000-0000-0000-0000-000000000027', 'HR Admin', 'hr@siet.edu.in', 'HR Admin', true, 'a0000000-0000-0000-0000-000000000001'),
  -- Company HR
  ('b0000000-0000-0000-0000-000000000028', 'Company HR Partner', 'companyhr@siet.edu.in', 'Company HR', true, 'a0000000-0000-0000-0000-000000000001'),
  -- Applicant (College)
  ('b0000000-0000-0000-0000-000000000029', 'Applicant User', 'applicant@sin.education', 'Applicant', true, 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. INSERT SCHOOL USERS INTO public.users
-- ============================================================
-- School institution: a0000000-0000-0000-0000-000000000002

INSERT INTO public.users (id, name, email, role, is_active, institution_id) VALUES
  -- Admin (School)
  ('b0000000-0000-0000-0000-000000000031', 'School Admin', 'admin@school.edu.in', 'Admin', true, 'a0000000-0000-0000-0000-000000000002'),
  -- Teacher (School)
  ('b0000000-0000-0000-0000-000000000032', 'School Teacher', 'teacher@school.edu.in', 'Teacher', true, 'a0000000-0000-0000-0000-000000000002'),
  -- Staff (School)
  ('b0000000-0000-0000-0000-000000000033', 'School Staff', 'staff@school.edu.in', 'Staff', true, 'a0000000-0000-0000-0000-000000000002'),
  -- Student (School)
  ('b0000000-0000-0000-0000-000000000034', 'School Student', 'student@school.edu.in', 'Student', true, 'a0000000-0000-0000-0000-000000000002'),
  -- Parent (School)
  ('b0000000-0000-0000-0000-000000000035', 'School Parent', 'parent@school.edu.in', 'Parent', true, 'a0000000-0000-0000-0000-000000000002'),
  -- Librarian (School)
  ('b0000000-0000-0000-0000-000000000036', 'School Librarian', 'librarian@school.edu.in', 'Librarian', true, 'a0000000-0000-0000-0000-000000000002'),
  -- Warden (School)
  ('b0000000-0000-0000-0000-000000000037', 'School Warden', 'warden@school.edu.in', 'Warden', true, 'a0000000-0000-0000-0000-000000000002'),
  -- Security (School)
  ('b0000000-0000-0000-0000-000000000038', 'School Security', 'security@school.edu.in', 'Security', true, 'a0000000-0000-0000-0000-000000000002'),
  -- Vendor (School)
  ('b0000000-0000-0000-0000-000000000039', 'School Vendor', 'canteen@school.edu.in', 'Vendor', true, 'a0000000-0000-0000-0000-000000000002'),
  -- Driver (School)
  ('b0000000-0000-0000-0000-000000000040', 'School Driver', 'driver@school.edu.in', 'Driver', true, 'a0000000-0000-0000-0000-000000000002'),
  -- Applicant (School)
  ('b0000000-0000-0000-0000-000000000041', 'School Applicant', 'applicant@school.edu.in', 'Applicant', true, 'a0000000-0000-0000-0000-000000000002'),
  -- Admissions Officer (School)
  ('b0000000-0000-0000-0000-000000000042', 'School Admissions', 'admissions@school.edu.in', 'Admissions Officer', true, 'a0000000-0000-0000-0000-000000000002'),
  -- Principal (School)
  ('b0000000-0000-0000-0000-000000000021', 'School Principal', 'khushalkhatri0019@gmail.com', 'Principal', true, 'a0000000-0000-0000-0000-000000000002'),
  -- Vice Principal (School)
  ('b0000000-0000-0000-0000-000000000022', 'Vice Principal', 'khushal.24jiaiml067@jietjodhpur.ac.in', 'Vice Principal', true, 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. CREATE STUDENT RECORDS for Student users
-- ============================================================
-- College Student
INSERT INTO public.students (id, user_id, name, institution_id, roll_number, department_id, semester, batch_year, dob, gender)
VALUES
  ('b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', 'Priyansh Student', 'a0000000-0000-0000-0000-000000000001', 'CSE-001', 'd0000000-0000-0000-0000-000000000001', 4, '2022-2026', '2003-05-15', 'Male')
ON CONFLICT (id) DO NOTHING;

-- School Student
INSERT INTO public.students (id, user_id, name, institution_id, roll_number, department_id, semester, batch_year, dob, gender)
VALUES
  ('b0000000-0000-0000-0000-000000000034', 'b0000000-0000-0000-0000-000000000034', 'School Student', 'a0000000-0000-0000-0000-000000000002', 'SCH-001', NULL, 1, '2025-2026', '2008-01-15', 'Male')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. CREATE STAFF RECORDS for Staff/Teacher/HOD etc users
-- ============================================================
INSERT INTO public.staff (id, user_id, institution_id, department_id, designation, joining_date, salary, qualification)
VALUES
  -- ===== COLLEGE STAFF =====
  -- HOD
  ('b0000000-0000-0000-0000-000000000050', 'b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Head of Department', '2020-01-01', 150000.00, 'Ph.D.'),
  -- Warden
  ('b0000000-0000-0000-0000-000000000051', 'b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Hostel Warden', '2021-06-01', 80000.00, 'M.A.'),
  -- Librarian
  ('b0000000-0000-0000-0000-000000000052', 'b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Chief Librarian', '2019-03-15', 75000.00, 'MLIS'),
  -- Vendor
  ('b0000000-0000-0000-0000-000000000053', 'b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Canteen Manager', '2022-01-01', 45000.00, 'B.Com'),
  -- Security
  ('b0000000-0000-0000-0000-000000000054', 'b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Security Head', '2020-08-01', 40000.00, '12th Pass'),
  -- Staff
  ('b0000000-0000-0000-0000-000000000055', 'b0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Administrative Staff', '2023-01-01', 35000.00, 'Graduate'),
  -- Director
  ('b0000000-0000-0000-0000-000000000056', 'b0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Director', '2018-01-01', 200000.00, 'Ph.D.'),
  -- TPO
  ('b0000000-0000-0000-0000-000000000057', 'b0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Training & Placement Officer', '2021-07-01', 90000.00, 'MBA'),
  -- IQAC Coordinator
  ('b0000000-0000-0000-0000-000000000058', 'b0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'IQAC Coordinator', '2022-01-01', 95000.00, 'Ph.D.'),
  -- Admissions Officer
  ('b0000000-0000-0000-0000-000000000059', 'b0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Admissions Officer', '2023-03-01', 60000.00, 'MBA'),
  -- Gym Trainer
  ('b0000000-0000-0000-0000-000000000060', 'b0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Gym Trainer', '2024-01-01', 30000.00, 'Certified Fitness Trainer'),
  -- HR Admin
  ('b0000000-0000-0000-0000-000000000061', 'b0000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'HR Admin', '2022-06-01', 85000.00, 'MBA HR'),
  -- Company HR
  ('b0000000-0000-0000-0000-000000000062', 'b0000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Company HR Partner', '2024-01-01', 70000.00, 'MBA'),
  -- Vice Principal
  ('b0000000-0000-0000-0000-000000000063', 'b0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Vice Principal', '2020-01-01', 180000.00, 'Ph.D.'),
  -- ===== SCHOOL STAFF =====
  -- School Staff
  ('b0000000-0000-0000-0000-000000000064', 'b0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000002', NULL, 'School Staff', '2023-01-01', 30000.00, 'Graduate'),
  -- School Teacher
  ('b0000000-0000-0000-0000-000000000065', 'b0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000002', NULL, 'School Teacher', '2022-06-01', 40000.00, 'B.Ed'),
  -- School Librarian
  ('b0000000-0000-0000-0000-000000000066', 'b0000000-0000-0000-0000-000000000036', 'a0000000-0000-0000-0000-000000000002', NULL, 'School Librarian', '2023-01-01', 35000.00, 'MLIS'),
  -- School Warden
  ('b0000000-0000-0000-0000-000000000067', 'b0000000-0000-0000-0000-000000000037', 'a0000000-0000-0000-0000-000000000002', NULL, 'School Warden', '2022-01-01', 35000.00, 'Graduate'),
  -- School Security
  ('b0000000-0000-0000-0000-000000000068', 'b0000000-0000-0000-0000-000000000038', 'a0000000-0000-0000-0000-000000000002', NULL, 'School Security', '2023-01-01', 25000.00, '12th Pass'),
  -- School Vendor
  ('b0000000-0000-0000-0000-000000000069', 'b0000000-0000-0000-0000-000000000039', 'a0000000-0000-0000-0000-000000000002', NULL, 'School Vendor', '2024-01-01', 20000.00, '10th Pass'),
  -- School Principal
  ('b0000000-0000-0000-0000-000000000070', 'b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', NULL, 'Principal', '2019-01-01', 120000.00, 'Ph.D.')
ON CONFLICT (id) DO NOTHING;
