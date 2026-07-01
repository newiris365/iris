-- ============================================================
-- MODULE 5: IRIS Hostel — Schema Extensions & New Tables
-- ============================================================

-- 1. EXTEND hostel_blocks TABLE
ALTER TABLE hostel_blocks ADD COLUMN IF NOT EXISTS total_floors INTEGER DEFAULT 1;
ALTER TABLE hostel_blocks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Change amenities type to TEXT[]
-- First check if we need to drop the old column and recreate it, or convert. 
-- Since we are in development/migration, we can do a safe cast:
ALTER TABLE hostel_blocks ALTER COLUMN amenities TYPE TEXT[] USING string_to_array(coalesce(amenities, ''), ',')::TEXT[];

-- Modify type constraint
ALTER TABLE hostel_blocks DROP CONSTRAINT IF EXISTS chk_block_type;
ALTER TABLE hostel_blocks ADD CONSTRAINT chk_block_type CHECK (lower(type) IN ('boys','girls','co-ed','staff'));

-- 2. EXTEND hostel_rooms TABLE
ALTER TABLE hostel_rooms ADD COLUMN IF NOT EXISTS floor INTEGER DEFAULT 0;
ALTER TABLE hostel_rooms ADD COLUMN IF NOT EXISTS room_type TEXT CHECK (room_type IN ('single','double','triple','dormitory'));
ALTER TABLE hostel_rooms ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE hostel_rooms ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE hostel_rooms ALTER COLUMN amenities TYPE TEXT[] USING string_to_array(coalesce(amenities, ''), ',')::TEXT[];

-- 3. EXTEND hostel_allocations TABLE
ALTER TABLE hostel_allocations ADD COLUMN IF NOT EXISTS allotted_by UUID REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE hostel_allocations ADD COLUMN IF NOT EXISTS vacating_reason TEXT;
ALTER TABLE hostel_allocations ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE hostel_allocations ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'pending' CHECK (deposit_status IN ('pending', 'paid', 'refunded'));
ALTER TABLE hostel_allocations ADD COLUMN IF NOT EXISTS agreement_url TEXT;

-- 4. EXTEND hostel_complaints TABLE
ALTER TABLE hostel_complaints ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Hostel Complaint';
ALTER TABLE hostel_complaints ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';
ALTER TABLE hostel_complaints ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE hostel_complaints ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE hostel_complaints ADD COLUMN IF NOT EXISTS student_rating INTEGER CHECK (student_rating >= 1 AND student_rating <= 5);

ALTER TABLE hostel_complaints DROP CONSTRAINT IF EXISTS chk_complaint_category;
ALTER TABLE hostel_complaints ADD CONSTRAINT chk_complaint_category CHECK (lower(category) IN (
  'maintenance','cleanliness','electrical','plumbing',
  'internet','security','roommate','food','other'
));

-- 5. EXTEND hostel_visitors TABLE
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS visitor_id_type TEXT;
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS visitor_id_number TEXT;
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS visitor_photo_url TEXT;
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS relation TEXT;
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'inside' CHECK (status IN ('inside', 'checked_out'));
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS gate_pass_url TEXT;
ALTER TABLE hostel_visitors ALTER COLUMN visitor_phone DROP NOT NULL;

-- 6. CREATE hostel_fees TABLE
CREATE TABLE IF NOT EXISTS hostel_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id UUID REFERENCES hostel_allocations(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE,
  paid_date TIMESTAMPTZ,
  transaction_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  late_fee DECIMAL(10, 2) DEFAULT 0
);

-- 7. CREATE hostel_leave_requests TABLE
CREATE TABLE IF NOT EXISTS hostel_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  leave_from DATE NOT NULL,
  leave_to DATE NOT NULL,
  reason TEXT,
  destination TEXT,
  parent_consent BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'late_return', 'returned')),
  approved_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  approval_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. CREATE hostel_notices TABLE
CREATE TABLE IF NOT EXISTS hostel_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  block_id UUID REFERENCES hostel_blocks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  posted_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  posted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- 9. CREATE hostel_inventory TABLE
CREATE TABLE IF NOT EXISTS hostel_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES hostel_rooms(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'damaged')),
  last_checked DATE DEFAULT CURRENT_DATE
);

-- 10. CREATE hostel_warden_reports TABLE
CREATE TABLE IF NOT EXISTS hostel_warden_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID REFERENCES hostel_blocks(id) ON DELETE CASCADE,
  report_type TEXT CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  report_date DATE NOT NULL,
  data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  pdf_url TEXT
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_hostel_blocks_institution ON hostel_blocks(institution_id);
CREATE INDEX IF NOT EXISTS idx_hostel_rooms_block ON hostel_rooms(block_id);
CREATE INDEX IF NOT EXISTS idx_hostel_allocations_student ON hostel_allocations(student_id);
CREATE INDEX IF NOT EXISTS idx_hostel_fees_student ON hostel_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_hostel_complaints_student ON hostel_complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_hostel_leave_requests_student ON hostel_leave_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_hostel_visitors_student ON hostel_visitors(student_id);
CREATE INDEX IF NOT EXISTS idx_hostel_notices_block ON hostel_notices(block_id);
CREATE INDEX IF NOT EXISTS idx_hostel_inventory_room ON hostel_inventory(room_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE hostel_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_warden_reports ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "tenant_isolation_hostel_fees" ON hostel_fees
  USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()));

CREATE POLICY "tenant_isolation_hostel_leave_requests" ON hostel_leave_requests
  USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()));

CREATE POLICY "tenant_isolation_hostel_notices" ON hostel_notices
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_hostel_inventory" ON hostel_inventory
  USING (room_id IN (SELECT id FROM hostel_rooms WHERE block_id IN (SELECT id FROM hostel_blocks WHERE institution_id = get_auth_institution_id())));

CREATE POLICY "tenant_isolation_hostel_warden_reports" ON hostel_warden_reports
  USING (block_id IN (SELECT id FROM hostel_blocks WHERE institution_id = get_auth_institution_id()));
