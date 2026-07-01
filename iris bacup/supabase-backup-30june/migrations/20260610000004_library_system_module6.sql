-- ============================================================
-- MODULE 6: IRIS Library+ — Extended Schema & New Tables
-- ============================================================

-- 1. CREATE reading_goals TABLE
CREATE TABLE IF NOT EXISTS reading_goals (
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  target_books INTEGER NOT NULL,
  completed_books INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  pages_read_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, year)
);

-- 2. CREATE book_clubs TABLE
CREATE TABLE IF NOT EXISTS book_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  current_book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  schedule TEXT,
  members UUID[] DEFAULT '{}'::uuid[],
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE book_club_discussions TABLE
CREATE TABLE IF NOT EXISTS book_club_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  chapter VARCHAR(100) NOT NULL,
  question TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT false,
  responses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE digital_newspapers TABLE
CREATE TABLE IF NOT EXISTS digital_newspapers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  current_issue_url TEXT NOT NULL,
  archive_urls JSONB DEFAULT '{}'::jsonb,
  bookmarks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. CREATE interlibrary_requests TABLE
CREATE TABLE IF NOT EXISTS interlibrary_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  providing_institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'shipped', 'delivered', 'returned')),
  courier_tracking TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_reading_goals_institution ON reading_goals(institution_id);
CREATE INDEX IF NOT EXISTS idx_book_clubs_institution ON book_clubs(institution_id);
CREATE INDEX IF NOT EXISTS idx_book_club_discussions_club ON book_club_discussions(club_id);
CREATE INDEX IF NOT EXISTS idx_digital_newspapers_institution ON digital_newspapers(institution_id);
CREATE INDEX IF NOT EXISTS idx_interlibrary_requests_requesting ON interlibrary_requests(requesting_institution_id);
CREATE INDEX IF NOT EXISTS idx_interlibrary_requests_providing ON interlibrary_requests(providing_institution_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE reading_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_club_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_newspapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE interlibrary_requests ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_reading_goals ON reading_goals;
CREATE POLICY tenant_isolation_reading_goals ON reading_goals
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_book_clubs ON book_clubs;
CREATE POLICY tenant_isolation_book_clubs ON book_clubs
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_book_club_discussions ON book_club_discussions;
CREATE POLICY tenant_isolation_book_club_discussions ON book_club_discussions
  USING (
    EXISTS (
      SELECT 1 FROM book_clubs
      WHERE book_clubs.id = book_club_discussions.club_id
      AND book_clubs.institution_id = get_auth_institution_id()
    )
  );

DROP POLICY IF EXISTS tenant_isolation_digital_newspapers ON digital_newspapers;
CREATE POLICY tenant_isolation_digital_newspapers ON digital_newspapers
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_interlibrary_requests ON interlibrary_requests;
CREATE POLICY tenant_isolation_interlibrary_requests ON interlibrary_requests
  USING (
    requesting_institution_id = get_auth_institution_id() OR
    providing_institution_id = get_auth_institution_id()
  );
