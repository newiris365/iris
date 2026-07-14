import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { getDbPool, tableExists, runSql } from '../config/db';
import logger from '../config/logger';

// ─── AUTO-CREATE CLASS_SECTIONS TABLE ON STARTUP ──────────────
let classSectionsReady = false;

const CLASS_SECTIONS_DDL = `
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

DO $$
BEGIN
  ALTER TABLE class_sections ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "tenant_class_sections_select" ON class_sections;
  CREATE POLICY "tenant_class_sections_select" ON class_sections
    FOR SELECT USING (institution_id = (auth.jwt() ->> 'institution_id')::uuid);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "tenant_class_sections_manage" ON class_sections;
  CREATE POLICY "tenant_class_sections_manage" ON class_sections
    FOR ALL USING (institution_id = (auth.jwt() ->> 'institution_id')::uuid);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
`;

const TIMETABLE_SCHOOL_MIGRATION = `
ALTER TABLE timetable ALTER COLUMN department_id DROP NOT NULL;
`;

let timetableSchoolReady = false;

export async function ensureTimetableSchoolReady(): Promise<boolean> {
  if (timetableSchoolReady) return true;
  const pool = getDbPool();
  if (!pool) {
    logger.error('[SCHOOL] Cannot auto-migrate timetable: DATABASE_URL not configured.');
    return false;
  }
  const result = await runSql(TIMETABLE_SCHOOL_MIGRATION);
  if (result.success) {
    timetableSchoolReady = true;
    logger.info('[SCHOOL] Timetable school migration applied.');
    return true;
  }
  logger.error('[SCHOOL] Timetable school migration failed:', result.error);
  return false;
}

export async function ensureClassSectionsTable(): Promise<boolean> {
  // Step 1: Check via Supabase if table already exists
  try {
    const { error } = await supabaseAdmin
      .from('class_sections')
      .select('id')
      .limit(1);

    if (!error) {
      classSectionsReady = true;
      logger.info('[SCHOOL] class_sections table verified via Supabase.');
      return true;
    }
    logger.info('[SCHOOL] class_sections check via Supabase:', error?.message, error?.code);
  } catch (err: any) {
    logger.info('[SCHOOL] class_sections Supabase check failed:', err.message);
  }

  // Step 2: Try direct PostgreSQL connection
  const pool = getDbPool();
  if (!pool) {
    logger.error('[SCHOOL] Cannot auto-create class_sections: DATABASE_URL not configured.');
    logger.error('[SCHOOL] MANUAL FIX: Run the SQL in supabase/migrations/20260703000000_class_sections.sql via Supabase SQL Editor.');
    return false;
  }

  // Check via direct PG
  const exists = await tableExists('class_sections');
  if (exists) {
    classSectionsReady = true;
    logger.info('[SCHOOL] class_sections table verified via direct PG.');
    return true;
  }

  // Step 3: Create the table via direct PG
  logger.warn('[SCHOOL] class_sections table missing. Creating via direct PostgreSQL...');
  const result = await runSql(CLASS_SECTIONS_DDL);

  if (result.success) {
    classSectionsReady = true;
    logger.info('[SCHOOL] class_sections table created successfully via direct PG.');
    return true;
  }

  logger.error('[SCHOOL] Failed to create class_sections table:', result.error);
  return false;
}

export function isClassSectionsReady(): boolean {
  return classSectionsReady;
}

// ─── LIST CLASS SECTIONS ─────────────────────────────────────
export async function listClassSections(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    if (!classSectionsReady) {
      const created = await ensureClassSectionsTable();
      if (!created) {
        return res.status(503).json({
          success: false,
          error: 'Class sections table could not be initialized. Please run the setup schema.',
          setup_required: true,
        });
      }
    }
    await ensureTimetableSchoolReady();

    const { data, error } = await supabaseAdmin
      .from('class_sections')
      .select(`
        id, grade, section, room_number, capacity, created_at,
        class_teacher:class_teacher_id(id, name, email)
      `)
      .eq('institution_id', institution_id)
      .order('grade')
      .order('section');

    if (error) throw error;

    const classes = (data || []).map((c: any) => ({
      id: c.id,
      grade: c.grade,
      section: c.section,
      class_teacher_id: c.class_teacher?.id || null,
      class_teacher_name: c.class_teacher?.name || null,
      room_number: c.room_number,
      capacity: c.capacity,
      student_count: 0,
    }));

    // Count actual students per grade from students table (semester = grade for schools)
    const { data: studentCounts } = await supabaseAdmin
      .from('students')
      .select('semester')
      .eq('institution_id', institution_id);

    if (studentCounts) {
      const countMap: Record<number, number> = {};
      studentCounts.forEach((s: any) => {
        const g = s.semester || 0;
        countMap[g] = (countMap[g] || 0) + 1;
      });
      classes.forEach((c: any) => {
        c.student_count = countMap[c.grade] || 0;
      });
    }

    return res.json({ success: true, classes });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[listClassSections] Error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── CREATE CLASS SECTION ────────────────────────────────────
export async function createClassSection(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    if (!classSectionsReady) {
      const created = await ensureClassSectionsTable();
      if (!created) {
        return res.status(503).json({ success: false, error: 'Class sections table could not be initialized. Please run the setup schema.' });
      }
    }

    const { grade, section, class_teacher_id, room_number, capacity } = req.body;
    if (!grade || !section) {
      return res.status(400).json({ success: false, error: 'Grade and Section are required.' });
    }

    const { data, error } = await supabaseAdmin
      .from('class_sections')
      .insert({
        institution_id,
        grade: Number(grade),
        section: section.toUpperCase(),
        class_teacher_id: class_teacher_id || null,
        room_number: room_number || null,
        capacity: capacity || 40,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ success: false, error: `Grade ${grade} Section ${section} already exists.` });
      }
      throw error;
    }

    return res.json({ success: true, class_section: data, message: `Grade ${grade}-${section} created.` });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[createClassSection] Error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── UPDATE CLASS SECTION ────────────────────────────────────
export async function updateClassSection(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    if (!classSectionsReady) {
      const created = await ensureClassSectionsTable();
      if (!created) {
        return res.status(503).json({ success: false, error: 'Class sections table could not be initialized.' });
      }
    }
    await ensureTimetableSchoolReady();

    const { grade, section, class_teacher_id, room_number, capacity } = req.body;

    const updates: Record<string, unknown> = {};
    if (grade !== undefined) updates.grade = Number(grade);
    if (section !== undefined) updates.section = section.toUpperCase();
    if (class_teacher_id !== undefined) updates.class_teacher_id = class_teacher_id || null;
    if (room_number !== undefined) updates.room_number = room_number || null;
    if (capacity !== undefined) updates.capacity = capacity;

    const { data, error } = await supabaseAdmin
      .from('class_sections')
      .update(updates)
      .eq('id', id)
      .eq('institution_id', institution_id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, class_section: data });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[updateClassSection] Error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── DELETE CLASS SECTION ────────────────────────────────────
export async function deleteClassSection(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    if (!classSectionsReady) {
      const created = await ensureClassSectionsTable();
      if (!created) {
        return res.status(503).json({ success: false, error: 'Class sections table could not be initialized.' });
      }
    }

    const { error } = await supabaseAdmin
      .from('class_sections')
      .delete()
      .eq('id', id)
      .eq('institution_id', institution_id);

    if (error) throw error;
    return res.json({ success: true, message: 'Class section deleted.' });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[deleteClassSection] Error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── LIST TEACHERS (for dropdown) ────────────────────────────
export async function listTeachers(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('institution_id', institution_id)
      .eq('role', 'Teacher')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return res.json({ success: true, teachers: data || [] });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[listTeachers] Error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

const LIBRARY_BOOKS_DDL = `
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  isbn TEXT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publisher TEXT,
  publication_year INTEGER,
  category TEXT,
  subcategory TEXT,
  language TEXT DEFAULT 'English',
  copies_total INTEGER DEFAULT 1,
  copies_available INTEGER DEFAULT 1,
  shelf_location TEXT,
  cover_image_url TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

const LIBRARY_BOOK_ISSUES_DDL = `
CREATE TABLE IF NOT EXISTS book_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  returned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  condition_on_issue TEXT DEFAULT 'good',
  condition_on_return TEXT,
  fine_amount DECIMAL DEFAULT 0,
  fine_paid BOOLEAN DEFAULT false,
  fine_paid_date DATE,
  status TEXT DEFAULT 'issued',
  renewal_count INTEGER DEFAULT 0,
  notes TEXT
);
`;

const LIBRARY_BOOK_RESERVATIONS_DDL = `
CREATE TABLE IF NOT EXISTS book_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  reserved_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'waiting',
  notified_at TIMESTAMPTZ
);
`;

const LIBRARY_EBOOKS_DDL = `
CREATE TABLE IF NOT EXISTS ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  category TEXT,
  department TEXT,
  semester TEXT,
  description TEXT,
  file_url TEXT NOT NULL,
  cover_url TEXT,
  file_size_mb DECIMAL,
  tags TEXT[] DEFAULT '{}',
  access_level TEXT DEFAULT 'all',
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
`;

const LIBRARY_STUDY_ROOMS_DDL = `
CREATE TABLE IF NOT EXISTS study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER,
  amenities TEXT[] DEFAULT '{}',
  floor INTEGER,
  is_active BOOLEAN DEFAULT true
);
`;

const LIBRARY_STUDY_ROOM_BOOKINGS_DDL = `
CREATE TABLE IF NOT EXISTS study_room_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose TEXT,
  group_members UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'confirmed',
  qr_code TEXT,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

const LIBRARY_FINES_DDL = `
CREATE TABLE IF NOT EXISTS library_fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES book_issues(id) ON DELETE SET NULL,
  amount DECIMAL NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'unpaid',
  payment_date DATE,
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

const LIBRARY_READING_HISTORY_DDL = `
CREATE TABLE IF NOT EXISTS reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  ebook_id UUID,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

// ─── ADMIN: SETUP SCHEMA ENDPOINT ────────────────────────────
const PTM_DDL = `
CREATE TABLE IF NOT EXISTS ptm_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  slot_time VARCHAR(100) NOT NULL,
  available BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_ptm_slot_teacher UNIQUE (teacher_id, date, slot_time)
);

CREATE INDEX IF NOT EXISTS idx_ptm_slots_teacher ON ptm_slots(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ptm_slots_date ON ptm_slots(date);

CREATE TABLE IF NOT EXISTS ptm_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  slot_time VARCHAR(100) NOT NULL,
  meet_link TEXT,
  status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_ptm_booking_slot UNIQUE (teacher_id, date, slot_time)
);

CREATE INDEX IF NOT EXISTS idx_ptm_bookings_parent ON ptm_bookings(parent_id);
CREATE INDEX IF NOT EXISTS idx_ptm_bookings_teacher ON ptm_bookings(teacher_id);
`;

const PARENT_MESSAGES_DDL = `
CREATE TABLE IF NOT EXISTS parent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  sender_role VARCHAR(50) NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sla_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_messages_sender ON parent_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_receiver ON parent_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_institution ON parent_messages(institution_id);
`;

export async function setupSchema(req: Request, res: Response) {
  try {
    const pool = getDbPool();
    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'DATABASE_URL not configured. Cannot run schema setup.',
        hint: 'Add DATABASE_URL to your .env file with the Supabase direct PostgreSQL connection string.',
      });
    }

    const results: { table: string; status: string; error?: string }[] = [];

    const tables = [
      { name: 'class_sections', ddl: CLASS_SECTIONS_DDL },
      { name: 'ptm_slots', ddl: PTM_DDL },
      { name: 'parent_messages', ddl: PARENT_MESSAGES_DDL },
      { name: 'books', ddl: LIBRARY_BOOKS_DDL },
      { name: 'book_issues', ddl: LIBRARY_BOOK_ISSUES_DDL },
      { name: 'book_reservations', ddl: LIBRARY_BOOK_RESERVATIONS_DDL },
      { name: 'ebooks', ddl: LIBRARY_EBOOKS_DDL },
      { name: 'study_rooms', ddl: LIBRARY_STUDY_ROOMS_DDL },
      { name: 'study_room_bookings', ddl: LIBRARY_STUDY_ROOM_BOOKINGS_DDL },
      { name: 'library_fines', ddl: LIBRARY_FINES_DDL },
      { name: 'reading_history', ddl: LIBRARY_READING_HISTORY_DDL },
    ];

    for (const t of tables) {
      const exists = await tableExists(t.name);
      if (exists) {
        results.push({ table: t.name, status: 'already exists' });
      } else {
        const result = await runSql(t.ddl);
        if (result.success) {
          results.push({ table: t.name, status: 'created' });
          if (t.name === 'class_sections') classSectionsReady = true;
        } else {
          results.push({ table: t.name, status: 'failed', error: result.error });
        }
      }
    }

    return res.json({ success: true, results });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── AUTO-CREATE ALL TABLES ON STARTUP ────────────────────────
export async function ensureAllSchemaTables(): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  const tables = [
    { name: 'class_sections', ddl: CLASS_SECTIONS_DDL, onCreated: () => { classSectionsReady = true; } },
    { name: 'ptm_slots', ddl: PTM_DDL, onCreated: () => {} },
    { name: 'parent_messages', ddl: PARENT_MESSAGES_DDL, onCreated: () => {} },
    { name: 'books', ddl: LIBRARY_BOOKS_DDL, onCreated: () => {} },
    { name: 'book_issues', ddl: LIBRARY_BOOK_ISSUES_DDL, onCreated: () => {} },
    { name: 'book_reservations', ddl: LIBRARY_BOOK_RESERVATIONS_DDL, onCreated: () => {} },
    { name: 'ebooks', ddl: LIBRARY_EBOOKS_DDL, onCreated: () => {} },
    { name: 'study_rooms', ddl: LIBRARY_STUDY_ROOMS_DDL, onCreated: () => {} },
    { name: 'study_room_bookings', ddl: LIBRARY_STUDY_ROOM_BOOKINGS_DDL, onCreated: () => {} },
    { name: 'library_fines', ddl: LIBRARY_FINES_DDL, onCreated: () => {} },
    { name: 'reading_history', ddl: LIBRARY_READING_HISTORY_DDL, onCreated: () => {} },
  ];

  for (const t of tables) {
    const exists = await tableExists(t.name);
    if (!exists) {
      logger.warn(`[SCHEMA] Table "${t.name}" missing. Creating...`);
      const result = await runSql(t.ddl);
      if (result.success) {
        t.onCreated();
        logger.info(`[SCHEMA] Table "${t.name}" created successfully.`);
      } else {
        logger.error(`[SCHEMA] Failed to create "${t.name}":`, result.error);
      }
    } else {
      if (t.name === 'class_sections') classSectionsReady = true;
    }
  }
}
