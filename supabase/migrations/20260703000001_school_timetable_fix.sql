-- Make department_id nullable for school timetable support
ALTER TABLE timetable ALTER COLUMN department_id DROP NOT NULL;

-- Add class_section_id for school timetable
DO $$ BEGIN
  ALTER TABLE timetable ADD COLUMN class_section_id UUID REFERENCES class_sections(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_timetable_class_section ON timetable(class_section_id);
