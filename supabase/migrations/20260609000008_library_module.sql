-- ============================================================
-- MODULE 6: IRIS Library+ — Schema Extensions & New Tables
-- ============================================================

-- Enable vector extension for AI recommendations
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. CREATE books TABLE
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

-- 2. CREATE book_issues TABLE
CREATE TABLE IF NOT EXISTS book_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  issued_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  returned_to UUID REFERENCES staff(id) ON DELETE SET NULL,
  condition_on_issue TEXT DEFAULT 'good' CHECK (condition_on_issue IN ('excellent', 'good', 'fair', 'damaged')),
  condition_on_return TEXT CHECK (condition_on_return IN ('excellent', 'good', 'fair', 'damaged', 'lost')),
  fine_amount DECIMAL DEFAULT 0,
  fine_paid BOOLEAN DEFAULT false,
  fine_paid_date DATE,
  status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'renewed', 'lost')),
  renewal_count INTEGER DEFAULT 0,
  notes TEXT
);

-- 3. CREATE book_reservations TABLE
CREATE TABLE IF NOT EXISTS book_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  reserved_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'completed', 'expired')),
  notified_at TIMESTAMPTZ
);

-- 4. CREATE ebooks TABLE
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
  uploaded_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CREATE study_rooms TABLE
CREATE TABLE IF NOT EXISTS study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER,
  amenities TEXT[] DEFAULT '{}',
  floor INTEGER,
  is_active BOOLEAN DEFAULT true
);

-- 6. CREATE study_room_bookings TABLE
CREATE TABLE IF NOT EXISTS study_room_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose TEXT,
  group_members UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  qr_code TEXT UNIQUE,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CREATE library_fines TABLE
CREATE TABLE IF NOT EXISTS library_fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES book_issues(id) ON DELETE CASCADE,
  amount DECIMAL DEFAULT 0,
  reason TEXT,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
  payment_date DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'wallet', 'online')),
  transaction_id TEXT
);

-- 8. CREATE reading_history TABLE
CREATE TABLE IF NOT EXISTS reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  ebook_id UUID REFERENCES ebooks(id) ON DELETE SET NULL,
  action TEXT CHECK (action IN ('borrow', 'return', 'reserve', 'view_ebook', 'download_ebook')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_books_institution ON books(institution_id);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_book_issues_student ON book_issues(student_id);
CREATE INDEX IF NOT EXISTS idx_book_issues_book ON book_issues(book_id);
CREATE INDEX IF NOT EXISTS idx_book_reservations_book ON book_reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_institution ON ebooks(institution_id);
CREATE INDEX IF NOT EXISTS idx_study_rooms_institution ON study_rooms(institution_id);
CREATE INDEX IF NOT EXISTS idx_study_room_bookings_room ON study_room_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_library_fines_student ON library_fines(student_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_student ON reading_history(student_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "tenant_isolation_books" ON books
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_book_issues" ON book_issues
  USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()));

CREATE POLICY "tenant_isolation_book_reservations" ON book_reservations
  USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()));

CREATE POLICY "tenant_isolation_ebooks" ON ebooks
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_study_rooms" ON study_rooms
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_study_room_bookings" ON study_room_bookings
  USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()));

CREATE POLICY "tenant_isolation_library_fines" ON library_fines
  USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()));

CREATE POLICY "tenant_isolation_reading_history" ON reading_history
  USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()));

-- ============================================================
-- HELPER VECTOR SIMILARITY FUNCTION (pgvector RPC)
-- ============================================================
CREATE OR REPLACE FUNCTION match_books (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  inst_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  author text,
  category text,
  cover_image_url text,
  description text,
  copies_available integer,
  shelf_location text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    books.id,
    books.title,
    books.author,
    books.category,
    books.cover_image_url,
    books.description,
    books.copies_available,
    books.shelf_location,
    1 - (books.embedding <=> query_embedding) AS similarity
  FROM books
  WHERE books.institution_id = inst_id 
    AND books.embedding IS NOT NULL
    AND 1 - (books.embedding <=> query_embedding) > match_threshold
  ORDER BY books.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
