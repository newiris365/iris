-- Make department_id nullable for school timetable support
ALTER TABLE timetable ALTER COLUMN department_id DROP NOT NULL;

-- Drop staff FK so school teachers (from users table) can be referenced
ALTER TABLE timetable DROP CONSTRAINT IF EXISTS timetable_teacher_id_fkey;
