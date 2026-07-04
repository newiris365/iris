CREATE TABLE IF NOT EXISTS class_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  grade INTEGER NOT NULL,
  section VARCHAR(10) NOT NULL,
  class_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  room_number VARCHAR(50),
  capacity INTEGER DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_grade_section_per_tenant UNIQUE (institution_id, grade, section)
);

CREATE INDEX IF NOT EXISTS idx_class_sections_institution ON class_sections(institution_id);
CREATE INDEX IF NOT EXISTS idx_class_sections_grade ON class_sections(institution_id, grade);

DO $$ BEGIN
  ALTER TABLE class_sections ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "tenant_class_sections_select" ON class_sections;
  CREATE POLICY "tenant_class_sections_select" ON class_sections
    FOR SELECT USING (institution_id = (auth.jwt() ->> 'institution_id')::uuid);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "tenant_class_sections_manage" ON class_sections;
  CREATE POLICY "tenant_class_sections_manage" ON class_sections
    FOR ALL USING (institution_id = (auth.jwt() ->> 'institution_id')::uuid);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION ensure_class_sections_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS class_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    grade INTEGER NOT NULL,
    section VARCHAR(10) NOT NULL,
    class_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    room_number VARCHAR(50),
    capacity INTEGER DEFAULT 40,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_grade_section_per_tenant UNIQUE (institution_id, grade, section)
  );
  CREATE INDEX IF NOT EXISTS idx_class_sections_institution ON class_sections(institution_id);
  CREATE INDEX IF NOT EXISTS idx_class_sections_grade ON class_sections(institution_id, grade);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
