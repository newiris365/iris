-- ==========================================================
-- IRIS 365 Consolidated Database Setup Script
-- Target: Supabase (PostgreSQL) SQL Editor
-- Includes: Core Schema, Performance Indexes, Atomic RPCs, 
-- Hardened RLS policies, and rich Seed Data.
-- ==========================================================

-- ==========================================================
-- SECTION 1: CORE DATABASE SCHEMA
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. INSTITUTIONS
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- school, college, university, center
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    logo_url TEXT,
    plan_tier VARCHAR(50) DEFAULT 'Seed', -- Seed, Campus, University, Enterprise
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS & AUTH (Syncs with Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- SuperAdmin, Admin, Staff, Student, Parent, Warden, Driver, Vendor, Security
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    employee_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_email_per_tenant UNIQUE (institution_id, email)
);

-- 3. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    head_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. STUDENTS
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    roll_number VARCHAR(50) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    semester INTEGER DEFAULT 1,
    batch_year VARCHAR(10) NOT NULL, -- e.g., 2024-2028
    dob DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(20),
    address TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_roll_per_tenant UNIQUE (institution_id, roll_number)
);

-- 5. STAFF
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(100),
    joining_date DATE,
    salary DECIMAL(12, 2),
    qualification VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ATTENDANCE SESSIONS
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    subject VARCHAR(150) NOT NULL,
    date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL, -- e.g. 09:00-10:00
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. ATTENDANCE LOGS
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- Present, Absent, Late, Excused
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    method VARCHAR(50) DEFAULT 'QR', -- QR, Biometric, RFID, Manual
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    device_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_session UNIQUE (student_id, session_id)
);

-- 8. TIMETABLE
CREATE TABLE IF NOT EXISTS timetable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL, -- Monday, Tuesday...
    time_slot VARCHAR(50) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    teacher_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    room VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. FEE STRUCTURES
CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL, -- Tuition, Hostel...
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    applicable_to VARCHAR(100) DEFAULT 'All', -- All, CSE, ECE...
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. FEE PAYMENTS
CREATE TABLE IF NOT EXISTS fee_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    method VARCHAR(50) NOT NULL, -- UPI, Card, Netbanking, Cash
    transaction_id VARCHAR(100) UNIQUE,
    status VARCHAR(30) DEFAULT 'Pending', -- Pending, Completed, Failed
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. FEE REMINDERS
CREATE TABLE IF NOT EXISTS fee_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    channel VARCHAR(30) DEFAULT 'WhatsApp' -- Push, WhatsApp, SMS, Email
);

-- 12. NOTICES
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Academic', -- Academic, Event, Holiday, Urgent
    target_audience VARCHAR(100) DEFAULT 'All', -- All, Staff, Students, HOD
    published_by UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 13. EXAMS
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL, -- Mid-Term, End-Sem
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type VARCHAR(50) DEFAULT 'Written', -- Written, Online, Lab
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. EXAM RESULTS
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(150) NOT NULL,
    marks_obtained DECIMAL(5, 2) NOT NULL,
    max_marks DECIMAL(5, 2) NOT NULL,
    grade VARCHAR(10),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_exam_subject UNIQUE (student_id, exam_id, subject)
);

-- 15. CANTEEN MENUS
CREATE TABLE IF NOT EXISTS canteen_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Snacks, Beverages, Meals
    price DECIMAL(8, 2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    allergens VARCHAR(255),
    calories INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. CANTEEN WALLETS
CREATE TABLE IF NOT EXISTS canteen_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. CANTEEN ORDERS
CREATE TABLE IF NOT EXISTS canteen_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    items JSONB NOT NULL, -- e.g. [{"menu_id": "...", "qty": 2}]
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'Received', -- Received, Preparing, Ready, Delivered
    order_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    pickup_time TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50) DEFAULT 'Wallet'
);

-- 18. MEAL SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS meal_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL, -- Breakfast, Lunch, Complete
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    meals_remaining INTEGER DEFAULT 30,
    amount_paid DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. HOSTEL BLOCKS
CREATE TABLE IF NOT EXISTS hostel_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL, -- Boys, Girls
    total_rooms INTEGER DEFAULT 0,
    warden_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. HOSTEL ROOMS
CREATE TABLE IF NOT EXISTS hostel_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    block_id UUID REFERENCES hostel_blocks(id) ON DELETE CASCADE,
    room_number VARCHAR(30) NOT NULL,
    capacity INTEGER NOT NULL,
    occupied INTEGER DEFAULT 0,
    amenities TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_room_per_block UNIQUE (block_id, room_number)
);

-- 21. HOSTEL ALLOCATIONS
CREATE TABLE IF NOT EXISTS hostel_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    room_id UUID REFERENCES hostel_rooms(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    allotted_date DATE NOT NULL,
    vacated_date DATE,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 22. HOSTEL COMPLAINTS
CREATE TABLE IF NOT EXISTS hostel_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    room_id UUID REFERENCES hostel_rooms(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- Plumbing, Electrical...
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'Open', -- Open, In Progress, Resolved
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 23. HOSTEL VISITORS
CREATE TABLE IF NOT EXISTS hostel_visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20) NOT NULL,
    purpose TEXT,
    in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    out_time TIMESTAMP WITH TIME ZONE,
    gate_pass_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 24. BOOKS
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    isbn VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    publisher VARCHAR(255),
    copies_total INTEGER DEFAULT 1,
    copies_available INTEGER DEFAULT 1,
    shelf_location VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 25. BOOK ISSUES
CREATE TABLE IF NOT EXISTS book_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    fine_amount DECIMAL(8, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'Issued', -- Issued, Returned, Overdue
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 26. STUDY ROOM BOOKINGS
CREATE TABLE IF NOT EXISTS study_room_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    room_number VARCHAR(30) NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(30) DEFAULT 'Booked', -- Booked, Checked-In, Cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 27. EVENTS
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- Cultural, Tech
    venue VARCHAR(150),
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    max_participants INTEGER,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    banner_url TEXT,
    status VARCHAR(30) DEFAULT 'Scheduled', -- Scheduled, Ongoing, Completed, Cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 28. EVENT REGISTRATIONS
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    ticket_number VARCHAR(100) UNIQUE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(30) DEFAULT 'Completed', -- Free/Completed/Pending
    attendance_marked BOOLEAN DEFAULT FALSE
);

-- 29. EVENT VOLUNTEERS
CREATE TABLE IF NOT EXISTS event_volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 30. EVENT SPONSORS
CREATE TABLE IF NOT EXISTS event_sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    sponsor_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2),
    tier VARCHAR(50) DEFAULT 'Bronze', -- Gold, Silver, Bronze
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 31. GYM SLOTS
CREATE TABLE IF NOT EXISTS gym_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER NOT NULL,
    trainer_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    booked_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 32. GYM BOOKINGS
CREATE TABLE IF NOT EXISTS gym_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES gym_slots(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    booking_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(30) DEFAULT 'Booked',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 33. GYM MEMBERSHIPS
CREATE TABLE IF NOT EXISTS gym_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL, -- Monthly, Quarterly, Annual
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 34. EQUIPMENT LOGS
CREATE TABLE IF NOT EXISTS equipment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    equipment_name VARCHAR(150) NOT NULL,
    condition VARCHAR(50) DEFAULT 'Good', -- Good, Repair, Scrapped
    last_serviced DATE,
    next_service DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 35. BUS ROUTES
CREATE TABLE IF NOT EXISTS bus_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    stops JSONB NOT NULL,
    schedule TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 36. BUSES
CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    route_id UUID REFERENCES bus_routes(id) ON DELETE SET NULL,
    device_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 37. BUS TRACKING
CREATE TABLE IF NOT EXISTS bus_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DECIMAL(5, 2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 38. TRANSPORT SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS transport_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    route_id UUID REFERENCES bus_routes(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 39. GATE LOGS
CREATE TABLE IF NOT EXISTS gate_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    person_id UUID REFERENCES users(id) ON DELETE CASCADE,
    person_type VARCHAR(50) NOT NULL, -- Student, Staff
    entry_type VARCHAR(20) NOT NULL, -- IN, OUT
    in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    out_time TIMESTAMP WITH TIME ZONE,
    method VARCHAR(50) DEFAULT 'RFID', -- Biometric, QR, RFID, Override
    gate_number VARCHAR(10)
);

-- 40. VISITOR LOGS
CREATE TABLE IF NOT EXISTS visitor_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    visitor_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    host_id UUID REFERENCES users(id) ON DELETE SET NULL,
    purpose TEXT,
    in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    out_time TIMESTAMP WITH TIME ZONE,
    photo_url TEXT,
    id_type VARCHAR(50) -- Aadhaar, PAN...
);

-- 41. SECURITY INCIDENTS
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    severity VARCHAR(30) DEFAULT 'Medium', -- Low, Medium, High
    status VARCHAR(30) DEFAULT 'Open', -- Open, Investigating, Resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 42. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'Info', -- Info, Alert, Billing
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 43. NOTIFICATION LOGS
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    channel VARCHAR(30) NOT NULL, -- FCM, WhatsApp, Email
    recipient VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'Sent', -- Sent, Failed
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 44. AI CONVERSATIONS
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    messages JSONB NOT NULL, -- e.g. [{"role": "user", "content": "..."}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 45. AI QUERY LOGS
CREATE TABLE IF NOT EXISTS ai_query_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    module VARCHAR(50),
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_institution ON students(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_institution ON staff(institution_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_timetable_dept ON timetable(department_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_hostel_rooms_block ON hostel_rooms(block_id);
CREATE INDEX IF NOT EXISTS idx_hostel_alloc_student ON hostel_allocations(student_id);
CREATE INDEX IF NOT EXISTS idx_book_issues_student ON book_issues(student_id);
CREATE INDEX IF NOT EXISTS idx_book_issues_book ON book_issues(book_id);
CREATE INDEX IF NOT EXISTS idx_bus_tracking_bus ON bus_tracking(bus_id);
CREATE INDEX IF NOT EXISTS idx_gate_logs_person ON gate_logs(person_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);


-- ==========================================================
-- SECTION 2: ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

-- Enable RLS on every table
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_query_logs ENABLE ROW LEVEL SECURITY;

-- Define tenant-isolation helper function (extracts institution_id from metadata)
CREATE OR REPLACE FUNCTION get_auth_institution_id()
RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt() -> 'user_metadata' ->> 'institution_id')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Define tenant-isolation role helper
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS VARCHAR AS $$
BEGIN
    RETURN auth.jwt() -> 'user_metadata' ->> 'role';
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Select Institutions
CREATE POLICY select_institutions ON institutions
    FOR SELECT USING (
        id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

CREATE POLICY all_superadmin_institutions ON institutions
    FOR ALL USING (
        get_auth_user_role() = 'SuperAdmin'
    );

-- Generic Tenant Isolation Policies
CREATE POLICY tenant_users_policy ON users FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_departments_policy ON departments FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_students_policy ON students FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_staff_policy ON staff FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_attendance_policy ON attendance FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_attendance_sessions_policy ON attendance_sessions FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_timetable_policy ON timetable FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_fee_structures_policy ON fee_structures FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_fee_payments_policy ON fee_payments FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_canteen_menus_policy ON canteen_menus FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_canteen_orders_policy ON canteen_orders FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_hostel_rooms_policy ON hostel_rooms FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_books_policy ON books FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_book_issues_policy ON book_issues FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_events_policy ON events FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_bus_routes_policy ON bus_routes FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_buses_policy ON buses FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE POLICY tenant_notifications_policy ON notifications FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

-- ==========================================================
-- SECTION 3: HARDENED RLS POLICIES (WARDEN, STUDENT, GUARD)
-- ==========================================================

-- Hostel Allocations Hardened Policy
DROP POLICY IF EXISTS tenant_hostel_allocations_policy ON hostel_allocations;
CREATE POLICY hostel_allocations_security_policy ON hostel_allocations
    FOR ALL TO authenticated
    USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        OR (
            get_auth_user_role() = 'Warden'
            AND EXISTS (
                SELECT 1 FROM hostel_rooms hr
                JOIN hostel_blocks hb ON hr.block_id = hb.id
                WHERE hr.id = hostel_allocations.room_id
                  AND hb.warden_id = (auth.jwt() ->> 'sub')::UUID
            )
        )
        OR (
            get_auth_user_role() = 'Student'
            AND student_id = (
                SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID
            )
        )
    );

-- Hostel Complaints Hardened Policy
DROP POLICY IF EXISTS tenant_hostel_complaints_policy ON hostel_complaints;
CREATE POLICY hostel_complaints_security_policy ON hostel_complaints
    FOR ALL TO authenticated
    USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        OR (
            get_auth_user_role() = 'Warden'
            AND (
                assigned_to = (auth.jwt() ->> 'sub')::UUID
                OR EXISTS (
                    SELECT 1 FROM hostel_rooms hr
                    JOIN hostel_blocks hb ON hr.block_id = hb.id
                    WHERE hr.id = hostel_complaints.room_id
                      AND hb.warden_id = (auth.jwt() ->> 'sub')::UUID
                )
            )
        )
        OR (
            get_auth_user_role() = 'Student'
            AND student_id = (
                SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID
            )
        )
    );

-- Gate Logs Hardened Policy
DROP POLICY IF EXISTS tenant_gate_logs_policy ON gate_logs;
CREATE POLICY gate_logs_security_policy ON gate_logs
    FOR ALL TO authenticated
    USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        OR (
            get_auth_user_role() = 'Security'
            AND institution_id = get_auth_institution_id()
        )
        OR (
            get_auth_user_role() IN ('Student', 'Staff')
            AND person_id = (auth.jwt() ->> 'sub')::UUID
        )
    );


-- ==========================================================
-- SECTION 4: ATOMIC TRANSACTION RPCs
-- ==========================================================

CREATE OR REPLACE FUNCTION allocate_room(
  p_institution_id UUID,
  p_room_id UUID,
  p_student_id UUID,
  p_date DATE
) RETURNS JSON AS $$
DECLARE
  v_allocation_id UUID;
  v_room_number VARCHAR;
  v_block_name VARCHAR;
BEGIN
  UPDATE hostel_rooms
    SET occupied = occupied + 1
    WHERE id = p_room_id
      AND occupied < capacity
      AND institution_id = p_institution_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Room is at full capacity or does not exist. Allocation denied.'
    );
  END IF;

  SELECT hr.room_number, hb.name INTO v_room_number, v_block_name
    FROM hostel_rooms hr
    JOIN hostel_blocks hb ON hr.block_id = hb.id
    WHERE hr.id = p_room_id;

  INSERT INTO hostel_allocations (institution_id, room_id, student_id, allotted_date, is_current)
    VALUES (p_institution_id, p_room_id, p_student_id, p_date, TRUE)
    RETURNING id INTO v_allocation_id;

  RETURN json_build_object(
    'success', true,
    'allocation_id', v_allocation_id,
    'room_number', v_room_number,
    'block_name', v_block_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- issue_book_atomic
CREATE OR REPLACE FUNCTION issue_book_atomic(
  p_institution_id UUID,
  p_book_id UUID,
  p_student_id UUID,
  p_issue_date DATE,
  p_due_date DATE
) RETURNS JSON AS $$
DECLARE
  v_issue_id UUID;
  v_title VARCHAR;
  v_copies_remaining INTEGER;
BEGIN
  UPDATE books
    SET copies_available = copies_available - 1
    WHERE id = p_book_id
      AND copies_available > 0
      AND institution_id = p_institution_id
    RETURNING copies_available, title INTO v_copies_remaining, v_title;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No copies available or book not found in catalogue.'
    );
  END IF;

  INSERT INTO book_issues (institution_id, book_id, student_id, issue_date, due_date, status)
    VALUES (p_institution_id, p_book_id, p_student_id, p_issue_date, p_due_date, 'Issued')
    RETURNING id INTO v_issue_id;

  RETURN json_build_object(
    'success', true,
    'issue_id', v_issue_id,
    'book_title', v_title,
    'copies_remaining', v_copies_remaining
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- return_book_atomic
CREATE OR REPLACE FUNCTION return_book_atomic(
  p_issue_id UUID,
  p_return_date DATE
) RETURNS JSON AS $$
DECLARE
  v_issue RECORD;
  v_fine DECIMAL(8,2) := 0;
  v_days_late INTEGER;
  v_book_title VARCHAR;
BEGIN
  SELECT bi.*, b.title INTO v_issue
    FROM book_issues bi
    JOIN books b ON bi.book_id = b.id
    WHERE bi.id = p_issue_id
    FOR UPDATE OF bi;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Book issue record not found.'
    );
  END IF;

  IF v_issue.status = 'Returned' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Book has already been returned.'
    );
  END IF;

  v_days_late := GREATEST(0, p_return_date - v_issue.due_date);
  v_fine := v_days_late * 5.00;

  UPDATE book_issues
    SET return_date = p_return_date,
        fine_amount = v_fine,
        status = 'Returned'
    WHERE id = p_issue_id;

  UPDATE books
    SET copies_available = copies_available + 1
    WHERE id = v_issue.book_id;

  RETURN json_build_object(
    'success', true,
    'issue_id', p_issue_id,
    'book_title', v_issue.title,
    'fine_amount', v_fine,
    'days_late', v_days_late
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- book_gym_slot_atomic
CREATE OR REPLACE FUNCTION book_gym_slot_atomic(
  p_institution_id UUID,
  p_slot_id UUID,
  p_student_id UUID
) RETURNS JSON AS $$
DECLARE
  v_booking_id UUID;
  v_slot_date DATE;
  v_start_time TIME;
  v_end_time TIME;
BEGIN
  UPDATE gym_slots
    SET booked_count = booked_count + 1
    WHERE id = p_slot_id
      AND booked_count < capacity
      AND institution_id = p_institution_id
    RETURNING date, start_time, end_time INTO v_slot_date, v_start_time, v_end_time;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Gym slot is fully booked or does not exist.'
    );
  END IF;

  INSERT INTO gym_bookings (institution_id, slot_id, student_id, booking_date, status)
    VALUES (p_institution_id, p_slot_id, p_student_id, CURRENT_DATE, 'Booked')
    RETURNING id INTO v_booking_id;

  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'slot_date', v_slot_date,
    'start_time', v_start_time,
    'end_time', v_end_time
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- cancel_gym_booking_atomic
CREATE OR REPLACE FUNCTION cancel_gym_booking_atomic(
  p_booking_id UUID
) RETURNS JSON AS $$
DECLARE
  v_slot_id UUID;
BEGIN
  SELECT slot_id INTO v_slot_id
    FROM gym_bookings
    WHERE id = p_booking_id AND status = 'Booked'
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found or already cancelled.'
    );
  END IF;

  UPDATE gym_bookings SET status = 'Cancelled' WHERE id = p_booking_id;

  UPDATE gym_slots
    SET booked_count = GREATEST(0, booked_count - 1)
    WHERE id = v_slot_id;

  RETURN json_build_object('success', true, 'message', 'Booking cancelled successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================================
-- SECTION 5: SEED DATA INSERTION
-- ==========================================================

-- Truncate existing tables to start fresh
TRUNCATE TABLE ai_query_logs, ai_conversations, notification_logs, notifications, 
               security_incidents, visitor_logs, gate_logs, transport_subscriptions, 
               bus_tracking, buses, bus_routes, equipment_logs, gym_memberships, 
               gym_bookings, gym_slots, event_sponsors, event_volunteers, 
               event_registrations, events, study_room_bookings, book_issues, books, 
               hostel_complaints, hostel_allocations, hostel_rooms, hostel_blocks, 
               meal_subscriptions, canteen_orders, canteen_wallets, canteen_menus, 
               exam_results, exams, notices, fee_reminders, fee_payments, 
               fee_structures, timetable, attendance, attendance_sessions, staff, 
               students, departments, users, institutions CASCADE;

-- 1. INSTITUTIONS
INSERT INTO institutions (id, name, type, address, city, state, phone, email, logo_url, plan_tier, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'SIN Institute of Engineering & Technology (SIET)',
    'university',
    'Mogra, NH-65, Pali Road',
    'Jodhpur',
    'Rajasthan',
    '+912912760000',
    'info@siet.edu.in',
    'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?q=80&w=200&auto=format&fit=crop',
    'University',
    TRUE
);

-- 2. USERS
INSERT INTO users (id, institution_id, role, name, email, phone, employee_id, is_active) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'SuperAdmin', 'Siddharth Singh', 'siddharth@sin.education', '+919876543210', 'SIN-SA-001', TRUE),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Admin', 'Dr. K. R. Sharma', 'director@siet.edu.in', '+919876543211', 'SIET-DIR-002', TRUE),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Staff', 'Prof. Alok Vyas', 'alok.vyas@siet.edu.in', '+919876543212', 'SIET-CSE-003', TRUE),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Staff', 'Dr. Preeti Choudhary', 'preeti.c@siet.edu.in', '+919876543213', 'SIET-ECE-004', TRUE),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Staff', 'Coach Amit Rathi', 'amit.rathi@siet.edu.in', '+919876543214', 'SIET-GYM-005', TRUE),
('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Student', 'Khushal Gehlot', 'khushal@gmail.com', '+919999988888', NULL, TRUE),
('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Student', 'Aarav Mehta', 'aarav.mehta@siet.edu.in', '+919999988887', NULL, TRUE),
('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Student', 'Aditi Bhati', 'aditi.b@siet.edu.in', '+919999988886', NULL, TRUE),
('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Student', 'Rahul Sen', 'rahul.sen@siet.edu.in', '+919999988885', NULL, TRUE),
('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Student', 'Sneha Goyal', 'sneha.g@siet.edu.in', '+919999988884', NULL, TRUE),
('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Parent', 'Mr. Madanlal Gehlot', 'madanlal@gmail.com', '+919829012345', NULL, TRUE),
('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Warden', 'Jaswant Singh', 'warden@siet.edu.in', '+919829012346', 'SIET-WDN-012', TRUE),
('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Driver', 'Rajesh Kumar', 'rajesh.driver@siet.edu.in', '+919829012347', 'SIET-DVR-013', TRUE),
('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'Vendor', 'Ramesh Canteen Wale', 'canteen@siet.edu.in', '+919829012348', 'SIET-VND-014', TRUE),
('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'Security', 'Guard Sher Singh', 'security@siet.edu.in', '+919829012349', 'SIET-SEC-015', TRUE);

-- Update profile avatars
UPDATE users SET avatar_url = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop' WHERE id = 'b0000000-0000-0000-0000-000000000006';

-- 3. DEPARTMENTS
INSERT INTO departments (id, institution_id, name, head_id) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Computer Science & Engineering', 'b0000000-0000-0000-0000-000000000003'),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Electronics & Communication Engineering', 'b0000000-0000-0000-0000-000000000004'),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Mechanical Engineering', NULL);

-- 4. STUDENTS
INSERT INTO students (id, user_id, institution_id, roll_number, department_id, semester, batch_year, dob, gender, blood_group, guardian_name, guardian_phone, address) VALUES
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '23CSE051', 'd0000000-0000-0000-0000-000000000001', 4, '2022-2026', '2004-05-15', 'Male', 'O+', 'Mr. Madanlal Gehlot', '+919829012345', 'Sardarpura 4th Road, Jodhpur'),
('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', '23CSE052', 'd0000000-0000-0000-0000-000000000001', 4, '2022-2026', '2004-09-20', 'Male', 'A+', 'Suresh Mehta', '+919990001112', 'Shastri Nagar, Jodhpur'),
('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', '23ECE012', 'd0000000-0000-0000-0000-000000000002', 4, '2022-2026', '2005-01-08', 'Female', 'B+', 'Prakash Bhati', '+919990001113', 'Mandore Road, Jodhpur'),
('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', '23ME005', 'd0000000-0000-0000-0000-000000000003', 4, '2022-2026', '2004-12-11', 'Male', 'AB+', 'Rajendra Sen', '+919990001114', 'Basni, Jodhpur'),
('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', '23CSE015', 'd0000000-0000-0000-0000-000000000001', 4, '2022-2026', '2005-03-30', 'Female', 'O-', 'Kishore Goyal', '+919990001115', 'Paota, Jodhpur');

-- 5. STAFF
INSERT INTO staff (id, user_id, institution_id, department_id, designation, joining_date, salary, qualification) VALUES
('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Professor & HOD', '2015-07-01', 120000.00, 'Ph.D. in Computer Science & Engineering'),
('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Associate Professor & HOD', '2018-01-10', 95000.00, 'Ph.D. in VLSI Systems'),
('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', NULL, 'Fitness Trainer & Gym Incharge', '2021-08-20', 45000.00, 'Master of Physical Education (M.P.Ed)');

-- 6. ATTENDANCE SESSIONS
INSERT INTO attendance_sessions (id, institution_id, department_id, subject, date, time_slot, marked_by) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Database Management Systems', CURRENT_DATE, '09:00 - 10:00', 'b0000000-0000-0000-0000-000000000003'),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Compiler Design', CURRENT_DATE, '10:15 - 11:15', 'b0000000-0000-0000-0000-000000000003');

-- 7. ATTENDANCE LOGS
INSERT INTO attendance (institution_id, student_id, session_id, date, status, marked_by, method) VALUES
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000001', CURRENT_DATE, 'Present', 'b0000000-0000-0000-0000-000000000003', 'QR'),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000001', CURRENT_DATE, 'Present', 'b0000000-0000-0000-0000-000000000003', 'QR'),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000001', CURRENT_DATE, 'Absent', 'b0000000-0000-0000-0000-000000000003', 'Manual'),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000002', CURRENT_DATE, 'Present', 'b0000000-0000-0000-0000-000000000003', 'QR'),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000002', CURRENT_DATE, 'Present', 'b0000000-0000-0000-0000-000000000003', 'QR'),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000002', CURRENT_DATE, 'Present', 'b0000000-0000-0000-0000-000000000003', 'QR');

-- 8. TIMETABLE
INSERT INTO timetable (institution_id, department_id, day_of_week, time_slot, subject, teacher_id, room) VALUES
('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Monday', '09:00 - 10:00', 'Database Management Systems', 'd0000000-0000-0000-0000-000000000003', 'L-301'),
('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Monday', '10:15 - 11:15', 'Compiler Design', 'd0000000-0000-0000-0000-000000000003', 'L-301'),
('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Monday', '11:30 - 12:30', 'Computer Networks', 'd0000000-0000-0000-0000-000000000004', 'Lab-2');

-- 9. FEE STRUCTURES
INSERT INTO fee_structures (id, institution_id, name, amount, due_date, applicable_to) VALUES
('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Academic Tuition Fee - Sem 4', 65000.00, CURRENT_DATE + INTERVAL '30 days', 'All'),
('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Hostel Room & Mess Charges', 45000.00, CURRENT_DATE - INTERVAL '5 days', 'All');

-- 10. FEE PAYMENTS
INSERT INTO fee_payments (institution_id, student_id, fee_structure_id, amount_paid, payment_date, method, transaction_id, status) VALUES
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000001', 65000.00, CURRENT_DATE - INTERVAL '15 days', 'UPI', 'TXN_UPI_987654321', 'Completed');

-- 12. NOTICES
INSERT INTO notices (institution_id, title, content, category, target_audience, published_by) VALUES
('a0000000-0000-0000-0000-000000000001', 'Internal Assessment Schedules', 'The first internal test series for Semester 4 will commence from Monday next week. Attendance is mandatory.', 'Academic', 'Students', 'b0000000-0000-0000-0000-000000000002');

-- 15. CANTEEN MENUS
INSERT INTO canteen_menus (id, institution_id, item_name, category, price, is_available, allergens, calories) VALUES
('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Paneer Butter Masala Combo', 'Meals', 120.00, TRUE, 'Dairy, Gluten', 580),
('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Veg Hakka Noodles', 'Meals', 80.00, TRUE, 'Soya, Gluten', 420),
('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Cold Coffee Brew', 'Beverages', 50.00, TRUE, 'Dairy', 220);

-- 16. CANTEEN WALLETS
INSERT INTO canteen_wallets (institution_id, student_id, balance) VALUES
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 450.00),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 120.00);

-- 17. CANTEEN ORDERS
INSERT INTO canteen_orders (institution_id, student_id, items, total_amount, status, payment_method) VALUES
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', '[{"menu_id": "10000000-0000-0000-0000-000000000001", "qty": 1}, {"menu_id": "10000000-0000-0000-0000-000000000003", "qty": 1}]'::jsonb, 170.00, 'Delivered', 'Wallet');

-- 19. HOSTEL BLOCKS
INSERT INTO hostel_blocks (id, institution_id, name, type, total_rooms, warden_id) VALUES
('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ramanujan Hostel (Boys Block A)', 'Boys', 5, 'b0000000-0000-0000-0000-000000000012');

-- 20. HOSTEL ROOMS
INSERT INTO hostel_rooms (id, institution_id, block_id, room_number, capacity, occupied, amenities) VALUES
('50000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'A-101', 2, 1, 'AC, Double Bed, Study Table, Attached Bathroom'),
('50000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'A-102', 2, 1, 'Non-AC, Double Bed, Study Table, Attached Balcony');

-- 21. HOSTEL ALLOCATIONS
INSERT INTO hostel_allocations (institution_id, room_id, student_id, allotted_date, is_current) VALUES
('a0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', '2023-07-15', TRUE),
('a0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000007', '2023-07-15', TRUE);

-- 22. HOSTEL COMPLAINTS
INSERT INTO hostel_complaints (institution_id, student_id, room_id, category, description, status) VALUES
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000001', 'Electrical', 'Ceiling fan making clicking sound on speed 4', 'Open');

-- 24. BOOKS
INSERT INTO books (id, institution_id, isbn, title, author, category, publisher, copies_total, copies_available, shelf_location) VALUES
('30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '978-0131103628', 'The C Programming Language', 'Brian W. Kernighan, Dennis M. Ritchie', 'Computer Science', 'Prentice Hall', 5, 4, 'CS-A1-S3'),
('30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '978-0136086208', 'Artificial Intelligence: A Modern Approach', 'Stuart Russell, Peter Norvig', 'Artificial Intelligence', 'Pearson', 4, 4, 'AI-B2-S1'),
('30000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '978-0262033848', 'Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson', 'Computer Science', 'MIT Press', 8, 8, 'CS-A1-S1'),
('30000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '978-0321125217', 'Domain-Driven Design', 'Eric Evans', 'Software Engineering', 'Addison-Wesley', 3, 3, 'SE-C3-S2'),
('30000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '978-0132350884', 'Clean Code', 'Robert C. Martin', 'Software Engineering', 'Prentice Hall', 6, 5, 'SE-C3-S1'),
('30000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '978-0131429017', 'Compilers: Principles, Techniques, and Tools', 'Alfred V. Aho, Monica S. Lam', 'Computer Science', 'Addison-Wesley', 5, 5, 'CS-A2-S4'),
('30000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', '978-0130384744', 'Database System Concepts', 'Abraham Silberschatz, Henry Korth', 'Database Systems', 'McGraw-Hill', 7, 7, 'DB-D1-S1'),
('30000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', '978-1492056300', 'Designing Data-Intensive Applications', 'Martin Kleppmann', 'Computer Science', 'O''Reilly Media', 4, 4, 'CS-A1-S2'),
('30000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', '978-0596007126', 'Head First Design Patterns', 'Eric Freeman, Elisabeth Robson', 'Software Engineering', 'O''Reilly Media', 5, 5, 'SE-C3-S3'),
('30000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', '978-0134092669', 'Computer Networking: A Top-Down Approach', 'James Kurose, Keith Ross', 'Computer Science', 'Pearson', 6, 6, 'CS-A3-S1');

-- 25. BOOK ISSUES
INSERT INTO book_issues (id, institution_id, book_id, student_id, issue_date, due_date, status) VALUES
('40000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '6 days', 'Issued'),
('40000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '12 days', 'Issued');

-- 27. EVENTS
INSERT INTO events (id, institution_id, title, description, category, venue, start_datetime, end_datetime, max_participants, created_by, status) VALUES
('90000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'SIN Hackathon Jodhpur 2026', 'A 36-hour regional level hackathon to solve problems in edtech, healthtech, and logistics.', 'Tech', 'Seminar Hall B, SIET', CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '3 days', 150, 'b0000000-0000-0000-0000-000000000002', 'Scheduled'),
('90000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Spandan 2026 - Cultural Festival', 'The annual mega cultural event of Jodhpur.', 'Cultural', 'Main Open Air Auditorium', CURRENT_TIMESTAMP + INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '12 days', 1000, 'b0000000-0000-0000-0000-000000000002', 'Scheduled');

-- 28. EVENT REGISTRATIONS
INSERT INTO event_registrations (institution_id, event_id, student_id, ticket_number, payment_status) VALUES
('a0000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'TKT-SIN-HACK-8891', 'Completed');

-- 31. GYM SLOTS
INSERT INTO gym_slots (id, institution_id, date, start_time, end_time, capacity, trainer_id, booked_count) VALUES
('60000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '1 day', '06:00:00', '07:00:00', 20, 'd0000000-0000-0000-0000-000000000005', 1),
('60000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '1 day', '07:15:00', '08:15:00', 20, 'd0000000-0000-0000-0000-000000000005', 0),
('60000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '1 day', '17:00:00', '18:00:00', 25, 'd0000000-0000-0000-0000-000000000005', 2),
('60000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '1 day', '18:15:00', '19:15:00', 25, 'd0000000-0000-0000-0000-000000000005', 0);

-- 33. GYM MEMBERSHIPS
INSERT INTO gym_memberships (institution_id, student_id, plan, start_date, end_date, amount_paid, status) VALUES
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'Quarterly', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '80 days', 3500.00, 'Active');

-- 32. GYM BOOKINGS
INSERT INTO gym_bookings (institution_id, slot_id, student_id, booking_date, status) VALUES
('a0000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', CURRENT_DATE + INTERVAL '1 day', 'Booked');

-- 34. EQUIPMENT LOGS
INSERT INTO equipment_logs (institution_id, equipment_name, condition, last_serviced, next_service) VALUES
('a0000000-0000-0000-0000-000000000001', 'Aerobic Treadmill MT-900', 'Good', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '40 days'),
('a0000000-0000-0000-0000-000000000001', 'Rowing Machine R2', 'Repair', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE - INTERVAL '5 days');

-- 35. BUS ROUTES
INSERT INTO bus_routes (id, institution_id, name, stops, schedule) VALUES
('70000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Route A: Sardarpura - Chopasni - SIET Campus', '[{"name": "Sardarpura Gol Building", "time": "07:30 AM"}, {"name": "Chopasni Housing Board", "time": "07:55 AM"}, {"name": "Dhanasni Crossing", "time": "08:15 AM"}, {"name": "SIET Main Gate", "time": "08:35 AM"}]'::jsonb, 'Daily: Mon to Sat'),
('70000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Route B: Paota - Circuit House - Ratanada - SIET Campus', '[{"name": "Paota Circle", "time": "07:40 AM"}, {"name": "Circuit House Choraha", "time": "07:50 AM"}, {"name": "Ratanada Shiv Temple", "time": "08:05 AM"}, {"name": "SIET Main Gate", "time": "08:35 AM"}]'::jsonb, 'Daily: Mon to Sat');

-- 36. BUSES
INSERT INTO buses (id, institution_id, vehicle_number, capacity, driver_id, route_id, device_id) VALUES
('80000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'RJ19-PA-1024', 42, 'b0000000-0000-0000-0000-000000000013', '70000000-0000-0000-0000-000000000001', 'GPS-RJ19-PA-1024');

-- 37. BUS TRACKING
INSERT INTO bus_tracking (institution_id, bus_id, latitude, longitude, speed) VALUES
('a0000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 26.2908, 73.0243, 45.50);

-- 38. TRANSPORT SUBSCRIPTIONS
INSERT INTO transport_subscriptions (institution_id, student_id, route_id, start_date, end_date, amount_paid) VALUES
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '170 days', 12000.00);

-- 39. GATE LOGS
INSERT INTO gate_logs (institution_id, person_id, person_type, entry_type, in_time, out_time, method, gate_number) VALUES
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'Student', 'IN', CURRENT_TIMESTAMP - INTERVAL '90 minutes', NULL, 'RFID', 'Gate 1');

-- 42. NOTIFICATIONS
INSERT INTO notifications (institution_id, user_id, title, body, type, is_read) VALUES
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'Hostel Gate Pass Approved', 'Your gate pass for visiting local market on Saturday has been approved by the Warden.', 'Info', FALSE),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'Library Fine Pending', 'You have an overdue library book "The C Programming Language" which has accrued standard fines of 5 INR/day.', 'Alert', FALSE);
