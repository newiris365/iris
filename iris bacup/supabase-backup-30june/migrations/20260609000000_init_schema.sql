-- IRIS 365 Core Database Schema Migration
-- Target: Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. INSTITUTIONS
CREATE TABLE institutions (
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
CREATE TABLE users (
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
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    head_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. STUDENTS
CREATE TABLE students (
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
CREATE TABLE staff (
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
CREATE TABLE attendance_sessions (
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
CREATE TABLE attendance (
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
CREATE TABLE timetable (
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
CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL, -- Tuition, Hostel...
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    applicable_to VARCHAR(100) DEFAULT 'All', -- All, CSE, ECE...
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. FEE PAYMENTS
CREATE TABLE fee_payments (
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
CREATE TABLE fee_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    channel VARCHAR(30) DEFAULT 'WhatsApp' -- Push, WhatsApp, SMS, Email
);

-- 12. NOTICES
CREATE TABLE notices (
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
CREATE TABLE exams (
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
CREATE TABLE exam_results (
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
CREATE TABLE canteen_menus (
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
CREATE TABLE canteen_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. CANTEEN ORDERS
CREATE TABLE canteen_orders (
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
CREATE TABLE meal_subscriptions (
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
CREATE TABLE hostel_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL, -- Boys, Girls
    total_rooms INTEGER DEFAULT 0,
    warden_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. HOSTEL ROOMS
CREATE TABLE hostel_rooms (
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
CREATE TABLE hostel_allocations (
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
CREATE TABLE hostel_complaints (
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
CREATE TABLE hostel_visitors (
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
CREATE TABLE books (
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
CREATE TABLE book_issues (
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
CREATE TABLE study_room_bookings (
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
CREATE TABLE events (
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
CREATE TABLE event_registrations (
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
CREATE TABLE event_volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 30. EVENT SPONSORS
CREATE TABLE event_sponsors (
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
CREATE TABLE gym_slots (
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
CREATE TABLE gym_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES gym_slots(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    booking_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(30) DEFAULT 'Booked',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 33. GYM MEMBERSHIPS
CREATE TABLE gym_memberships (
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
CREATE TABLE equipment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    equipment_name VARCHAR(150) NOT NULL,
    condition VARCHAR(50) DEFAULT 'Good', -- Good, Repair, Scrapped
    last_serviced DATE,
    next_service DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 35. BUS ROUTES
CREATE TABLE bus_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    stops JSONB NOT NULL,
    schedule TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 36. BUSES
CREATE TABLE buses (
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
CREATE TABLE bus_tracking (
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
CREATE TABLE transport_subscriptions (
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
CREATE TABLE gate_logs (
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
CREATE TABLE visitor_logs (
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
CREATE TABLE security_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    severity VARCHAR(30) DEFAULT 'Medium', -- Low, Medium, High
    status VARCHAR(30) DEFAULT 'Open', -- Open, Investigating, Resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 42. NOTIFICATIONS
CREATE TABLE notifications (
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
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    channel VARCHAR(30) NOT NULL, -- FCM, WhatsApp, Email
    recipient VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'Sent', -- Sent, Failed
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 44. AI CONVERSATIONS
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    messages JSONB NOT NULL, -- e.g. [{"role": "user", "content": "..."}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 45. AI QUERY LOGS
CREATE TABLE ai_query_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    module VARCHAR(50),
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==========================================
CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_students_institution ON students(institution_id);
CREATE INDEX idx_students_dept ON students(department_id);
CREATE INDEX idx_staff_institution ON staff(institution_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_timetable_dept ON timetable(department_id);
CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_hostel_rooms_block ON hostel_rooms(block_id);
CREATE INDEX idx_hostel_alloc_student ON hostel_allocations(student_id);
CREATE INDEX idx_book_issues_student ON book_issues(student_id);
CREATE INDEX idx_book_issues_book ON book_issues(book_id);
CREATE INDEX idx_bus_tracking_bus ON bus_tracking(bus_id);
CREATE INDEX idx_gate_logs_person ON gate_logs(person_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

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


-- CREATE MULTI-TENANT RLS POLICIES FOR EVERY TABLE (Example for core tables)

-- POLICY FOR: institutions
CREATE POLICY select_institutions ON institutions
    FOR SELECT USING (
        id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

CREATE POLICY all_superadmin_institutions ON institutions
    FOR ALL USING (
        get_auth_user_role() = 'SuperAdmin'
    );

-- MACRO/GENERIC PATTERNS FOR OTHER TABLES (All filter on institution_id)
-- We will write a reusable policy generator or define individual policies explicitly.

-- RLS for table: users
CREATE POLICY tenant_users_policy ON users
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: departments
CREATE POLICY tenant_departments_policy ON departments
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: students
CREATE POLICY tenant_students_policy ON students
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: staff
CREATE POLICY tenant_staff_policy ON staff
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: attendance
CREATE POLICY tenant_attendance_policy ON attendance
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: attendance_sessions
CREATE POLICY tenant_attendance_sessions_policy ON attendance_sessions
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: timetable
CREATE POLICY tenant_timetable_policy ON timetable
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: fee_structures
CREATE POLICY tenant_fee_structures_policy ON fee_structures
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: fee_payments
CREATE POLICY tenant_fee_payments_policy ON fee_payments
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: canteen_menus
CREATE POLICY tenant_canteen_menus_policy ON canteen_menus
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: canteen_orders
CREATE POLICY tenant_canteen_orders_policy ON canteen_orders
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: hostel_rooms
CREATE POLICY tenant_hostel_rooms_policy ON hostel_rooms
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: hostel_allocations
CREATE POLICY tenant_hostel_allocations_policy ON hostel_allocations
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: books
CREATE POLICY tenant_books_policy ON books
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: book_issues
CREATE POLICY tenant_book_issues_policy ON book_issues
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: events
CREATE POLICY tenant_events_policy ON events
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: bus_routes
CREATE POLICY tenant_bus_routes_policy ON bus_routes
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: buses
CREATE POLICY tenant_buses_policy ON buses
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: gate_logs
CREATE POLICY tenant_gate_logs_policy ON gate_logs
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

-- RLS for table: notifications
CREATE POLICY tenant_notifications_policy ON notifications
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );
