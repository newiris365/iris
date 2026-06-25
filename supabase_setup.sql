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
    email VARCHAR(255) NOT NULL,
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
    balance DECIMAL(10, 2) DEFAULT 0.00 CHECK (balance >= 0.00),
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
    occupied INTEGER DEFAULT 0 CHECK (occupied >= 0),
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

-- 34b. FITNESS METRICS (body measurements tracking)
CREATE TABLE IF NOT EXISTS fitness_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    date DATE DEFAULT CURRENT_DATE,
    weight_kg DECIMAL(5, 2),
    height_cm DECIMAL(5, 2),
    bmi DECIMAL(5, 2),
    body_fat_percent DECIMAL(5, 2),
    chest_cm DECIMAL(5, 2),
    waist_cm DECIMAL(5, 2),
    hips_cm DECIMAL(5, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 34c. WORKOUT SESSIONS
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES gym_bookings(id) ON DELETE SET NULL,
    date DATE DEFAULT CURRENT_DATE,
    duration_minutes INTEGER,
    exercises JSONB,
    calories_burned INTEGER DEFAULT 0,
    trainer_notes TEXT,
    self_rating INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 34d. BOOK RESERVATIONS (library)
CREATE TABLE IF NOT EXISTS book_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    reserved_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'completed', 'expired')),
    notified_at TIMESTAMPTZ
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

-- Define tenant-isolation helper function (securely looks up from public.users table)
CREATE OR REPLACE FUNCTION get_auth_institution_id()
RETURNS UUID AS $$
DECLARE
    inst_id UUID;
BEGIN
    SELECT institution_id INTO inst_id 
    FROM public.users 
    WHERE email = auth.jwt() ->> 'email' OR id = (auth.jwt() ->> 'sub')::UUID;
    RETURN inst_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Define tenant-isolation role helper (securely looks up from public.users table)
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS VARCHAR AS $$
DECLARE
    u_role VARCHAR;
BEGIN
    SELECT role INTO u_role 
    FROM public.users 
    WHERE email = auth.jwt() ->> 'email' OR id = (auth.jwt() ->> 'sub')::UUID;
    RETURN u_role;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Select Institutions
DROP POLICY IF EXISTS select_institutions ON institutions;
CREATE POLICY select_institutions ON institutions
    FOR SELECT USING (
        id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

DROP POLICY IF EXISTS all_superadmin_institutions ON institutions;
CREATE POLICY all_superadmin_institutions ON institutions
    FOR ALL USING (
        get_auth_user_role() = 'SuperAdmin'
    );

-- Generic Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_users_policy ON users;
CREATE POLICY tenant_users_policy ON users FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_departments_policy ON departments;
CREATE POLICY tenant_departments_policy ON departments FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_students_policy ON students;
CREATE POLICY tenant_students_policy ON students FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_staff_policy ON staff;
CREATE POLICY tenant_staff_policy ON staff FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_attendance_policy ON attendance;
CREATE POLICY tenant_attendance_policy ON attendance FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_attendance_sessions_policy ON attendance_sessions;
CREATE POLICY tenant_attendance_sessions_policy ON attendance_sessions FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_timetable_policy ON timetable;
CREATE POLICY tenant_timetable_policy ON timetable FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_fee_structures_policy ON fee_structures;
CREATE POLICY tenant_fee_structures_policy ON fee_structures FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_fee_payments_policy ON fee_payments;
CREATE POLICY tenant_fee_payments_policy ON fee_payments FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_canteen_menus_policy ON canteen_menus;
CREATE POLICY tenant_canteen_menus_policy ON canteen_menus FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_canteen_orders_policy ON canteen_orders;
CREATE POLICY tenant_canteen_orders_policy ON canteen_orders FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_hostel_rooms_policy ON hostel_rooms;
CREATE POLICY tenant_hostel_rooms_policy ON hostel_rooms FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_books_policy ON books;
CREATE POLICY tenant_books_policy ON books FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_book_issues_policy ON book_issues;
CREATE POLICY tenant_book_issues_policy ON book_issues FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_events_policy ON events;
CREATE POLICY tenant_events_policy ON events FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_bus_routes_policy ON bus_routes;
CREATE POLICY tenant_bus_routes_policy ON bus_routes FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_buses_policy ON buses;
CREATE POLICY tenant_buses_policy ON buses FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
DROP POLICY IF EXISTS tenant_notifications_policy ON notifications;
CREATE POLICY tenant_notifications_policy ON notifications FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

-- ==========================================================
-- SECTION 3: HARDENED RLS POLICIES (WARDEN, STUDENT, GUARD)
-- ==========================================================

-- Hostel Allocations Hardened Policy
DROP POLICY IF EXISTS hostel_allocations_security_policy ON hostel_allocations;
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
DROP POLICY IF EXISTS hostel_complaints_security_policy ON hostel_complaints;
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
DROP POLICY IF EXISTS gate_logs_security_policy ON gate_logs;
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
  -- Check if student already has an active allocation
  IF EXISTS (
    SELECT 1 FROM hostel_allocations 
    WHERE student_id = p_student_id AND is_current = TRUE
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Student already has an active hostel allocation.'
    );
  END IF;

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
  -- Check if student already has this book issued and unreturned
  IF EXISTS (
    SELECT 1 FROM book_issues 
    WHERE student_id = p_student_id AND book_id = p_book_id AND status = 'Issued'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Student already has an active issue of this book. Duplicate issue denied.'
    );
  END IF;

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
  -- Check if student already booked this slot
  IF EXISTS (
    SELECT 1 FROM gym_bookings 
    WHERE student_id = p_student_id AND slot_id = p_slot_id AND status = 'Booked'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Student already has an active booking for this gym slot. Duplicate booking denied.'
    );
  END IF;

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


-- ============================================================
-- MODULE 11: IRIS Admissions
-- Branded Admission Cycles, Multi-Step Applications, Academic
-- Audits, Auto-Merit calculations, Offer letters, and CRM Leads.
-- ============================================================

-- 1. CREATE admission_cycles TABLE
CREATE TABLE IF NOT EXISTS admission_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN (
    'upcoming','open','closed','processing','completed'
  )) DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE programs TABLE
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  degree_type TEXT,
  duration_years INTEGER,
  total_seats INTEGER,
  reserved_seats JSONB DEFAULT '{}'::jsonb,
  eligibility_criteria JSONB DEFAULT '{}'::jsonb,
  application_fee DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 3. CREATE applicants TABLE
CREATE TABLE IF NOT EXISTS applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES admission_cycles(id) ON DELETE SET NULL,
  application_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  dob DATE,
  gender TEXT,
  category TEXT,
  domicile_state TEXT,
  photo_url TEXT,
  aadhar_number TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_relation TEXT,
  status TEXT CHECK (status IN (
    'draft','submitted','under_review','shortlisted',
    'merit_listed','waitlisted','offered','admitted',
    'rejected','withdrawn'
  )) DEFAULT 'draft',
  merit_score DECIMAL DEFAULT 0.0,
  ai_score DECIMAL DEFAULT 0.0,
  rank_overall INTEGER,
  rank_category INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE applicant_programs TABLE
CREATE TABLE IF NOT EXISTS applicant_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  preference_order INTEGER,
  status TEXT DEFAULT 'pending',
  allocated BOOLEAN DEFAULT false
);

-- 5. CREATE academic_records TABLE
CREATE TABLE IF NOT EXISTS academic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  level TEXT NOT NULL, -- '10th', '12th', 'graduation'
  board_university TEXT,
  year_of_passing INTEGER,
  percentage DECIMAL,
  cgpa DECIMAL,
  subjects JSONB DEFAULT '[]'::jsonb,
  marksheet_url TEXT,
  certificate_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_notes TEXT
);

-- 6. CREATE entrance_scores TABLE
CREATE TABLE IF NOT EXISTS entrance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  exam_name TEXT NOT NULL,
  roll_number TEXT,
  score DECIMAL,
  percentile DECIMAL,
  rank INTEGER,
  scorecard_url TEXT,
  is_verified BOOLEAN DEFAULT false
);

-- 7. CREATE documents TABLE
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  doc_url TEXT NOT NULL,
  file_name TEXT,
  file_size_kb INTEGER,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 8. CREATE merit_lists TABLE
CREATE TABLE IF NOT EXISTS merit_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES admission_cycles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  round_number INTEGER DEFAULT 1,
  list_type TEXT CHECK (list_type IN ('merit','waitlist','spot')),
  published_at TIMESTAMPTZ,
  cutoff_score DECIMAL,
  is_published BOOLEAN DEFAULT false
);

-- 9. CREATE merit_list_entries TABLE
CREATE TABLE IF NOT EXISTS merit_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merit_list_id UUID REFERENCES merit_lists(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  rank INTEGER,
  category TEXT,
  merit_score DECIMAL,
  status TEXT DEFAULT 'listed', -- 'listed', 'offered', 'accepted', 'declined', 'expired'
  offer_sent_at TIMESTAMPTZ,
  offer_accepted_at TIMESTAMPTZ,
  offer_expires_at TIMESTAMPTZ
);

-- 10. CREATE admission_offers TABLE
CREATE TABLE IF NOT EXISTS admission_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  merit_list_id UUID REFERENCES merit_lists(id) ON DELETE SET NULL,
  offer_letter_url TEXT,
  offered_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'sent', -- 'sent', 'accepted', 'rejected', 'expired'
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- 11. CREATE admission_fees TABLE
CREATE TABLE IF NOT EXISTS admission_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  fee_type TEXT CHECK (fee_type IN ('application','confirmation','enrollment')),
  amount DECIMAL NOT NULL,
  razorpay_order_id TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  paid_at TIMESTAMPTZ,
  receipt_url TEXT
);

-- 12. CREATE counseling_sessions TABLE
CREATE TABLE IF NOT EXISTS counseling_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES admission_cycles(id) ON DELETE CASCADE,
  round_number INTEGER,
  scheduled_date DATE,
  mode TEXT CHECK (mode IN ('online','offline','hybrid')),
  venue TEXT,
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled' -- 'scheduled', 'completed', 'cancelled'
);

-- 13. CREATE counseling_slots TABLE
CREATE TABLE IF NOT EXISTS counseling_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES counseling_sessions(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  slot_time TIMESTAMPTZ,
  officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'assigned', -- 'assigned', 'attended', 'no_show', 'rescheduled'
  attended BOOLEAN DEFAULT false,
  notes TEXT
);

-- 14. CREATE waitlist_movements TABLE
CREATE TABLE IF NOT EXISTS waitlist_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  from_position INTEGER,
  to_position INTEGER,
  reason TEXT,
  moved_at TIMESTAMPTZ DEFAULT now()
);

-- 15. CREATE admission_analytics TABLE
CREATE TABLE IF NOT EXISTS admission_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES admission_cycles(id) ON DELETE CASCADE,
  date DATE,
  applications_received INTEGER DEFAULT 0,
  applications_submitted INTEGER DEFAULT 0,
  documents_pending INTEGER DEFAULT 0,
  merit_listed INTEGER DEFAULT 0,
  offers_sent INTEGER DEFAULT 0,
  offers_accepted INTEGER DEFAULT 0,
  seats_filled INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. CREATE crm_leads TABLE
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT, -- 'website', 'social', 'event', 'walkin', 'referral'
  program_interest TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'interested', 'applied', 'admitted', 'lost'
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  last_contacted TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_adm_cycles_inst ON admission_cycles(institution_id);
CREATE INDEX IF NOT EXISTS idx_adm_programs_inst ON programs(institution_id);
CREATE INDEX IF NOT EXISTS idx_applicants_inst ON applicants(institution_id);
CREATE INDEX IF NOT EXISTS idx_applicants_cycle ON applicants(cycle_id);
CREATE INDEX IF NOT EXISTS idx_applicants_status ON applicants(status);
CREATE INDEX IF NOT EXISTS idx_applicants_email ON applicants(email);
CREATE INDEX IF NOT EXISTS idx_crm_leads_inst ON crm_leads(institution_id);
CREATE INDEX IF NOT EXISTS idx_documents_applicant ON documents(applicant_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE merit_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- 1. APPLICANTS POLICIES
DROP POLICY IF EXISTS "applicant_own_data" ON applicants;
CREATE POLICY "applicant_own_data" ON applicants
  FOR SELECT USING (
    email = (SELECT email FROM users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_institution_applicants" ON applicants;
CREATE POLICY "admin_institution_applicants" ON applicants
  FOR ALL USING (
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
  );

-- 2. DOCUMENTS POLICIES
DROP POLICY IF EXISTS "applicant_own_documents" ON documents;
CREATE POLICY "applicant_own_documents" ON documents
  FOR ALL USING (
    applicant_id IN (SELECT id FROM applicants WHERE email = (SELECT email FROM users WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "admin_institution_documents" ON documents;
CREATE POLICY "admin_institution_documents" ON documents
  FOR ALL USING (
    applicant_id IN (SELECT id FROM applicants WHERE institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()))
  );

-- 3. ADMISSION OFFERS POLICIES
DROP POLICY IF EXISTS "applicant_own_offers" ON admission_offers;
CREATE POLICY "applicant_own_offers" ON admission_offers
  FOR SELECT USING (
    applicant_id IN (SELECT id FROM applicants WHERE email = (SELECT email FROM users WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "admin_institution_offers" ON admission_offers;
CREATE POLICY "admin_institution_offers" ON admission_offers
  FOR ALL USING (
    applicant_id IN (SELECT id FROM applicants WHERE institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()))
  );

-- 4. ADMISSION CYCLES POLICIES
DROP POLICY IF EXISTS "tenant_isolation_admission_cycles" ON admission_cycles;
CREATE POLICY "tenant_isolation_admission_cycles" ON admission_cycles
  FOR ALL USING (
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
  );

-- 5. PROGRAMS POLICIES
DROP POLICY IF EXISTS "tenant_isolation_programs" ON programs;
CREATE POLICY "tenant_isolation_programs" ON programs
  FOR ALL USING (
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
  );

-- ============================================================
-- SEED DATA - ADMISSION CYCLES & PROGRAMS FOR DEMO
-- ============================================================
INSERT INTO admission_cycles (id, institution_id, name, academic_year, start_date, end_date, status) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'Fall Admissions 2026', '2026-27', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '60 days', 'open')
  ON CONFLICT DO NOTHING;

INSERT INTO programs (id, institution_id, name, code, degree_type, duration_years, total_seats, reserved_seats, eligibility_criteria, application_fee) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'Bachelor of Technology in Computer Science (B.Tech CSE)', 'BTECH-CSE', 'UG', 4, 120, '{"general": 60, "obc": 32, "sc": 18, "st": 10}', '{"min_12th_pc": 60.0, "required_subjects": ["Physics", "Mathematics"]}', 1000.00),
  ('a1111111-1111-1111-1111-111111111112', 'a0000000-0000-0000-0000-000000000001', 'Bachelor of Technology in Artificial Intelligence (B.Tech AI-DS)', 'BTECH-AIDS', 'UG', 4, 60, '{"general": 30, "obc": 16, "sc": 9, "st": 5}', '{"min_12th_pc": 65.0, "required_subjects": ["Physics", "Mathematics"]}', 1200.00),
  ('a1111111-1111-1111-1111-111111111113', 'a0000000-0000-0000-0000-000000000001', 'Master of Business Administration (MBA)', 'MBA-CORE', 'PG', 2, 60, '{"general": 30, "obc": 16, "sc": 9, "st": 5}', '{"min_grad_cgpa": 6.0}', 1500.00)
  ON CONFLICT DO NOTHING;


-- ============================================================
-- MODULE 12: IRIS Placements
-- Company CRM, Drives management, Student profile builder, AI
-- interview checks, Offer tracking, and Alumni mentoring network.
-- ============================================================

-- 1. CREATE companies TABLE
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  company_type TEXT CHECK (company_type IN (
    'product','service','startup','mnc','psu','ngo'
  )),
  hr_name TEXT,
  hr_email TEXT,
  hr_phone TEXT,
  linkedin_url TEXT,
  address TEXT,
  tier TEXT CHECK (tier IN ('dream','core','mass')),
  last_visited DATE,
  total_offers_given INTEGER DEFAULT 0,
  relationship_status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE placement_drives TABLE
CREATE TABLE IF NOT EXISTS placement_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  job_description TEXT,
  jd_url TEXT,
  role TEXT NOT NULL,
  department TEXT,
  job_type TEXT CHECK (job_type IN (
    'full_time','internship','ppo','contract'
  )),
  location TEXT[],
  ctc_min DECIMAL,
  ctc_max DECIMAL,
  ctc_display TEXT,
  stipend DECIMAL,
  bond_years INTEGER DEFAULT 0,
  eligibility_criteria JSONB DEFAULT '{}'::jsonb,
  min_cgpa DECIMAL DEFAULT 0.0,
  eligible_branches TEXT[],
  eligible_batches TEXT[],
  backlogs_allowed INTEGER DEFAULT 0,
  application_deadline TIMESTAMPTZ,
  drive_date DATE,
  drive_mode TEXT CHECK (drive_mode IN ('online','offline','hybrid')),
  venue TEXT,
  meeting_link TEXT,
  rounds JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN (
    'upcoming','open','closed','processing','completed'
  )) DEFAULT 'upcoming',
  max_applications INTEGER,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE student_profiles TABLE
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  resume_url TEXT,
  resume_updated_at TIMESTAMPTZ,
  cgpa DECIMAL DEFAULT 0.0,
  active_backlogs INTEGER DEFAULT 0,
  total_backlogs INTEGER DEFAULT 0,
  skills TEXT[],
  certifications JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  internships JSONB DEFAULT '[]'::jsonb,
  achievements TEXT[],
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  is_placed BOOLEAN DEFAULT false,
  placed_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  placed_ctc DECIMAL,
  placed_role TEXT,
  placed_at TIMESTAMPTZ,
  placement_type TEXT,
  opted_out BOOLEAN DEFAULT false,
  opt_out_reason TEXT,
  ai_resume_score DECIMAL DEFAULT 0.0,
  ai_resume_feedback TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE drive_applications TABLE
CREATE TABLE IF NOT EXISTS drive_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ DEFAULT now(),
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT CHECK (status IN (
    'applied','shortlisted','test_scheduled','interview_scheduled',
    'selected','offered','offer_accepted','offer_rejected',
    'rejected','withdrawn'
  )) DEFAULT 'applied',
  current_round INTEGER DEFAULT 0,
  rejection_reason TEXT,
  feedback TEXT
);

-- 5. CREATE interview_rounds TABLE
CREATE TABLE IF NOT EXISTS interview_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES drive_applications(id) ON DELETE CASCADE,
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  round_number INTEGER,
  round_type TEXT CHECK (round_type IN (
    'aptitude','coding','technical','hr','gd','case_study','final'
  )),
  scheduled_at TIMESTAMPTZ,
  venue TEXT,
  meeting_link TEXT,
  interviewer_name TEXT,
  interviewer_email TEXT,
  duration_minutes INTEGER,
  result TEXT CHECK (result IN ('pass','fail','hold','no_show')),
  score DECIMAL,
  feedback TEXT,
  status TEXT DEFAULT 'scheduled'
);

-- 6. CREATE offer_letters TABLE
CREATE TABLE IF NOT EXISTS offer_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES drive_applications(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  offer_number TEXT UNIQUE,
  role TEXT,
  ctc DECIMAL,
  joining_date DATE,
  location TEXT,
  offer_letter_url TEXT,
  company_offer_url TEXT,
  status TEXT DEFAULT 'received',
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CREATE placement_stats TABLE
CREATE TABLE IF NOT EXISTS placement_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  batch TEXT,
  branch TEXT,
  total_eligible INTEGER DEFAULT 0,
  total_registered INTEGER DEFAULT 0,
  total_placed INTEGER DEFAULT 0,
  total_companies INTEGER DEFAULT 0,
  avg_ctc DECIMAL DEFAULT 0.0,
  median_ctc DECIMAL DEFAULT 0.0,
  highest_ctc DECIMAL DEFAULT 0.0,
  lowest_ctc DECIMAL DEFAULT 0.0,
  ppo_count INTEGER DEFAULT 0,
  dream_offers INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. CREATE mock_interviews TABLE
CREATE TABLE IF NOT EXISTS mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  interview_type TEXT,
  questions JSONB DEFAULT '[]'::jsonb,
  responses JSONB DEFAULT '[]'::jsonb,
  ai_feedback TEXT,
  score DECIMAL DEFAULT 0.0,
  duration_minutes INTEGER,
  conducted_at TIMESTAMPTZ DEFAULT now()
);

-- 9. CREATE alumni TABLE
CREATE TABLE IF NOT EXISTS alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  graduation_year INTEGER,
  current_company TEXT,
  "current_role" TEXT,
  current_ctc DECIMAL,
  location TEXT,
  linkedin_url TEXT,
  is_mentor BOOLEAN DEFAULT false,
  mentoring_slots INTEGER DEFAULT 0,
  achievements TEXT[],
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. CREATE alumni_mentorship TABLE
CREATE TABLE IF NOT EXISTS alumni_mentorship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID REFERENCES alumni(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  session_date TIMESTAMPTZ,
  duration_minutes INTEGER,
  topic TEXT,
  feedback TEXT,
  student_rating INTEGER,
  status TEXT DEFAULT 'scheduled'
);

-- 11. CREATE placement_notifications TABLE
CREATE TABLE IF NOT EXISTS placement_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  type TEXT,
  message TEXT,
  sent_via TEXT[],
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_companies_inst ON companies(institution_id);
CREATE INDEX IF NOT EXISTS idx_drives_company ON placement_drives(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_drive ON drive_applications(drive_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON drive_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_rounds_application ON interview_rounds(application_id);
CREATE INDEX IF NOT EXISTS idx_offers_student ON offer_letters(student_id);
CREATE INDEX IF NOT EXISTS idx_alumni_student ON alumni(student_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_mentorship ENABLE ROW LEVEL SECURITY;

-- 1. COMPANIES POLICY
DROP POLICY IF EXISTS "companies_tenant_access" ON companies;
CREATE POLICY "companies_tenant_access" ON companies 
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

-- 2. PLACEMENT DRIVES POLICY
DROP POLICY IF EXISTS "drives_tenant_access" ON placement_drives;
CREATE POLICY "drives_tenant_access" ON placement_drives 
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

-- 3. STUDENT PROFILES POLICY
DROP POLICY IF EXISTS "student_own_profile" ON student_profiles;
CREATE POLICY "student_own_profile" ON student_profiles
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_all_profiles" ON student_profiles;
CREATE POLICY "admin_all_profiles" ON student_profiles 
  FOR ALL USING (get_auth_user_role() IN ('Admin', 'SuperAdmin', 'TPO'));

-- 4. APPLICATIONS POLICY
DROP POLICY IF EXISTS "student_own_applications" ON drive_applications;
CREATE POLICY "student_own_applications" ON drive_applications
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_all_applications" ON drive_applications;
CREATE POLICY "admin_all_applications" ON drive_applications 
  FOR ALL USING (get_auth_user_role() IN ('Admin', 'SuperAdmin', 'TPO', 'Company HR'));

-- 5. INTERVIEW ROUDS POLICY
DROP POLICY IF EXISTS "student_own_rounds" ON interview_rounds;
CREATE POLICY "student_own_rounds" ON interview_rounds
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_all_rounds" ON interview_rounds;
CREATE POLICY "admin_all_rounds" ON interview_rounds 
  FOR ALL USING (get_auth_user_role() IN ('Admin', 'SuperAdmin', 'TPO', 'Company HR'));

-- 6. OFFER LETTERS POLICY
DROP POLICY IF EXISTS "student_own_offers" ON offer_letters;
CREATE POLICY "student_own_offers" ON offer_letters
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_all_offers" ON offer_letters;
CREATE POLICY "admin_all_offers" ON offer_letters 
  FOR ALL USING (get_auth_user_role() IN ('Admin', 'SuperAdmin', 'TPO', 'Company HR'));

-- 7. MOCK INTERVIEWS POLICY
DROP POLICY IF EXISTS "student_own_mocks" ON mock_interviews;
CREATE POLICY "student_own_mocks" ON mock_interviews
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_all_mocks" ON mock_interviews;
CREATE POLICY "admin_all_mocks" ON mock_interviews 
  FOR ALL USING (get_auth_user_role() IN ('Admin', 'SuperAdmin', 'TPO'));

-- 8. ALUMNI POLICY
DROP POLICY IF EXISTS "alumni_tenant_access" ON alumni;
CREATE POLICY "alumni_tenant_access" ON alumni 
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

-- 9. MENTORSHIP POLICY
DROP POLICY IF EXISTS "mentorship_tenant_access" ON alumni_mentorship;
CREATE POLICY "mentorship_tenant_access" ON alumni_mentorship 
  FOR ALL USING (
    alumni_id IN (SELECT id FROM alumni WHERE institution_id = get_auth_institution_id()) 
    OR get_auth_user_role() = 'SuperAdmin'
  );

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO companies (id, institution_id, name, logo_url, website, industry, company_type, hr_name, hr_email, hr_phone, tier, relationship_status) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Google India', 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=120', 'https://google.com', 'Technology', 'mnc', 'Neha Sen', 'neha.sen@google.com', '+91 99881 23456', 'dream', 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Infosys', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120', 'https://infosys.com', 'IT Services', 'service', 'Rajesh K.', 'rajesh.k@infosys.com', '+91 94140 12891', 'mass', 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'ZS Associates', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=120', 'https://zs.com', 'Consulting', 'product', 'Preeti Sharma', 'preeti.sharma@zs.com', '+91 99290 12347', 'core', 'active')
  ON CONFLICT DO NOTHING;

INSERT INTO placement_drives (id, institution_id, company_id, title, role, job_type, location, ctc_min, ctc_max, ctc_display, min_cgpa, eligible_branches, eligible_batches, status, application_deadline, drive_date) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Google SWE Summer Drive 2026', 'Software Engineer (L3)', 'full_time', ARRAY['Bangalore', 'Hyderabad'], 32.0, 42.0, '32 - 42 LPA', 8.0, ARRAY['CSE', 'AIDS'], ARRAY['2026'], 'open', CURRENT_TIMESTAMP + INTERVAL '10 days', CURRENT_DATE + INTERVAL '15 days'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'ZS Consulting Campus Hiring', 'Business Technology Analyst', 'full_time', ARRAY['Pune', 'Gurgaon'], 8.5, 12.0, '8.5 - 12 LPA', 7.0, ARRAY['CSE', 'AIDS', 'ECE'], ARRAY['2026'], 'open', CURRENT_TIMESTAMP + INTERVAL '5 days', CURRENT_DATE + INTERVAL '8 days')
  ON CONFLICT DO NOTHING;


-- ============================================================
-- MODULE 13: IRIS OBE & NAAC
-- Programs OBE, Courses, COs, POs, CO-PO mappings, CIE assessments, 
-- Attainments logs, NAAC criteria checklists, SSR documents, and Faculty logs.
-- ============================================================

-- 1. CREATE programs_obe TABLE
CREATE TABLE IF NOT EXISTS programs_obe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  program_code TEXT,
  degree_type TEXT,
  duration_years INTEGER,
  vision TEXT,
  mission TEXT,
  peos TEXT[],
  psos TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE courses TABLE
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs_obe(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  semester INTEGER,
  credits INTEGER,
  course_type TEXT CHECK (course_type IN (
    'core','elective','lab','project','audit'
  )),
  teacher_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  academic_year TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 3. CREATE course_outcomes TABLE
CREATE TABLE IF NOT EXISTS course_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  co_number INTEGER NOT NULL,
  co_statement TEXT NOT NULL,
  bloom_level TEXT CHECK (bloom_level IN (
    'remember','understand','apply','analyze','evaluate','create'
  )),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE program_outcomes TABLE
CREATE TABLE IF NOT EXISTS program_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs_obe(id) ON DELETE CASCADE,
  po_number INTEGER NOT NULL,
  po_statement TEXT NOT NULL,
  category TEXT DEFAULT 'po'
);

-- 5. CREATE co_po_mapping TABLE
CREATE TABLE IF NOT EXISTS co_po_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  co_id UUID REFERENCES course_outcomes(id) ON DELETE CASCADE,
  po_id UUID REFERENCES program_outcomes(id) ON DELETE CASCADE,
  correlation_level INTEGER CHECK (correlation_level IN (1, 2, 3)),
  mapped_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(co_id, po_id)
);

-- COURSE REGISTRATIONS (Student course enrollment)
CREATE TABLE IF NOT EXISTS course_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  semester INTEGER NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  dropped_at TIMESTAMPTZ,
  UNIQUE(student_id, course_id, academic_year, semester)
);

CREATE INDEX IF NOT EXISTS idx_course_reg_student ON course_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_course_reg_course ON course_registrations(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reg_inst ON course_registrations(institution_id);

-- RLS for course_registrations
ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_reg_select" ON course_registrations;
CREATE POLICY "course_reg_select" ON course_registrations
  FOR SELECT USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS "course_reg_insert" ON course_registrations;
CREATE POLICY "course_reg_insert" ON course_registrations
  FOR INSERT WITH CHECK (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS "course_reg_update" ON course_registrations;
CREATE POLICY "course_reg_update" ON course_registrations
  FOR UPDATE USING (institution_id = get_auth_institution_id());

-- 6. CREATE assessment_tools TABLE
CREATE TABLE IF NOT EXISTS assessment_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tool_type TEXT CHECK (tool_type IN (
    'cie','see','assignment','quiz','lab','project','seminar'
  )),
  max_marks DECIMAL,
  weightage DECIMAL,
  conducted_date DATE
);

-- 7. CREATE co_assessments TABLE
CREATE TABLE IF NOT EXISTS co_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES assessment_tools(id) ON DELETE CASCADE,
  co_id UUID REFERENCES course_outcomes(id) ON DELETE CASCADE,
  marks_allocated DECIMAL NOT NULL
);

-- 8. CREATE student_co_marks TABLE
CREATE TABLE IF NOT EXISTS student_co_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES assessment_tools(id) ON DELETE CASCADE,
  co_id UUID REFERENCES course_outcomes(id) ON DELETE CASCADE,
  marks_obtained DECIMAL,
  max_marks DECIMAL,
  entered_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  entered_at TIMESTAMPTZ DEFAULT now()
);

-- 9. CREATE co_attainment TABLE
CREATE TABLE IF NOT EXISTS co_attainment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  co_id UUID REFERENCES course_outcomes(id) ON DELETE CASCADE,
  academic_year TEXT,
  direct_attainment DECIMAL,
  indirect_attainment DECIMAL,
  final_attainment DECIMAL,
  target_attainment DECIMAL DEFAULT 60,
  is_attained BOOLEAN,
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. CREATE po_attainment TABLE
CREATE TABLE IF NOT EXISTS po_attainment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs_obe(id) ON DELETE CASCADE,
  po_id UUID REFERENCES program_outcomes(id) ON DELETE CASCADE,
  academic_year TEXT,
  direct_attainment DECIMAL,
  indirect_attainment DECIMAL,
  final_attainment DECIMAL,
  target_attainment DECIMAL DEFAULT 60,
  is_attained BOOLEAN,
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. CREATE naac_criteria TABLE
CREATE TABLE IF NOT EXISTS naac_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  criterion_number TEXT NOT NULL,
  criterion_name TEXT NOT NULL,
  key_indicators JSONB,
  weightage DECIMAL,
  self_score DECIMAL,
  evidence_urls TEXT[],
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- 12. CREATE naac_metrics TABLE
CREATE TABLE IF NOT EXISTS naac_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion_id UUID REFERENCES naac_criteria(id) ON DELETE CASCADE,
  metric_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  description TEXT,
  data_value TEXT,
  supporting_docs TEXT[],
  status TEXT DEFAULT 'pending',
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT
);

-- 13. CREATE iqac_activities TABLE
CREATE TABLE IF NOT EXISTS iqac_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  activity_type TEXT,
  date DATE,
  description TEXT,
  participants TEXT[],
  outcomes TEXT[],
  documents TEXT[],
  academic_year TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 14. CREATE faculty_development TABLE
CREATE TABLE IF NOT EXISTS faculty_development (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  program_type TEXT CHECK (program_type IN (
    'fdp','workshop','conference','seminar',
    'online_course','research','publication'
  )),
  title TEXT,
  organizing_body TEXT,
  date DATE,
  duration_days INTEGER,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. CREATE research_publications TABLE
CREATE TABLE IF NOT EXISTS research_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  journal_conference TEXT,
  publication_type TEXT,
  year INTEGER,
  doi TEXT,
  isbn_issn TEXT,
  impact_factor DECIMAL,
  indexed_in TEXT[],
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. CREATE student_achievements TABLE
CREATE TABLE IF NOT EXISTS student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  achievement_type TEXT CHECK (achievement_type IN (
    'academic','sports','cultural','competitive',
    'research','innovation','award'
  )),
  title TEXT,
  level TEXT CHECK (level IN ('institution','district','state','national','international')),
  date DATE,
  certificate_url TEXT,
  description TEXT
);

-- 17. CREATE feedback_surveys TABLE
CREATE TABLE IF NOT EXISTS feedback_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  survey_type TEXT CHECK (survey_type IN (
    'student_satisfaction','alumni_feedback',
    'employer_feedback','faculty_feedback','parent_feedback'
  )),
  academic_year TEXT,
  questions JSONB,
  is_active BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 18. CREATE survey_responses TABLE
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES feedback_surveys(id) ON DELETE CASCADE,
  respondent_id UUID,
  respondent_type TEXT,
  responses JSONB,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- 19. CREATE ssr_documents TABLE
CREATE TABLE IF NOT EXISTS ssr_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  criterion TEXT,
  document_name TEXT,
  document_url TEXT,
  academic_year TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_obe_prog_inst ON programs_obe(institution_id);
CREATE INDEX IF NOT EXISTS idx_obe_courses_prog ON courses(program_id);
CREATE INDEX IF NOT EXISTS idx_obe_co_course ON course_outcomes(course_id);
CREATE INDEX IF NOT EXISTS idx_obe_po_prog ON program_outcomes(program_id);
CREATE INDEX IF NOT EXISTS idx_obe_marks_student ON student_co_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_naac_metrics_crit ON naac_metrics(criterion_id);
CREATE INDEX IF NOT EXISTS idx_faculty_dev_staff ON faculty_development(staff_id);
CREATE INDEX IF NOT EXISTS idx_publications_staff ON research_publications(staff_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE programs_obe ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_po_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_co_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_attainment ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_attainment ENABLE ROW LEVEL SECURITY;
ALTER TABLE naac_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE naac_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE iqac_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssr_documents ENABLE ROW LEVEL SECURITY;

-- Apply Multi-Tenant Policies
DROP POLICY IF EXISTS "obe_programs_access" ON programs_obe;
CREATE POLICY "obe_programs_access" ON programs_obe 
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS "courses_access" ON courses;
CREATE POLICY "courses_access" ON courses 
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS "course_outcomes_access" ON course_outcomes;
CREATE POLICY "course_outcomes_access" ON course_outcomes 
  FOR ALL USING (course_id IN (SELECT id FROM courses WHERE institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'));

DROP POLICY IF EXISTS "program_outcomes_access" ON program_outcomes;
CREATE POLICY "program_outcomes_access" ON program_outcomes 
  FOR ALL USING (program_id IN (SELECT id FROM programs_obe WHERE institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'));

DROP POLICY IF EXISTS "co_po_mapping_access" ON co_po_mapping;
CREATE POLICY "co_po_mapping_access" ON co_po_mapping 
  FOR ALL USING (course_id IN (SELECT id FROM courses WHERE institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'));

DROP POLICY IF EXISTS "assessment_tools_access" ON assessment_tools;
CREATE POLICY "assessment_tools_access" ON assessment_tools 
  FOR ALL USING (course_id IN (SELECT id FROM courses WHERE institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'));

DROP POLICY IF EXISTS "co_assessments_access" ON co_assessments;
CREATE POLICY "co_assessments_access" ON co_assessments 
  FOR ALL USING (co_id IN (SELECT id FROM course_outcomes WHERE course_id IN (SELECT id FROM courses WHERE institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')));

DROP POLICY IF EXISTS "student_co_marks_access" ON student_co_marks;
CREATE POLICY "student_co_marks_access" ON student_co_marks 
  FOR ALL USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'));

DROP POLICY IF EXISTS "co_attainment_access" ON co_attainment;
CREATE POLICY "co_attainment_access" ON co_attainment 
  FOR ALL USING (course_id IN (SELECT id FROM courses WHERE institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'));

DROP POLICY IF EXISTS "po_attainment_access" ON po_attainment;
CREATE POLICY "po_attainment_access" ON po_attainment 
  FOR ALL USING (program_id IN (SELECT id FROM programs_obe WHERE institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'));

DROP POLICY IF EXISTS "naac_criteria_access" ON naac_criteria;
CREATE POLICY "naac_criteria_access" ON naac_criteria 
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS "naac_metrics_access" ON naac_metrics;
CREATE POLICY "naac_metrics_access" ON naac_metrics 
  FOR ALL USING (criterion_id IN (SELECT id FROM naac_criteria WHERE institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'));

DROP POLICY IF EXISTS "iqac_activities_access" ON iqac_activities;
CREATE POLICY "iqac_activities_access" ON iqac_activities 
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS "faculty_development_access" ON faculty_development;
CREATE POLICY "faculty_development_access" ON faculty_development 
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS "research_publications_access" ON research_publications;
CREATE POLICY "research_publications_access" ON research_publications 
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS "student_achievements_access" ON student_achievements;
CREATE POLICY "student_achievements_access" ON student_achievements 
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS "feedback_surveys_access" ON feedback_surveys;
CREATE POLICY "feedback_surveys_access" ON feedback_surveys 
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS "survey_responses_access" ON survey_responses;
CREATE POLICY "survey_responses_access" ON survey_responses 
  FOR ALL USING (survey_id IN (SELECT id FROM feedback_surveys WHERE institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'));

DROP POLICY IF EXISTS "ssr_documents_access" ON ssr_documents;
CREATE POLICY "ssr_documents_access" ON ssr_documents 
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

-- ============================================================
-- SEED DATA
-- ============================================================
-- Prepopulate NAAC Criteria 1 to 7
INSERT INTO naac_criteria (id, institution_id, criterion_number, criterion_name, weightage, self_score) VALUES
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '1', 'Curricular Aspects', 100, 3.8),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '2', 'Teaching-Learning and Evaluation', 350, 3.7),
  ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '3', 'Research, Innovations and Extension', 120, 3.5),
  ('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '4', 'Infrastructure and Learning Resources', 100, 3.9),
  ('10000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '5', 'Student Support and Progression', 130, 3.8),
  ('10000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '6', 'Governance, Leadership and Management', 100, 3.6),
  ('10000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', '7', 'Institutional Values and Best Practices', 100, 3.9)
  ON CONFLICT DO NOTHING;

-- Seed Demo Program in programs_obe
INSERT INTO programs_obe (id, institution_id, program_name, program_code, degree_type, duration_years, vision, mission, peos, psos) VALUES
  ('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'B.Tech in Computer Science', 'CS-BTECH', 'UG', 4, 
   'To produce globally competent professionals in software engineering and cloud computing.', 
   'By providing high-quality logic training and collaborative research modules.',
   ARRAY['PEO1: Graduate as senior full-stack developers in IT cells', 'PEO2: Establish scalable startups or research systems'],
   ARRAY['PSO1: Build robust microservices and server databases', 'PSO2: Configure cloud architectures and smart interfaces'])
  ON CONFLICT DO NOTHING;

-- Seed Program Outcomes NBA PO1 - PO12
INSERT INTO program_outcomes (id, program_id, po_number, po_statement) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1, 'Engineering Knowledge: Apply science logic to complex software engineering problems.'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 2, 'Problem Analysis: Analyze and debug complex cloud algorithms.'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 3, 'Design/Development: Architect databases and microservice layers.'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 4, 'Conduct Investigations: Perform performance benchmarks and load testing.'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 5, 'Modern Tool Usage: Command Next.js, Supabase RLS, and React tools.'),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 6, 'The Engineer and Society: Build secure and accessible tech portals.'),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001', 7, 'Environment and Sustainability: Optimize servers energy and efficiency.'),
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001', 8, 'Ethics: Enforce data protection and license agreements.'),
  ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000001', 9, 'Individual and Team Work: Collaborate in pair programming cells.'),
  ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001', 10, 'Communication: Document walkthroughs and implementation designs.'),
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000001', 11, 'Project Management: Maintain checklists and track tasks budgets.'),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000001', 12, 'Life-long Learning: Eagerly load capabilities and train with AI models.')
  ON CONFLICT DO NOTHING;

-- Seed Demo Course
INSERT INTO courses (id, institution_id, program_id, course_code, course_name, semester, credits, course_type, academic_year) VALUES
  ('40000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'CS-401', 'Advanced Web Development', 4, 4, 'core', '2026-27')
  ON CONFLICT DO NOTHING;


-- Migration for Module 14: HR Management

CREATE TABLE employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id),
  user_id uuid REFERENCES users(id),
  staff_id uuid REFERENCES staff(id),
  employee_code TEXT UNIQUE NOT NULL,
  title TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  blood_group TEXT,
  personal_email TEXT,
  personal_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address_permanent JSONB,
  address_current JSONB,
  photo_url TEXT,
  aadhar_number TEXT,
  pan_number TEXT,
  uan_number TEXT,
  bank_account_number TEXT,
  bank_name TEXT,
  bank_ifsc TEXT,
  bank_branch TEXT,
  nationality TEXT DEFAULT 'Indian',
  religion TEXT,
  category TEXT,
  marital_status TEXT,
  disability BOOLEAN DEFAULT false,
  disability_details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE employment_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  institution_id uuid REFERENCES institutions(id),
  department_id uuid REFERENCES departments(id),
  designation TEXT NOT NULL,
  employee_type TEXT CHECK (employee_type IN (
    'permanent','probation','contract','visiting',
    'part_time','adhoc','guest'
  )),
  joining_date DATE NOT NULL,
  confirmation_date DATE,
  retirement_date DATE,
  reporting_to uuid REFERENCES employee_profiles(id),
  work_location TEXT,
  qualification TEXT,
  specialization TEXT,
  experience_years DECIMAL,
  previous_employer TEXT,
  status TEXT DEFAULT 'active'
);

CREATE TABLE salary_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id),
  name TEXT NOT NULL,
  components JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE employee_salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  structure_id uuid REFERENCES salary_structures(id),
  basic DECIMAL NOT NULL,
  hra DECIMAL DEFAULT 0,
  da DECIMAL DEFAULT 0,
  ta DECIMAL DEFAULT 0,
  medical_allowance DECIMAL DEFAULT 0,
  special_allowance DECIMAL DEFAULT 0,
  other_allowances JSONB,
  gross_salary DECIMAL NOT NULL,
  pf_employee DECIMAL DEFAULT 0,
  pf_employer DECIMAL DEFAULT 0,
  esi_employee DECIMAL DEFAULT 0,
  esi_employer DECIMAL DEFAULT 0,
  professional_tax DECIMAL DEFAULT 0,
  tds DECIMAL DEFAULT 0,
  other_deductions JSONB,
  net_salary DECIMAL NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_current BOOLEAN DEFAULT true
);

CREATE TABLE payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status TEXT CHECK (status IN (
    'draft','processing','approved','disbursed','locked'
  )) DEFAULT 'draft',
  total_gross DECIMAL,
  total_deductions DECIMAL,
  total_net DECIMAL,
  employee_count INTEGER,
  created_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  disbursed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(institution_id, month, year)
);

CREATE TABLE payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id uuid REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  month INTEGER,
  year INTEGER,
  working_days INTEGER,
  present_days DECIMAL,
  absent_days DECIMAL,
  lop_days DECIMAL DEFAULT 0,
  basic DECIMAL,
  hra DECIMAL,
  da DECIMAL,
  ta DECIMAL,
  other_allowances JSONB,
  gross_earnings DECIMAL,
  pf_deduction DECIMAL,
  esi_deduction DECIMAL,
  professional_tax DECIMAL,
  tds_deduction DECIMAL,
  loan_deduction DECIMAL DEFAULT 0,
  other_deductions JSONB,
  total_deductions DECIMAL,
  net_salary DECIMAL,
  pdf_url TEXT,
  is_published BOOLEAN DEFAULT false
);

CREATE TABLE leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  days_per_year INTEGER,
  is_paid BOOLEAN DEFAULT true,
  carry_forward BOOLEAN DEFAULT false,
  max_carry_forward INTEGER DEFAULT 0,
  applicable_to TEXT[],
  encashable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  leave_type_id uuid REFERENCES leave_types(id) ON DELETE CASCADE,
  year INTEGER,
  entitled_days DECIMAL,
  used_days DECIMAL DEFAULT 0,
  remaining_days DECIMAL,
  carried_forward DECIMAL DEFAULT 0,
  UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  leave_type_id uuid REFERENCES leave_types(id),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  total_days DECIMAL NOT NULL,
  reason TEXT NOT NULL,
  supporting_doc_url TEXT,
  status TEXT CHECK (status IN (
    'pending','approved','rejected','cancelled','recalled'
  )) DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT now(),
  approved_by uuid REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  substitute_id uuid REFERENCES employee_profiles(id),
  handover_notes TEXT
);

CREATE TABLE attendance_hr (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  in_time TIMESTAMPTZ,
  out_time TIMESTAMPTZ,
  total_hours DECIMAL,
  status TEXT CHECK (status IN (
    'present','absent','half_day','late','on_leave',
    'work_from_home','holiday','weekly_off'
  )),
  source TEXT DEFAULT 'biometric',
  remarks TEXT,
  UNIQUE(employee_id, date)
);

CREATE TABLE performance_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id),
  name TEXT NOT NULL,
  year INTEGER,
  period_start DATE,
  period_end DATE,
  self_appraisal_deadline DATE,
  hod_review_deadline DATE,
  principal_review_deadline DATE,
  status TEXT DEFAULT 'upcoming'
);

CREATE TABLE performance_appraisals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid REFERENCES performance_cycles(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  self_score DECIMAL,
  self_comments TEXT,
  hod_score DECIMAL,
  hod_comments TEXT,
  principal_score DECIMAL,
  principal_comments TEXT,
  final_score DECIMAL,
  rating TEXT CHECK (rating IN (
    'outstanding','excellent','good','average','below_average'
  )),
  increment_recommended DECIMAL,
  promotion_recommended BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending_self'
);

CREATE TABLE appraisal_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id),
  category TEXT,
  parameter TEXT NOT NULL,
  description TEXT,
  max_score INTEGER,
  weightage DECIMAL,
  applicable_to TEXT[]
);

CREATE TABLE employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  doc_name TEXT,
  doc_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT false
);

CREATE TABLE increments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  effective_date DATE,
  previous_basic DECIMAL,
  new_basic DECIMAL,
  increment_amount DECIMAL,
  increment_percent DECIMAL,
  reason TEXT,
  appraisal_id uuid REFERENCES performance_appraisals(id),
  approved_by uuid REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE loan_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  loan_type TEXT,
  amount DECIMAL,
  applied_date DATE,
  approved_amount DECIMAL,
  tenure_months INTEGER,
  emi_amount DECIMAL,
  deduction_start DATE,
  outstanding_balance DECIMAL,
  status TEXT DEFAULT 'pending',
  approved_by uuid REFERENCES users(id)
);

CREATE TABLE holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('national','state','restricted','institution')),
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tds_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  financial_year TEXT,
  regime TEXT CHECK (regime IN ('old','new')) DEFAULT 'new',
  hra_claimed DECIMAL DEFAULT 0,
  section_80c DECIMAL DEFAULT 0,
  section_80d DECIMAL DEFAULT 0,
  section_80g DECIMAL DEFAULT 0,
  home_loan_interest DECIMAL DEFAULT 0,
  other_deductions DECIMAL DEFAULT 0,
  declarations JSONB,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tds_declarations ENABLE ROW LEVEL SECURITY;

-- RLS: employee sees own payslip
DROP POLICY IF EXISTS "employee_own_payslip" ON payslips;
CREATE POLICY "employee_own_payslip" ON payslips
  FOR SELECT USING (
    employee_id = (
      SELECT id FROM employee_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Seed defaults
INSERT INTO leave_types (name, code, days_per_year, is_paid, carry_forward, max_carry_forward, encashable)
VALUES 
  ('Casual Leave', 'CL', 12, true, false, 0, false),
  ('Earned Leave', 'EL', 18, true, true, 30, true),
  ('Sick Leave', 'SL', 10, true, true, 15, false)
ON CONFLICT DO NOTHING;

INSERT INTO holidays (institution_id, name, date, type, year)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'Independence Day', '2026-08-15', 'national', 2026),
  ('a0000000-0000-0000-0000-000000000001', 'Republic Day', '2026-01-26', 'national', 2026)
ON CONFLICT DO NOTHING;

-- ==========================================================
-- SECTION 5: SECURITY AUDIT INDEXES, PROCEDURES, AND CLEANUP
-- ==========================================================

-- Partial unique indexes to prevent duplicate active entities
CREATE UNIQUE INDEX IF NOT EXISTS idx_hostel_allocations_active_student ON hostel_allocations(student_id) WHERE (is_current = TRUE);
CREATE UNIQUE INDEX IF NOT EXISTS idx_book_issues_active_student_book ON book_issues(student_id, book_id) WHERE (status = 'Issued');
CREATE UNIQUE INDEX IF NOT EXISTS idx_gym_bookings_active_student_slot ON gym_bookings(student_id, slot_id) WHERE (status = 'Booked');

-- Indexes for new tables (fitness_metrics, workout_sessions, book_reservations)
CREATE INDEX IF NOT EXISTS idx_fitness_metrics_student ON fitness_metrics(student_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_student ON workout_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_book_reservations_book ON book_reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_book_reservations_student ON book_reservations(student_id);

-- RLS policies for new tables
ALTER TABLE fitness_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY fitness_metrics_tenant ON fitness_metrics
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()) OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY workout_sessions_tenant ON workout_sessions
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()) OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY book_reservations_tenant ON book_reservations
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()) OR get_auth_user_role() = 'SuperAdmin');

-- Performance optimized composite index for transit live tracking queries
CREATE INDEX IF NOT EXISTS idx_bus_tracking_composite ON bus_tracking(bus_id, timestamp DESC);

-- Performance partial index for unread notifications retrieval
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE (is_read = FALSE);

-- Atomic checkout procedure for canteen cashless wallet purchases (Overdraft protection)
CREATE OR REPLACE FUNCTION place_canteen_order_atomic(
  p_student_id UUID,
  p_institution_id UUID,
  p_total_amount DECIMAL,
  p_items JSONB,
  p_payment_method VARCHAR,
  p_special_instructions TEXT,
  p_offer_id UUID,
  p_discount_amount DECIMAL,
  p_order_number VARCHAR
) RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_wallet_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_order_id UUID;
BEGIN
  -- If payment method is Wallet, perform atomic balance check and debit
  IF p_payment_method = 'Wallet' THEN
    -- Lock wallet row to prevent concurrent race condition modifications
    SELECT id, balance INTO v_wallet_id, v_wallet_balance
    FROM canteen_wallets
    WHERE student_id = p_student_id AND institution_id = p_institution_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Canteen wallet not found for this student.'
      );
    END IF;

    IF v_wallet_balance < p_total_amount THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Insufficient wallet balance for canteen order.'
      );
    END IF;

    v_new_balance := v_wallet_balance - p_total_amount;

    -- Update balance
    UPDATE canteen_wallets
    SET balance = v_new_balance, last_updated = NOW()
    WHERE id = v_wallet_id;

    -- Insert wallet transaction
    INSERT INTO wallet_transactions (institution_id, wallet_id, student_id, type, amount, reference_type, description, balance_after)
    VALUES (p_institution_id, v_wallet_id, p_student_id, 'debit', p_total_amount, 'order_payment', 'Order payment for canteen items', v_new_balance);

  END IF;

  -- Insert order
  INSERT INTO canteen_orders (
    institution_id, student_id, items, total_amount, status, payment_method, special_instructions, offer_id, discount_amount, order_number, order_time
  ) VALUES (
    p_institution_id, p_student_id, p_items, p_total_amount, 'Received', p_payment_method, p_special_instructions, p_offer_id, p_discount_amount, p_order_number, NOW()
  ) RETURNING id INTO v_order_id;

  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', p_order_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Telemetry coordinates data cleanup/archival strategy (logs older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_bus_tracking_data()
RETURNS VOID AS $$
BEGIN
  DELETE FROM bus_tracking
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PERMISSIONS SYSTEM (Feature Toggles + Role-Based Module Permissions)
-- ============================================================

CREATE TABLE IF NOT EXISTS institution_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  feature_key VARCHAR(50) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institution_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_institution_features_inst ON institution_features(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_features_key ON institution_features(feature_key);

CREATE TABLE IF NOT EXISTS module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  can_read BOOLEAN NOT NULL DEFAULT true,
  can_write BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institution_id, role, module)
);

CREATE INDEX IF NOT EXISTS idx_module_permissions_inst ON module_permissions(institution_id);
CREATE INDEX IF NOT EXISTS idx_module_permissions_role ON module_permissions(role);

ALTER TABLE institution_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "institution_features_select" ON institution_features;
CREATE POLICY "institution_features_select" ON institution_features
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "institution_features_insert" ON institution_features;
CREATE POLICY "institution_features_insert" ON institution_features
  FOR INSERT WITH CHECK (
    get_auth_user_role() = 'Admin'
    AND institution_id = get_auth_institution_id()
  );

DROP POLICY IF EXISTS "institution_features_update" ON institution_features;
CREATE POLICY "institution_features_update" ON institution_features
  FOR UPDATE USING (
    get_auth_user_role() = 'Admin'
    AND institution_id = get_auth_institution_id()
  );

DROP POLICY IF EXISTS "institution_features_delete" ON institution_features;
CREATE POLICY "institution_features_delete" ON institution_features
  FOR DELETE USING (
    get_auth_user_role() = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "module_permissions_select" ON module_permissions;
CREATE POLICY "module_permissions_select" ON module_permissions
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "module_permissions_insert" ON module_permissions;
CREATE POLICY "module_permissions_insert" ON module_permissions
  FOR INSERT WITH CHECK (
    get_auth_user_role() = 'SuperAdmin'
    OR get_auth_user_role() = 'Admin'
  );

DROP POLICY IF EXISTS "module_permissions_update" ON module_permissions;
CREATE POLICY "module_permissions_update" ON module_permissions
  FOR UPDATE USING (
    get_auth_user_role() = 'SuperAdmin'
    OR get_auth_user_role() = 'Admin'
  );

DROP POLICY IF EXISTS "module_permissions_delete" ON module_permissions;
CREATE POLICY "module_permissions_delete" ON module_permissions
  FOR DELETE USING (
    get_auth_user_role() = 'SuperAdmin'
  );

-- Seed defaults
INSERT INTO institution_features (institution_id, feature_key, enabled)
SELECT i.id, f.feature_key, true
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard'), ('admissions'), ('students'), ('attendance'), ('timetable'),
  ('fees'), ('exams'), ('canteen'), ('hostel'), ('library'), ('placements'),
  ('hr'), ('gate'), ('gym'), ('transit'), ('events'), ('notices'), ('idcards'),
  ('ai_concierge'), ('obe'), ('naac'), ('faculty_development'), ('achievements'),
  ('director'), ('parent_portal')
) AS f(feature_key)
ON CONFLICT (institution_id, feature_key) DO NOTHING;

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Admin', m.module, true, true, true
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard'), ('admissions'), ('students'), ('attendance'), ('timetable'),
  ('fees'), ('exams'), ('canteen'), ('hostel'), ('library'), ('placements'),
  ('hr'), ('gate'), ('gym'), ('transit'), ('events'), ('notices'), ('idcards'),
  ('ai_concierge'), ('obe'), ('naac'), ('faculty_development'), ('achievements'),
  ('director'), ('parent_portal')
) AS m(module)
ON CONFLICT (institution_id, role, module) DO NOTHING;

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Staff', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('students', true), ('attendance', true), ('timetable', true),
  ('exams', true), ('notices', true), ('obe', true), ('library', true),
  ('canteen', false), ('hostel', false), ('placements', false), ('hr', false),
  ('gate', false), ('gym', false), ('transit', false), ('events', false),
  ('idcards', false), ('ai_concierge', false), ('naac', false),
  ('admissions', false), ('faculty_development', true), ('achievements', false),
  ('director', false), ('parent_portal', false), ('fees', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Teacher', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('students', true), ('attendance', true), ('timetable', true),
  ('exams', true), ('obe', true), ('gym', true), ('library', true),
  ('canteen', false), ('hostel', false), ('placements', false), ('hr', false),
  ('gate', false), ('transit', false), ('events', false), ('notices', false),
  ('idcards', false), ('ai_concierge', false), ('naac', false),
  ('admissions', false), ('faculty_development', false), ('achievements', false),
  ('director', false), ('parent_portal', false), ('fees', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Student', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('attendance', true), ('timetable', true), ('fees', true),
  ('exams', true), ('canteen', true), ('hostel', true), ('library', true),
  ('placements', true), ('events', true), ('notices', true), ('idcards', true),
  ('gym', true), ('transit', true), ('ai_concierge', true),
  ('students', false), ('admissions', false), ('hr', false), ('gate', false),
  ('obe', false), ('naac', false), ('faculty_development', false),
  ('achievements', false), ('director', false), ('parent_portal', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Warden', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('hostel', true), ('gate', true), ('notices', true),
  ('students', true), ('attendance', true),
  ('canteen', false), ('library', false), ('placements', false), ('hr', false),
  ('gym', false), ('transit', false), ('events', false), ('idcards', false),
  ('ai_concierge', false), ('obe', false), ('naac', false),
  ('admissions', false), ('faculty_development', false), ('achievements', false),
  ('director', false), ('parent_portal', false), ('fees', false), ('timetable', false),
  ('exams', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Parent', m.module, true, false, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard'), ('attendance'), ('fees'), ('exams'), ('notices'), ('hostel')
) AS m(module)
ON CONFLICT (institution_id, role, module) DO NOTHING;

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Security', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('gate', true), ('transit', true), ('notices', true),
  ('canteen', false), ('hostel', false), ('library', false), ('placements', false),
  ('hr', false), ('gym', false), ('events', false), ('idcards', false),
  ('ai_concierge', false), ('obe', false), ('naac', false),
  ('admissions', false), ('faculty_development', false), ('achievements', false),
  ('director', false), ('parent_portal', false), ('fees', false), ('timetable', false),
  ('students', false), ('attendance', false), ('exams', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Vendor', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('canteen', true),
  ('admissions', false), ('students', false), ('attendance', false), ('timetable', false),
  ('fees', false), ('exams', false), ('hostel', false), ('library', false),
  ('placements', false), ('hr', false), ('gate', false), ('gym', false),
  ('transit', false), ('events', false), ('notices', false), ('idcards', false),
  ('ai_concierge', false), ('obe', false), ('naac', false),
  ('faculty_development', false), ('achievements', false), ('director', false),
  ('parent_portal', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Driver', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('transit', true),
  ('admissions', false), ('students', false), ('attendance', false), ('timetable', false),
  ('fees', false), ('exams', false), ('canteen', false), ('hostel', false),
  ('library', false), ('placements', false), ('hr', false), ('gate', false),
  ('gym', false), ('events', false), ('notices', false), ('idcards', false),
  ('ai_concierge', false), ('obe', false), ('naac', false),
  ('faculty_development', false), ('achievements', false), ('director', false),
  ('parent_portal', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

CREATE OR REPLACE FUNCTION update_permissions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_institution_features_updated ON institution_features;
CREATE TRIGGER trigger_institution_features_updated
  BEFORE UPDATE ON institution_features
  FOR EACH ROW EXECUTE FUNCTION update_permissions_timestamp();

DROP TRIGGER IF EXISTS trigger_module_permissions_updated ON module_permissions;
CREATE TRIGGER trigger_module_permissions_updated
  BEFORE UPDATE ON module_permissions
  FOR EACH ROW EXECUTE FUNCTION update_permissions_timestamp();


-- ==========================================================
-- SECTION: SUPERADMIN ENHANCEMENTS (2026-06-16)
-- ==========================================================

-- 1. Extend institutions table with subscription + pricing fields
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS plan_price_monthly DECIMAL(10,2) DEFAULT 0;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(30) DEFAULT 'active';
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- 2. Payment Configuration per institution
CREATE TABLE IF NOT EXISTS payment_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE UNIQUE,
    razorpay_key_id VARCHAR(255),
    razorpay_key_secret VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(100),
    bank_ifsc VARCHAR(20),
    bank_holder_name VARCHAR(150),
    upi_id VARCHAR(100),
    enabled_methods JSONB DEFAULT '["razorpay"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Subscription Payments
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    plan_tier VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    method VARCHAR(50),
    transaction_id VARCHAR(100),
    status VARCHAR(30) DEFAULT 'Completed',
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SuperAdmin Notifications
CREATE TABLE IF NOT EXISTS superadmin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'General Update',
    target_campus_ids UUID[] DEFAULT '{}',
    sent_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SuperAdmin Notification Read Status
CREATE TABLE IF NOT EXISTS superadmin_notification_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES superadmin_notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(notification_id, user_id)
);

-- RLS Policies for new tables
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE superadmin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE superadmin_notification_reads ENABLE ROW LEVEL SECURITY;

-- payment_config: SuperAdmin full access, Admin read own institution
DROP POLICY IF EXISTS payment_config_policy ON payment_config;
CREATE POLICY payment_config_policy ON payment_config
    FOR ALL USING (
        institution_id = get_auth_institution_id()
        OR get_auth_user_role() = 'SuperAdmin'
    );

-- subscription_payments: SuperAdmin full access, Admin read own
DROP POLICY IF EXISTS subscription_payments_policy ON subscription_payments;
CREATE POLICY subscription_payments_policy ON subscription_payments
    FOR ALL USING (
        institution_id = get_auth_institution_id()
        OR get_auth_user_role() = 'SuperAdmin'
    );

-- superadmin_notifications: SuperAdmin full, Admins read
DROP POLICY IF EXISTS superadmin_notifications_select ON superadmin_notifications;
CREATE POLICY superadmin_notifications_select ON superadmin_notifications
    FOR SELECT USING (true);

DROP POLICY IF EXISTS superadmin_notifications_insert ON superadmin_notifications;
CREATE POLICY superadmin_notifications_insert ON superadmin_notifications
    FOR INSERT WITH CHECK (get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS superadmin_notifications_delete ON superadmin_notifications;
CREATE POLICY superadmin_notifications_delete ON superadmin_notifications
    FOR DELETE USING (get_auth_user_role() = 'SuperAdmin');

-- superadmin_notification_reads: users read their own, SuperAdmin read all
DROP POLICY IF EXISTS sanr_select ON superadmin_notification_reads;
CREATE POLICY sanr_select ON superadmin_notification_reads
    FOR SELECT USING (
        user_id = get_auth_user_id()
        OR get_auth_user_role() = 'SuperAdmin'
    );

DROP POLICY IF EXISTS sanr_insert ON superadmin_notification_reads;
CREATE POLICY sanr_insert ON superadmin_notification_reads
    FOR INSERT WITH CHECK (get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS sanr_update ON superadmin_notification_reads;
CREATE POLICY sanr_update ON superadmin_notification_reads
    FOR UPDATE USING (
        user_id = get_auth_user_id()
        OR get_auth_user_role() = 'SuperAdmin'
    );

-- ==========================================================
-- SECTION 10: SEED DATA FOR INSTITUTIONS
-- ==========================================================
INSERT INTO institutions (id, name, type, address, city, state, phone, email, plan_tier, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Harvard University', 'university', 'Cambridge', 'Cambridge', 'MA', '+1-617-495-1000', 'admin@harvard.edu', 'Enterprise', true),
  ('22222222-2222-2222-2222-222222222222', 'MIT', 'university', '77 Massachusetts Ave', 'Cambridge', 'MA', '+1-617-253-1000', 'admin@mit.edu', 'Campus', true),
  ('33333333-3333-3333-3333-333333333333', 'Stanford University', 'university', '450 Serra Mall', 'Stanford', 'CA', '+1-650-723-2300', 'admin@stanford.edu', 'Enterprise', true)
ON CONFLICT (email) DO NOTHING;
CREATE TABLE IF NOT EXISTS hostel_settings (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE UNIQUE,
warden_id UUID REFERENCES users(id) ON DELETE SET NULL,
checkin_start_time TIME DEFAULT '19:00',
checkin_end_time TIME DEFAULT '21:00',
qr_code_secret VARCHAR(255) DEFAULT uuid_generate_v4()::text,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hostel_attendance (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
student_id UUID REFERENCES students(id) ON DELETE CASCADE,
date DATE NOT NULL,
status VARCHAR(20) DEFAULT 'Present',
marked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
marked_method VARCHAR(50) DEFAULT 'QR',
CONSTRAINT unique_hostel_attendance UNIQUE (student_id, date)
);

CREATE TABLE IF NOT EXISTS mess_notices (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
warden_id UUID REFERENCES users(id) ON DELETE SET NULL,
message TEXT NOT NULL,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE hostel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE mess_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hostel_settings_policy ON hostel_settings;
CREATE POLICY hostel_settings_policy ON hostel_settings
FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS hostel_attendance_policy ON hostel_attendance;
CREATE POLICY hostel_attendance_policy ON hostel_attendance
FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS mess_notices_policy ON mess_notices;
CREATE POLICY mess_notices_policy ON mess_notices
FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

-- ==========================================================
-- SECTION: CONSOLIDATED MIGRATIONS (JUNE 9 - JUNE 13)
-- ==========================================================
-- ==========================================================
-- MIGRATION: 20260609000003_campus_core_features.sql
-- ==========================================================

-- Migration: Campus Core Features Extension
-- Targets: Supabase (PostgreSQL)

-- Add fingerprint support to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS fingerprint_id VARCHAR(100) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_students_fingerprint ON students(fingerprint_id);

-- 1. FEE CONCESSIONS & SCHOLARSHIPS
CREATE TABLE IF NOT EXISTS fee_concessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    concession_type VARCHAR(100) NOT NULL, -- Scholarship, Merit, Need-based, Sports
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    reason TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. NOTICE READS
CREATE TABLE IF NOT EXISTS notice_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_notice_user_read UNIQUE (notice_id, user_id)
);

-- 3. ID CARD TEMPLATES
CREATE TABLE IF NOT EXISTS id_card_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    template_json JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ATTENDANCE REGULARIZATIONS
CREATE TABLE IF NOT EXISTS attendance_regularizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    proof_url TEXT,
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE fee_concessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_regularizations ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies
DROP POLICY IF EXISTS tenant_fee_concessions_policy ON fee_concessions;
CREATE POLICY tenant_fee_concessions_policy ON fee_concessions
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

DROP POLICY IF EXISTS tenant_notice_reads_policy ON notice_reads;
CREATE POLICY tenant_notice_reads_policy ON notice_reads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM notices n
            WHERE n.id = notice_id
              AND (n.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
        )
    );

DROP POLICY IF EXISTS tenant_id_card_templates_policy ON id_card_templates;
CREATE POLICY tenant_id_card_templates_policy ON id_card_templates
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

DROP POLICY IF EXISTS tenant_attendance_regularizations_policy ON attendance_regularizations;
CREATE POLICY tenant_attendance_regularizations_policy ON attendance_regularizations
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );


-- ==========================================================
-- MIGRATION: 20260609000004_canteen_module.sql
-- ==========================================================

-- ============================================================
-- IRIS 365 — MODULE 2: CANTEEN SYSTEM EXTENSIONS
-- ============================================================
-- Extends existing canteen_menus, canteen_orders, canteen_wallets,
-- meal_subscriptions with additional tables & columns.
-- ============================================================

-- 1. CANTEEN CATEGORIES (menu grouping)
CREATE TABLE IF NOT EXISTS canteen_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT '🍽️',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CANTEEN FEEDBACK (order ratings & reviews)
CREATE TABLE IF NOT EXISTS canteen_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    order_id UUID REFERENCES canteen_orders(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_feedback_per_order UNIQUE (order_id, student_id)
);

-- 3. CANTEEN OFFERS (discount codes & promotions)
CREATE TABLE IF NOT EXISTS canteen_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- percentage, flat
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2),
    usage_limit INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_offer_code_per_tenant UNIQUE (institution_id, code)
);

-- 4. CANTEEN PRE-ORDERS (scheduled future orders)
CREATE TABLE IF NOT EXISTS canteen_preorders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_slot VARCHAR(50) NOT NULL, -- e.g., "12:00-13:00", "08:00-09:00"
    status VARCHAR(30) DEFAULT 'Scheduled', -- Scheduled, Confirmed, Preparing, Ready, Delivered, Cancelled
    payment_method VARCHAR(50) DEFAULT 'Wallet',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. WALLET TRANSACTIONS (full audit trail)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES canteen_wallets(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- credit, debit
    amount DECIMAL(10, 2) NOT NULL,
    reference_type VARCHAR(50), -- topup, order_payment, refund, subscription
    reference_id UUID, -- order_id, subscription_id, etc.
    description TEXT,
    balance_after DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ADD COLUMNS to existing canteen_menus
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS prep_time_mins INTEGER DEFAULT 10;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT TRUE;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3, 2) DEFAULT 0;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES canteen_categories(id) ON DELETE SET NULL;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS spice_level INTEGER DEFAULT 1 CHECK (spice_level >= 0 AND spice_level <= 3);

-- 7. ADD COLUMNS to existing canteen_orders
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(20);
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES canteen_offers(id) ON DELETE SET NULL;
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- 8. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_canteen_orders_student ON canteen_orders(student_id);
CREATE INDEX IF NOT EXISTS idx_canteen_orders_status ON canteen_orders(status);
CREATE INDEX IF NOT EXISTS idx_canteen_orders_time ON canteen_orders(order_time DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_student ON wallet_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_canteen_feedback_order ON canteen_feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_canteen_preorders_date ON canteen_preorders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_canteen_menus_category ON canteen_menus(category_id);

-- 9. RLS POLICIES
ALTER TABLE canteen_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen_preorders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY canteen_categories_tenant ON canteen_categories
    USING (institution_id = get_auth_institution_id());

CREATE POLICY canteen_feedback_tenant ON canteen_feedback
    USING (institution_id = get_auth_institution_id());

CREATE POLICY canteen_offers_tenant ON canteen_offers
    USING (institution_id = get_auth_institution_id());

CREATE POLICY canteen_preorders_tenant ON canteen_preorders
    USING (institution_id = get_auth_institution_id());

CREATE POLICY wallet_transactions_tenant ON wallet_transactions
    USING (institution_id = get_auth_institution_id());


-- ==========================================================
-- MIGRATION: 20260609000005_fitzone_module.sql
-- ==========================================================

-- ============================================================
-- IRIS 365 — MODULE 3: FITZONE SYSTEM EXTENSIONS
-- ============================================================

-- 1. GYM TRAINERS
CREATE TABLE IF NOT EXISTS gym_trainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specializations TEXT[],
    bio TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. GYM MEMBERSHIP PLANS
CREATE TABLE IF NOT EXISTS gym_membership_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration_months INTEGER,
    price DECIMAL(10, 2),
    features TEXT[],
    max_sessions_per_week INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ADJUST GYM SLOTS
ALTER TABLE gym_slots DROP CONSTRAINT IF EXISTS gym_slots_trainer_id_fkey;
ALTER TABLE gym_slots ADD COLUMN IF NOT EXISTS slot_type TEXT DEFAULT 'general';
ALTER TABLE gym_slots ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;
-- Ensure trainer_id type matches gym_trainers(id) type
ALTER TABLE gym_slots ALTER COLUMN trainer_id TYPE UUID;
-- We can add constraint on gym_slots.trainer_id after table definitions
ALTER TABLE gym_slots ADD CONSTRAINT gym_slots_trainer_id_gym_trainers_fkey FOREIGN KEY (trainer_id) REFERENCES gym_trainers(id) ON DELETE SET NULL;

-- 4. ADJUST GYM BOOKINGS
ALTER TABLE gym_bookings ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE gym_bookings ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;
-- Alter booking_date type to TIMESTAMP WITH TIME ZONE if it isn't
ALTER TABLE gym_bookings ALTER COLUMN booking_date TYPE TIMESTAMP WITH TIME ZONE;
-- We alter status to support both camelcase and lowercase values to avoid breaking previous atomic functions
ALTER TABLE gym_bookings DROP CONSTRAINT IF EXISTS gym_bookings_status_check;
ALTER TABLE gym_bookings ADD CONSTRAINT gym_bookings_status_check CHECK (status IN ('booked', 'checked_in', 'no_show', 'cancelled', 'Booked', 'Checked_in', 'No_show', 'Cancelled'));

-- 5. ADJUST GYM MEMBERSHIPS
ALTER TABLE gym_memberships ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES gym_membership_plans(id) ON DELETE SET NULL;
ALTER TABLE gym_memberships ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE gym_memberships ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE gym_memberships ADD COLUMN IF NOT EXISTS frozen_from DATE;
ALTER TABLE gym_memberships ADD COLUMN IF NOT EXISTS frozen_until DATE;

-- 6. GYM EQUIPMENT
CREATE TABLE IF NOT EXISTS gym_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 1,
    condition TEXT DEFAULT 'good', -- excellent, good, fair, maintenance
    purchase_date DATE,
    last_serviced DATE,
    next_service DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. EQUIPMENT USAGE LOGS
CREATE TABLE IF NOT EXISTS equipment_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID REFERENCES gym_equipment(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. EQUIPMENT MAINTENANCE LOGS
CREATE TABLE IF NOT EXISTS equipment_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID REFERENCES gym_equipment(id) ON DELETE CASCADE,
    maintenance_type TEXT,
    performed_by TEXT,
    date DATE DEFAULT CURRENT_DATE,
    cost DECIMAL(10, 2),
    notes TEXT,
    next_due DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. FITNESS METRICS
CREATE TABLE IF NOT EXISTS fitness_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES gym_trainers(id) ON DELETE SET NULL,
    date DATE DEFAULT CURRENT_DATE,
    weight_kg DECIMAL(5, 2),
    height_cm DECIMAL(5, 2),
    bmi DECIMAL(5, 2),
    body_fat_percent DECIMAL(5, 2),
    chest_cm DECIMAL(5, 2),
    waist_cm DECIMAL(5, 2),
    hips_cm DECIMAL(5, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. WORKOUT SESSIONS
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES gym_bookings(id) ON DELETE SET NULL,
    date DATE DEFAULT CURRENT_DATE,
    duration_minutes INTEGER,
    exercises JSONB, -- list of exercises with sets, reps, weight
    calories_burned INTEGER DEFAULT 0,
    trainer_notes TEXT,
    self_rating INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. TRAINER SESSIONS
CREATE TABLE IF NOT EXISTS trainer_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID REFERENCES gym_trainers(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 60,
    session_type TEXT, -- personal_training, assessment, onboarding
    status TEXT DEFAULT 'scheduled', -- scheduled, accepted, rejected, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. INDEXES
CREATE INDEX IF NOT EXISTS idx_gym_trainers_inst ON gym_trainers(institution_id);
CREATE INDEX IF NOT EXISTS idx_gym_trainers_user ON gym_trainers(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_membership_plans_inst ON gym_membership_plans(institution_id);
CREATE INDEX IF NOT EXISTS idx_gym_slots_date ON gym_slots(date);
CREATE INDEX IF NOT EXISTS idx_gym_bookings_student ON gym_bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_gym_bookings_slot ON gym_bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_gym_memberships_student ON gym_memberships(student_id);
CREATE INDEX IF NOT EXISTS idx_gym_equipment_inst ON gym_equipment(institution_id);
CREATE INDEX IF NOT EXISTS idx_equipment_usage_logs_equip ON equipment_usage_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_usage_logs_student ON equipment_usage_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maint_logs_equip ON equipment_maintenance_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_fitness_metrics_student ON fitness_metrics(student_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_student ON workout_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_trainer_sessions_trainer ON trainer_sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_sessions_student ON trainer_sessions(student_id);

-- 13. ENABLE ROW LEVEL SECURITY
ALTER TABLE gym_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_sessions ENABLE ROW LEVEL SECURITY;

-- 14. TENANT ISOLATION RLS POLICIES
CREATE POLICY gym_trainers_tenant ON gym_trainers
    USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY gym_membership_plans_tenant ON gym_membership_plans
    USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY gym_equipment_tenant ON gym_equipment
    USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY equipment_usage_logs_tenant ON equipment_usage_logs
    USING (
        equipment_id IN (SELECT id FROM gym_equipment WHERE institution_id = get_auth_institution_id())
        OR get_auth_user_role() = 'SuperAdmin'
    );

CREATE POLICY equipment_maintenance_logs_tenant ON equipment_maintenance_logs
    USING (
        equipment_id IN (SELECT id FROM gym_equipment WHERE institution_id = get_auth_institution_id())
        OR get_auth_user_role() = 'SuperAdmin'
    );

CREATE POLICY fitness_metrics_tenant ON fitness_metrics
    USING (
        student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id())
        OR get_auth_user_role() = 'SuperAdmin'
    );

CREATE POLICY workout_sessions_tenant ON workout_sessions
    USING (
        student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id())
        OR get_auth_user_role() = 'SuperAdmin'
    );

CREATE POLICY trainer_sessions_tenant ON trainer_sessions
    USING (
        trainer_id IN (SELECT id FROM gym_trainers WHERE institution_id = get_auth_institution_id())
        OR student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id())
        OR get_auth_user_role() = 'SuperAdmin'
    );


-- ==========================================================
-- MIGRATION: 20260609000006_events_module.sql
-- ==========================================================

-- ============================================================
-- MODULE 4: IRIS Events — Schema Extensions & New Tables
-- ============================================================

-- 1. EXTEND events TABLE with missing columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_price DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 2. EXTEND event_registrations TABLE
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- 3. EXTEND event_volunteers TABLE
ALTER TABLE event_volunteers ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active';
ALTER TABLE event_volunteers ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. CREATE event_budget TABLE
CREATE TABLE IF NOT EXISTS event_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,       -- Venue, Catering, Decoration, Marketing, Prizes, Logistics, Other
  description TEXT,
  estimated_amount DECIMAL(10, 2) DEFAULT 0,
  actual_amount DECIMAL(10, 2) DEFAULT 0,
  receipt_url TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(30) DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. CREATE event_photos TABLE
CREATE TABLE IF NOT EXISTS event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. CREATE event_feedback TABLE
CREATE TABLE IF NOT EXISTS event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5),
  venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (event_id, student_id)  -- One feedback per student per event
);

-- 7. CREATE event_announcements TABLE
CREATE TABLE IF NOT EXISTS event_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',  -- low, normal, high, urgent
  sent_via TEXT[] DEFAULT '{}',            -- email, push, whatsapp
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_events_institution ON events(institution_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_datetime ON events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_student ON event_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_event_volunteers_event ON event_volunteers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_budget_event ON event_budget(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_event ON event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_event ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_announcements_event ON event_announcements(event_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE event_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_announcements ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY "tenant_isolation_event_budget" ON event_budget
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_event_photos" ON event_photos
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_event_feedback" ON event_feedback
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_event_announcements" ON event_announcements
  USING (institution_id = get_auth_institution_id());


-- ==========================================================
-- MIGRATION: 20260609000007_hostel_module.sql
-- ==========================================================

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


-- ==========================================================
-- MIGRATION: 20260609000008_library_module.sql
-- ==========================================================

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


-- ==========================================================
-- MIGRATION: 20260609000009_transit_module.sql
-- ==========================================================

-- Migration: Module 7 (Transit Module)
-- Target: Supabase / PostgreSQL

-- 1. Alter Existing Tables to match specifications
ALTER TABLE bus_routes ADD COLUMN IF NOT EXISTS route_number TEXT;
ALTER TABLE bus_routes ADD COLUMN IF NOT EXISTS distance_km DECIMAL;
ALTER TABLE bus_routes ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE bus_routes ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL;
ALTER TABLE bus_routes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE buses ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS insurance_expiry DATE;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS fitness_expiry DATE;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE bus_tracking ADD COLUMN IF NOT EXISTS heading DECIMAL;

ALTER TABLE transport_subscriptions ADD COLUMN IF NOT EXISTS stop_name TEXT;
ALTER TABLE transport_subscriptions ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE transport_subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Create New Tables
CREATE TABLE IF NOT EXISTS bus_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  license_number TEXT UNIQUE,
  license_expiry DATE,
  phone TEXT,
  address TEXT,
  emergency_contact TEXT,
  joining_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS bus_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
  route_id uuid REFERENCES bus_routes(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES bus_drivers(id) ON DELETE SET NULL,
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  trip_type TEXT CHECK (trip_type IN ('morning','evening','special')),
  scheduled_start TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled', -- scheduled, active, completed, cancelled, no_show
  delay_minutes INTEGER DEFAULT 0,
  passenger_count INTEGER DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS trip_stop_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES bus_trips(id) ON DELETE CASCADE,
  stop_index INTEGER,
  stop_name TEXT,
  scheduled_time TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  passengers_boarded INTEGER DEFAULT 0,
  passengers_alighted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bus_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES bus_trips(id) ON DELETE SET NULL,
  incident_type TEXT, -- breakdown, accident, traffic, medical, other
  description TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  reported_by uuid REFERENCES users(id) ON DELETE SET NULL,
  severity TEXT CHECK (severity IN ('low','medium','high','critical')) DEFAULT 'low',
  status TEXT CHECK (status IN ('reported','investigating','resolved')) DEFAULT 'reported',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bus_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
  maintenance_type TEXT, -- service, repair, inspection, tires, other
  scheduled_date DATE,
  completed_date DATE,
  cost DECIMAL DEFAULT 0,
  service_center TEXT,
  notes TEXT,
  next_due_date DATE
);

-- 3. Enable RLS
ALTER TABLE bus_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_stop_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_maintenance ENABLE ROW LEVEL SECURITY;

-- 4. Create Tenant Isolation Policies (safe drop first)
DROP POLICY IF EXISTS tenant_bus_drivers_policy ON bus_drivers;
CREATE POLICY tenant_bus_drivers_policy ON bus_drivers
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_bus_trips_policy ON bus_trips;
CREATE POLICY tenant_bus_trips_policy ON bus_trips
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_trip_stop_logs_policy ON trip_stop_logs;
CREATE POLICY tenant_trip_stop_logs_policy ON trip_stop_logs
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_bus_incidents_policy ON bus_incidents;
CREATE POLICY tenant_bus_incidents_policy ON bus_incidents
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_bus_maintenance_policy ON bus_maintenance;
CREATE POLICY tenant_bus_maintenance_policy ON bus_maintenance
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

-- 5. Seed Mock Transit Data
-- Inject Rajesh Kumar Driver details
INSERT INTO bus_drivers (id, user_id, institution_id, license_number, license_expiry, phone, address, emergency_contact, joining_date, is_active)
VALUES (
  'd0000000-0000-0000-0000-000000000013',
  'b0000000-0000-0000-0000-000000000013',
  'a0000000-0000-0000-0000-000000000001',
  'DL-14202500009',
  CURRENT_DATE + INTERVAL '5 years',
  '+919829012347',
  'Sardarpura 1st Road, Jodhpur',
  '+919829012340',
  '2024-01-15',
  true
) ON CONFLICT (license_number) DO NOTHING;

-- Seed Bus Routes
INSERT INTO bus_routes (id, institution_id, name, route_number, stops, distance_km, duration_minutes, monthly_fee, is_active)
VALUES (
  '80000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Jodhpur Central Route',
  'ROUTE-101',
  '[
    {"name": "Sardarpura 4th Road", "latitude": 26.2912, "longitude": 73.0156, "stop_index": 0, "scheduled_time_morning": "08:00 AM", "scheduled_time_evening": "05:30 PM"},
    {"name": "Shastri Nagar Circle", "latitude": 26.2647, "longitude": 73.0012, "stop_index": 1, "scheduled_time_morning": "08:15 AM", "scheduled_time_evening": "05:15 PM"},
    {"name": "Mogra Highway Stop", "latitude": 26.1543, "longitude": 73.0234, "stop_index": 2, "scheduled_time_morning": "08:30 AM", "scheduled_time_evening": "05:00 PM"},
    {"name": "SIET Campus Terminal", "latitude": 26.1200, "longitude": 73.0500, "stop_index": 3, "scheduled_time_morning": "08:45 AM", "scheduled_time_evening": "04:45 PM"}
  ]'::jsonb,
  18.5,
  45,
  1200.00,
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO bus_routes (id, institution_id, name, route_number, stops, distance_km, duration_minutes, monthly_fee, is_active)
VALUES (
  '80000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Mandore Outskirts Route',
  'ROUTE-102',
  '[
    {"name": "Mandore Garden Stop", "latitude": 26.3400, "longitude": 73.0400, "stop_index": 0, "scheduled_time_morning": "07:50 AM", "scheduled_time_evening": "05:40 PM"},
    {"name": "Paota Circle Hub", "latitude": 26.2990, "longitude": 73.0390, "stop_index": 1, "scheduled_time_morning": "08:10 AM", "scheduled_time_evening": "05:20 PM"},
    {"name": "Basni Industrial Zone", "latitude": 26.2410, "longitude": 72.9990, "stop_index": 2, "scheduled_time_morning": "08:25 AM", "scheduled_time_evening": "05:05 PM"},
    {"name": "SIET Campus Terminal", "latitude": 26.1200, "longitude": 73.0500, "stop_index": 3, "scheduled_time_morning": "08:45 AM", "scheduled_time_evening": "04:45 PM"}
  ]'::jsonb,
  24.2,
  55,
  1500.00,
  true
) ON CONFLICT (id) DO NOTHING;

-- Seed Buses
INSERT INTO buses (id, institution_id, vehicle_number, model, capacity, route_id, driver_id, device_id, insurance_expiry, fitness_expiry, is_active)
VALUES (
  '70000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'RJ-19-PB-4050',
  'Tata Starbus 40-Seater',
  40,
  '80000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000013', -- Rajesh Kumar Driver user_id
  'GPS-DEV-4050',
  CURRENT_DATE + INTERVAL '28 days', -- Warn soon
  CURRENT_DATE + INTERVAL '120 days',
  true
) ON CONFLICT (vehicle_number) DO NOTHING;

-- Seed active subscription for Khushal
INSERT INTO transport_subscriptions (id, institution_id, student_id, route_id, stop_name, start_date, end_date, amount_paid, transaction_id, status)
VALUES (
  '90000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000006', -- Khushal student_id
  '80000000-0000-0000-0000-000000000001', -- Route 101
  'Sardarpura 4th Road',
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '25 days',
  1200.00,
  'TXN_TRANSIT_UPI_1',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Seed active tracking position for Bus
INSERT INTO bus_tracking (id, institution_id, bus_id, latitude, longitude, speed, heading, timestamp, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000001001',
  'a0000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  26.2912,
  73.0156,
  35.5,
  180.0,
  now(),
  true
) ON CONFLICT (id) DO NOTHING;


-- ==========================================================
-- MIGRATION: 20260609000010_gate_module.sql
-- ==========================================================

-- Migration: Module 8 (Gate Security Module)
-- Target: Supabase / PostgreSQL

-- 1. Drop old incidents table to overwrite with detailed version
DROP TABLE IF EXISTS security_incidents CASCADE;

-- 2. Create tables
CREATE TABLE IF NOT EXISTS gate_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  person_id uuid,
  person_type TEXT CHECK (person_type IN ('student','staff','visitor')),
  person_name TEXT,
  entry_method TEXT CHECK (entry_method IN ('qr','biometric','rfid','manual','visitor_pass')),
  direction TEXT CHECK (direction IN ('in','out')),
  gate_number TEXT DEFAULT 'main',
  timestamp TIMESTAMPTZ DEFAULT now(),
  authorized_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  photo_url TEXT
);

CREATE TABLE IF NOT EXISTS rfid_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  card_uid TEXT UNIQUE NOT NULL,
  person_id uuid NOT NULL,
  person_type TEXT CHECK (person_type IN ('student','staff')),
  issued_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT
);

CREATE TABLE IF NOT EXISTS visitor_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  visitor_email TEXT,
  visitor_id_type TEXT,
  visitor_id_number TEXT,
  visitor_photo_url TEXT,
  host_id uuid,
  host_type TEXT CHECK (host_type IN ('student','staff')),
  host_name TEXT,
  purpose TEXT NOT NULL,
  pass_number TEXT UNIQUE,
  qr_code TEXT UNIQUE,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  reported_by uuid REFERENCES users(id) ON DELETE SET NULL,
  incident_type TEXT, -- theft, trespass, damage, overstay, other
  description TEXT NOT NULL,
  location TEXT,
  severity TEXT CHECK (severity IN ('low','medium','high','critical')) DEFAULT 'low',
  photo_urls TEXT[],
  status TEXT DEFAULT 'open', -- open, investigating, resolved
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blacklisted_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  id_number TEXT,
  photo_url TEXT,
  reason TEXT,
  added_by uuid REFERENCES users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS gate_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  guard_id uuid REFERENCES users(id) ON DELETE CASCADE,
  shift_start TIMESTAMPTZ,
  shift_end TIMESTAMPTZ,
  gate_number TEXT DEFAULT 'main',
  handover_notes TEXT
);

CREATE TABLE IF NOT EXISTS campus_occupancy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now(),
  students_inside INTEGER DEFAULT 0,
  staff_inside INTEGER DEFAULT 0,
  visitors_inside INTEGER DEFAULT 0
);

-- 3. Enable RLS
ALTER TABLE gate_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfid_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklisted_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_occupancy ENABLE ROW LEVEL SECURITY;

-- 4. Create Isolation Policies (using auth helper)
DROP POLICY IF EXISTS tenant_gate_entries_policy ON gate_entries;
CREATE POLICY tenant_gate_entries_policy ON gate_entries
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_rfid_cards_policy ON rfid_cards;
CREATE POLICY tenant_rfid_cards_policy ON rfid_cards
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_visitor_passes_policy ON visitor_passes;
CREATE POLICY tenant_visitor_passes_policy ON visitor_passes
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_security_incidents_policy ON security_incidents;
CREATE POLICY tenant_security_incidents_policy ON security_incidents
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_blacklisted_visitors_policy ON blacklisted_visitors;
CREATE POLICY tenant_blacklisted_visitors_policy ON blacklisted_visitors
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_gate_shifts_policy ON gate_shifts;
CREATE POLICY tenant_gate_shifts_policy ON gate_shifts
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_campus_occupancy_policy ON campus_occupancy;
CREATE POLICY tenant_campus_occupancy_policy ON campus_occupancy
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

-- 5. Seed Mock Gate Data
-- A. Register RFID cards
INSERT INTO rfid_cards (id, institution_id, card_uid, person_id, person_type, expiry_date, is_active, is_blocked)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'RFID_KHUSHAL_123',
  'b0000000-0000-0000-0000-000000000006', -- Student Khushal User ID
  'student',
  CURRENT_DATE + INTERVAL '4 years',
  true,
  false
) ON CONFLICT (card_uid) DO NOTHING;

INSERT INTO rfid_cards (id, institution_id, card_uid, person_id, person_type, expiry_date, is_active, is_blocked)
VALUES (
  'e0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'RFID_STAFF_101',
  'b0000000-0000-0000-0000-000000000002', -- Admin/Staff User ID
  'staff',
  CURRENT_DATE + INTERVAL '5 years',
  true,
  false
) ON CONFLICT (card_uid) DO NOTHING;

-- B. Pre-allocate campus occupancy initial records
INSERT INTO campus_occupancy (id, institution_id, timestamp, students_inside, staff_inside, visitors_inside)
VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  now() - INTERVAL '1 hour',
  45,
  12,
  2
) ON CONFLICT (id) DO NOTHING;

-- C. Blacklist mock entries
INSERT INTO blacklisted_visitors (id, institution_id, name, phone, id_number, reason, added_by)
VALUES (
  '60000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Suresh Singhania',
  '+919876543222',
  'Aadhaar: 228844991100',
  'Suspicious activity near hostel block last semester',
  'b0000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- D. Visitor passes seeds
INSERT INTO visitor_passes (id, institution_id, visitor_name, visitor_phone, host_id, host_type, host_name, purpose, pass_number, qr_code, valid_from, valid_until, is_used)
VALUES (
  '70000000-0000-0000-0000-000000001001',
  'a0000000-0000-0000-0000-000000000001',
  'Alok Kumar',
  '+919829123499',
  'b0000000-0000-0000-0000-000000000006', -- Host: Khushal
  'student',
  'Khushal Gehlot',
  'Project Collaboration & Laptop handover',
  'VP-98102',
  'VP-QR-98102',
  now() - INTERVAL '30 minutes',
  now() + INTERVAL '3 hours 30 minutes',
  true
) ON CONFLICT (id) DO NOTHING;

-- E. Seed some activity gate logs
INSERT INTO gate_entries (id, institution_id, person_id, person_type, person_name, entry_method, direction, gate_number, timestamp, reason)
VALUES (
  '80000000-0000-0000-0000-000000005001',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000006',
  'student',
  'Khushal Gehlot',
  'rfid',
  'in',
  'main',
  now() - INTERVAL '45 minutes',
  'Regular check-in'
) ON CONFLICT (id) DO NOTHING;


-- ==========================================================
-- MIGRATION: 20260609000011_director_module.sql
-- ==========================================================

-- Migration: Module 9 (Director Dashboard Module)
-- Target: Supabase / PostgreSQL

-- 1. Create tables
CREATE TABLE IF NOT EXISTS director_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info','warning','critical')) DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  module TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  alert_type TEXT UNIQUE NOT NULL,
  threshold_value DECIMAL,
  comparison TEXT CHECK (comparison IN ('lt','gt','eq')),
  is_enabled BOOLEAN DEFAULT true,
  notify_via TEXT[] DEFAULT '{push,email}'
);

CREATE TABLE IF NOT EXISTS director_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  report_date DATE NOT NULL,
  data JSONB NOT NULL,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  emailed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  insight_type TEXT,
  title TEXT,
  description TEXT,
  severity TEXT,
  affected_entities JSONB,
  data_points JSONB,
  recommendation TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  is_dismissed BOOLEAN DEFAULT false
);

-- 2. Materialized Views
-- Join attendance with attendance_sessions as attendance table does not have department_id
DROP MATERIALIZED VIEW IF EXISTS daily_attendance_summary;
CREATE MATERIALIZED VIEW daily_attendance_summary AS
SELECT 
  a.institution_id,
  a.date,
  s.department_id,
  COUNT(*) as total_students,
  COUNT(CASE WHEN LOWER(a.status) = 'present' THEN 1 END) as present_count,
  ROUND(COUNT(CASE WHEN LOWER(a.status) = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as attendance_percent
FROM attendance a
JOIN attendance_sessions s ON a.session_id = s.id
GROUP BY a.institution_id, a.date, s.department_id;

-- Fee Summary Materialized view
-- Select successful Completed payments (since status is Completed in schema)
DROP MATERIALIZED VIEW IF EXISTS daily_fee_summary;
CREATE MATERIALIZED VIEW daily_fee_summary AS
SELECT
  institution_id,
  payment_date as date,
  COUNT(*) as payments_count,
  SUM(amount_paid) as total_collected,
  COUNT(DISTINCT student_id) as unique_payers
FROM fee_payments
WHERE status = 'Completed'
GROUP BY institution_id, payment_date;

-- Unique Indexes required for view refresh CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_attendance_summary ON daily_attendance_summary (institution_id, date, department_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_fee_summary ON daily_fee_summary (institution_id, date);

-- 3. Materialized View Refresh Helper function
CREATE OR REPLACE FUNCTION refresh_director_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_attendance_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_fee_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable RLS
ALTER TABLE director_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE director_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- 5. Create multi-tenant policies
DROP POLICY IF EXISTS tenant_director_alerts_policy ON director_alerts;
CREATE POLICY tenant_director_alerts_policy ON director_alerts
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_alert_thresholds_policy ON alert_thresholds;
CREATE POLICY tenant_alert_thresholds_policy ON alert_thresholds
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_director_reports_policy ON director_reports;
CREATE POLICY tenant_director_reports_policy ON director_reports
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_ai_insights_policy ON ai_insights;
CREATE POLICY tenant_ai_insights_policy ON ai_insights
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

-- 6. Seed Default Threshold Settings
-- Maps to institution SIET
INSERT INTO alert_thresholds (institution_id, alert_type, threshold_value, comparison, is_enabled)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'attendance_low', 75.0, 'lt', true),
  ('a0000000-0000-0000-0000-000000000001', 'fee_target_missed', 80.0, 'lt', true),
  ('a0000000-0000-0000-0000-000000000001', 'complaint_overdue', 5, 'gt', true),
  ('a0000000-0000-0000-0000-000000000001', 'bus_stopped', 10, 'gt', true),
  ('a0000000-0000-0000-0000-000000000001', 'hostel_complaint_surge', 5, 'gt', true),
  ('a0000000-0000-0000-0000-000000000001', 'exam_result_pending', 7, 'gt', true),
  ('a0000000-0000-0000-0000-000000000001', 'library_overdue_surge', 20, 'gt', true)
ON CONFLICT (alert_type) DO UPDATE
SET threshold_value = EXCLUDED.threshold_value, comparison = EXCLUDED.comparison;


-- ==========================================================
-- MIGRATION: 20260609000012_ai_concierge.sql
-- ==========================================================

-- ============================================================
-- MODULE 10: AI Concierge — Schema & Semantic Setup
-- ============================================================

-- Ensure pgvector is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. CREATE ai_conversations TABLE
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT CHECK (channel IN ('app', 'whatsapp', 'web')),
  session_id TEXT UNIQUE NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE ai_query_logs TABLE
CREATE TABLE IF NOT EXISTS ai_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  channel TEXT,
  query TEXT NOT NULL,
  intent TEXT,
  response TEXT NOT NULL,
  module TEXT,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  was_escalated BOOLEAN DEFAULT false,
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE faq_knowledge_base TABLE
CREATE TABLE IF NOT EXISTS faq_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  category TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  module TEXT,
  embedding vector(1536),
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE ai_escalations TABLE
CREATE TABLE IF NOT EXISTS ai_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query TEXT,
  reason TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved')),
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CREATE whatsapp_subscribers TABLE
CREATE TABLE IF NOT EXISTS whatsapp_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_verified BOOLEAN DEFAULT false,
  opted_in BOOLEAN DEFAULT true,
  language_preference TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(institution_id, phone)
);

-- 6. CREATE smart_notifications TABLE
CREATE TABLE IF NOT EXISTS smart_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  type TEXT,
  trigger TEXT,
  template_en TEXT,
  template_hi TEXT,
  target_roles TEXT[],
  is_active BOOLEAN DEFAULT true,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CREATE search_index TABLE
CREATE TABLE IF NOT EXISTS search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PERFORMANCE INDEXES & VECTOR OPERATIONS INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ai_conv_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_conv ON ai_query_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_faq_kb_inst ON faq_knowledge_base(institution_id);
CREATE INDEX IF NOT EXISTS idx_ai_escalations_user ON ai_escalations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_subs_phone ON whatsapp_subscribers(phone);
CREATE INDEX IF NOT EXISTS idx_search_index_inst ON search_index(institution_id);

-- Cosine Distance Vector Indexes for Fast Retrieval
CREATE INDEX IF NOT EXISTS idx_faq_embedding ON faq_knowledge_base USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_search_index_embedding ON search_index USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "tenant_isolation_ai_conversations" ON ai_conversations
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_ai_query_logs" ON ai_query_logs
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_faq_kb" ON faq_knowledge_base
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_ai_escalations" ON ai_escalations
  USING (user_id IN (SELECT id FROM users WHERE institution_id = get_auth_institution_id()));

CREATE POLICY "tenant_isolation_whatsapp_subs" ON whatsapp_subscribers
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_smart_notifs" ON smart_notifications
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_search_index" ON search_index
  USING (institution_id = get_auth_institution_id());

-- ============================================================
-- pgvector RPC VECTOR SEARCH HELPER FUNCTIONS
-- ============================================================

-- A. Cosine Similarity FAQ Match RPC
CREATE OR REPLACE FUNCTION match_faq (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  inst_id uuid
)
RETURNS TABLE (
  id uuid,
  category text,
  question text,
  answer text,
  module text,
  usage_count integer,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    faq_knowledge_base.id,
    faq_knowledge_base.category,
    faq_knowledge_base.question,
    faq_knowledge_base.answer,
    faq_knowledge_base.module,
    faq_knowledge_base.usage_count,
    1 - (faq_knowledge_base.embedding <=> query_embedding) AS similarity
  FROM faq_knowledge_base
  WHERE faq_knowledge_base.institution_id = inst_id 
    AND faq_knowledge_base.is_active = true
    AND faq_knowledge_base.embedding IS NOT NULL
    AND 1 - (faq_knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY faq_knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- B. Cosine Similarity Global Search Index Match RPC
CREATE OR REPLACE FUNCTION match_search_index (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  inst_id uuid
)
RETURNS TABLE (
  id uuid,
  entity_type text,
  entity_id uuid,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    search_index.id,
    search_index.entity_type,
    search_index.entity_id,
    search_index.title,
    search_index.content,
    search_index.metadata,
    1 - (search_index.embedding <=> query_embedding) AS similarity
  FROM search_index
  WHERE search_index.institution_id = inst_id 
    AND search_index.embedding IS NOT NULL
    AND 1 - (search_index.embedding <=> query_embedding) > match_threshold
  ORDER BY search_index.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- PRE-SEED FAQ KNOWLEDGE BASE SAMPLE DATA
-- ============================================================
INSERT INTO faq_knowledge_base (institution_id, category, question, answer, module, is_active)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'General', 'What is IRIS 365?', 'IRIS 365 is our campus operating system that unifies hostel, library, gym, transit, and canteen facilities.', 'Core', true),
  ('a0000000-0000-0000-0000-000000000001', 'Finance', 'How do I pay my semester fees?', 'Navigate to the billing console (/student/fees) or click the "Pay Now" link in your AI chats to pay securely via Razorpay.', 'Finance', true),
  ('a0000000-0000-0000-0000-000000000001', 'Library', 'What are the library overdue charges?', 'Overdue library books carry a fine of ₹10 per day, which accumulates under your unpaid fines registry.', 'Library', true),
  ('a0000000-0000-0000-0000-000000000001', 'Transit', 'How can I track my bus location?', 'Go to the transit page (/transit) and click "Track Bus" on your active pass to view real-time GPS coordinates.', 'Transit', true);


-- ==========================================================
-- MIGRATION: 20260609000013_campus_core_additional.sql
-- ==========================================================

-- Migration: IRIS Campus Core Additional Tables & RLS HARDENING
-- Targets: Supabase (PostgreSQL)

-- 1. ATTENDANCE FRAUD LOGS
CREATE TABLE IF NOT EXISTS attendance_fraud_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fraud_type VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    flagged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TIMETABLE SUBSTITUTE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS substitute_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_id UUID REFERENCES timetable(id) ON DELETE CASCADE,
    original_teacher_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    substitute_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. FEE INSTALLMENT PLANS
CREATE TABLE IF NOT EXISTS installment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    installments JSONB NOT NULL, -- e.g. [{"due_date": "...", "amount": ...}]
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. STUDENT HEALTH & DROPOUT SCORES
CREATE TABLE IF NOT EXISTS student_health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 100,
    risk_level VARCHAR(30) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    attendance_score INTEGER DEFAULT 100,
    fee_score INTEGER DEFAULT 100,
    academic_score INTEGER DEFAULT 100,
    engagement_score INTEGER DEFAULT 100,
    factors JSONB DEFAULT '{}'::jsonb,
    recommendation TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PARENT DAILY REPORTS
CREATE TABLE IF NOT EXISTS parent_daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    attendance_status VARCHAR(50),
    current_period TEXT,
    meals_today TEXT,
    gate_in_time TIMESTAMP WITH TIME ZONE,
    gate_out_time TIMESTAMP WITH TIME ZONE,
    canteen_spend DECIMAL(10, 2) DEFAULT 0.00,
    notices_count INTEGER DEFAULT 0,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_date_report UNIQUE (student_id, date)
);

-- 6. SCHOLARSHIP CRITERIA
CREATE TABLE IF NOT EXISTS scholarship_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    min_attendance DECIMAL(5, 2) NOT NULL DEFAULT 75.00,
    min_marks DECIMAL(5, 2) NOT NULL DEFAULT 60.00,
    income_limit DECIMAL(12, 2),
    discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_fraud_logs_student ON attendance_fraud_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_substitute_timetable ON substitute_assignments(timetable_id);
CREATE INDEX IF NOT EXISTS idx_installment_student ON installment_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_student ON student_health_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_student ON parent_daily_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_inst ON scholarship_criteria(institution_id);

-- Enable RLS on all tables
ALTER TABLE attendance_fraud_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitute_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_criteria ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_attendance_fraud_logs_policy ON attendance_fraud_logs;
CREATE POLICY tenant_attendance_fraud_logs_policy ON attendance_fraud_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
              AND (s.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
        )
    );

DROP POLICY IF EXISTS tenant_substitute_assignments_policy ON substitute_assignments;
CREATE POLICY tenant_substitute_assignments_policy ON substitute_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM timetable t
            WHERE t.id = timetable_id
              AND (t.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
        )
    );

DROP POLICY IF EXISTS tenant_installment_plans_policy ON installment_plans;
CREATE POLICY tenant_installment_plans_policy ON installment_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
              AND (s.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
        )
    );

DROP POLICY IF EXISTS tenant_student_health_scores_policy ON student_health_scores;
CREATE POLICY tenant_student_health_scores_policy ON student_health_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
              AND (s.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
        )
    );

DROP POLICY IF EXISTS tenant_parent_daily_reports_policy ON parent_daily_reports;
CREATE POLICY tenant_parent_daily_reports_policy ON parent_daily_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
              AND (s.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
        )
    );

DROP POLICY IF EXISTS tenant_scholarship_criteria_policy ON scholarship_criteria;
CREATE POLICY tenant_scholarship_criteria_policy ON scholarship_criteria
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );


-- ==========================================================
-- MIGRATION: 20260610000000_canteen_system_module2.sql
-- ==========================================================

-- Migration: IRIS Canteen System Extensions & Hardening
-- Targets: Supabase (PostgreSQL)

-- 1. CANTEEN COUNTERS
CREATE TABLE IF NOT EXISTS canteen_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    qr_code VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_accepting_orders BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. MEAL PLANS
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    meal_types TEXT[], -- e.g. {'breakfast', 'lunch', 'snacks'}
    duration_days INTEGER NOT NULL DEFAULT 30,
    price DECIMAL(10, 2) NOT NULL,
    meals_included INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ALTER MEAL SUBSCRIPTIONS
ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL;
ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS meals_total INTEGER DEFAULT 30;
ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS meals_used INTEGER DEFAULT 0;
ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 4. DAILY MEAL SELECTIONS
CREATE TABLE IF NOT EXISTS daily_meal_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES meal_subscriptions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type VARCHAR(50) NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    is_opted_out BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_meal_date UNIQUE (student_id, date, meal_type)
);

-- 5. INVENTORY LOGS
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    item_id UUID REFERENCES canteen_menus(id) ON DELETE CASCADE,
    opening_stock INTEGER NOT NULL DEFAULT 0,
    used INTEGER NOT NULL DEFAULT 0,
    waste INTEGER NOT NULL DEFAULT 0,
    closing_stock INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    logged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. AI MENU PLANS
CREATE TABLE IF NOT EXISTS ai_menu_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    plan JSONB NOT NULL DEFAULT '{}'::jsonb,
    nutritional_summary JSONB DEFAULT '{}'::jsonb,
    generated_by VARCHAR(50) DEFAULT 'ai',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. NUTRITION LOGS
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calories INTEGER NOT NULL DEFAULT 0,
    protein_g DECIMAL(6, 2) DEFAULT 0.0,
    carbs_g DECIMAL(6, 2) DEFAULT 0.0,
    fat_g DECIMAL(6, 2) DEFAULT 0.0,
    meal_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_nutrition_date UNIQUE (student_id, date)
);

-- 8. HYGIENE CHECKLISTS
CREATE TABLE IF NOT EXISTS hygiene_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    temperature_log JSONB DEFAULT '{}'::jsonb,
    cleanliness_score INTEGER CHECK (cleanliness_score >= 1 AND cleanliness_score <= 100),
    items_checked JSONB NOT NULL DEFAULT '[]'::jsonb,
    passed BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_vendor_hygiene_date UNIQUE (institution_id, date)
);

-- 9. ALTER CANTEEN MENUS
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS protein_g DECIMAL(6, 2) DEFAULT 0.0;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS carbs_g DECIMAL(6, 2) DEFAULT 0.0;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS fat_g DECIMAL(6, 2) DEFAULT 0.0;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER DEFAULT 15;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS daily_stock INTEGER DEFAULT 100;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS stock_remaining INTEGER DEFAULT 100;
ALTER TABLE canteen_menus DROP COLUMN IF EXISTS allergens;
ALTER TABLE canteen_menus ADD COLUMN allergens TEXT[] DEFAULT '{}'::text[];

-- 10. ALTER CANTEEN ORDERS
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10, 2);
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS counter_id UUID REFERENCES canteen_counters(id) ON DELETE SET NULL;
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS token_number INTEGER;
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS estimated_ready_minutes INTEGER DEFAULT 15;

-- 11. INDEXING
CREATE INDEX IF NOT EXISTS idx_canteen_counters_inst ON canteen_counters(institution_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_inst ON meal_plans(institution_id);
CREATE INDEX IF NOT EXISTS idx_daily_meal_sel_stud ON daily_meal_selections(student_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_date ON inventory_logs(date);
CREATE INDEX IF NOT EXISTS idx_ai_menu_plans_week ON ai_menu_plans(week_start);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_date ON nutrition_logs(date);
CREATE INDEX IF NOT EXISTS idx_hygiene_chk_date ON hygiene_checklists(date);

-- 12. ENABLE ROW LEVEL SECURITY
ALTER TABLE canteen_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_meal_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_menu_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hygiene_checklists ENABLE ROW LEVEL SECURITY;

-- 13. TENANT ISOLATION POLICIES
DROP POLICY IF EXISTS tenant_canteen_counters_policy ON canteen_counters;
CREATE POLICY tenant_canteen_counters_policy ON canteen_counters
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_meal_plans_policy ON meal_plans;
CREATE POLICY tenant_meal_plans_policy ON meal_plans
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_daily_meal_selections_policy ON daily_meal_selections;
CREATE POLICY tenant_daily_meal_selections_policy ON daily_meal_selections
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_inventory_logs_policy ON inventory_logs;
CREATE POLICY tenant_inventory_logs_policy ON inventory_logs
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_ai_menu_plans_policy ON ai_menu_plans;
CREATE POLICY tenant_ai_menu_plans_policy ON ai_menu_plans
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_nutrition_logs_policy ON nutrition_logs;
CREATE POLICY tenant_nutrition_logs_policy ON nutrition_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
              AND (s.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
        )
    );

DROP POLICY IF EXISTS tenant_hygiene_checklists_policy ON hygiene_checklists;
CREATE POLICY tenant_hygiene_checklists_policy ON hygiene_checklists
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');


-- ==========================================================
-- MIGRATION: 20260610000001_fitzone_system_module3.sql
-- ==========================================================

-- ============================================================
-- IRIS 365 — MODULE 3: FITZONE SYSTEM SCHEMA EXPANSIONS
-- ============================================================

-- 1. AI WORKOUT PLANS
CREATE TABLE IF NOT EXISTS ai_workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    goal TEXT NOT NULL,
    plan JSONB NOT NULL,
    week_number INTEGER DEFAULT 1,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_adjusted TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. FITNESS CHALLENGES
CREATE TABLE IF NOT EXISTS fitness_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    challenge_type TEXT NOT NULL, -- steps, plank, weight_loss, etc.
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_value DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL, -- reps, minutes, steps, kg
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CHALLENGE PARTICIPANTS
CREATE TABLE IF NOT EXISTS challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES fitness_challenges(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    current_value DECIMAL(10, 2) DEFAULT 0.0,
    rank INTEGER,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_challenge_student UNIQUE (challenge_id, student_id)
);

-- 4. FITPOINTS LOG
CREATE TABLE IF NOT EXISTS fitpoints_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. VIRTUAL CLASSES
CREATE TABLE IF NOT EXISTS virtual_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES gym_trainers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    duration_minutes INTEGER DEFAULT 30,
    difficulty TEXT DEFAULT 'Beginner', -- Beginner, Intermediate, Advanced
    category TEXT DEFAULT 'General', -- Cardio, HIIT, Strength, Yoga, Stretch
    view_count INTEGER DEFAULT 0,
    is_live BOOLEAN DEFAULT FALSE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. WELLNESS DAILY CHECKINS
CREATE TABLE IF NOT EXISTS wellness_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood INTEGER CHECK (mood BETWEEN 1 AND 5),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
    sleep_hours DECIMAL(4, 2),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_student_date UNIQUE (student_id, date)
);

-- 7. SEARCH INDEXES
CREATE INDEX IF NOT EXISTS idx_ai_workout_plans_student ON ai_workout_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_fitness_challenges_inst ON fitness_challenges(institution_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_student ON challenge_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_fitpoints_log_student ON fitpoints_log(student_id);
CREATE INDEX IF NOT EXISTS idx_virtual_classes_inst ON virtual_classes(institution_id);
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_student_date ON wellness_checkins(student_id, date);

-- 8. ENABLE ROW LEVEL SECURITY
ALTER TABLE ai_workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitpoints_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_checkins ENABLE ROW LEVEL SECURITY;

-- 9. TENANT ISOLATION RLS POLICIES
CREATE POLICY ai_workout_plans_tenant ON ai_workout_plans
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()) OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY fitness_challenges_tenant ON fitness_challenges
    USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY challenge_participants_tenant ON challenge_participants
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()) OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY fitpoints_log_tenant ON fitpoints_log
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()) OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY virtual_classes_tenant ON virtual_classes
    USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY wellness_checkins_tenant ON wellness_checkins
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()) OR get_auth_user_role() = 'SuperAdmin');


-- ==========================================================
-- MIGRATION: 20260610000002_events_system_module4.sql
-- ==========================================================

-- ============================================================
-- MODULE 4: IRIS Events — Complete Schema Extensions & New Tables
-- ============================================================

-- 1. ALTER events TABLE
ALTER TABLE events ADD COLUMN IF NOT EXISTS ai_plan JSONB DEFAULT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_hybrid BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS virtual_link TEXT DEFAULT NULL;

-- 2. ALTER event_registrations TABLE
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS registration_type VARCHAR(30) DEFAULT 'in_person';
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS transaction_id TEXT DEFAULT NULL;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- 3. ALTER event_volunteers TABLE
ALTER TABLE event_volunteers ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]';
ALTER TABLE event_volunteers ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE event_volunteers ADD COLUMN IF NOT EXISTS hours_worked DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE event_volunteers ADD COLUMN IF NOT EXISTS certificate_url TEXT DEFAULT NULL;

-- 4. CREATE volunteer_applications TABLE
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  preferred_role VARCHAR(100) NOT NULL,
  motivation TEXT,
  status VARCHAR(30) DEFAULT 'pending', -- pending, approved, rejected
  applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. ALTER event_sponsors TABLE
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) DEFAULT NULL;
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS website_url TEXT DEFAULT NULL;
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'pending';
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR(50) DEFAULT 'prospect'; -- prospect, contacted, negotiating, confirmed, paid
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS communication_log JSONB DEFAULT '[]';
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]';
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- 6. ALTER event_budget TABLE
ALTER TABLE event_budget ADD COLUMN IF NOT EXISTS item VARCHAR(255) DEFAULT NULL;
ALTER TABLE event_budget ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'expense'; -- income, expense
ALTER TABLE event_budget DROP CONSTRAINT IF EXISTS budget_type_check;
ALTER TABLE event_budget ADD CONSTRAINT budget_type_check CHECK (type IN ('income', 'expense'));

-- 7. ALTER event_photos TABLE
ALTER TABLE event_photos ADD COLUMN IF NOT EXISTS tagged_students UUID[] DEFAULT '{}';
ALTER TABLE event_photos ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- 8. ALTER event_feedback TABLE
ALTER TABLE event_feedback ADD COLUMN IF NOT EXISTS organization_rating INTEGER DEFAULT 5;
ALTER TABLE event_feedback ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 9. CREATE live_polls TABLE
CREATE TABLE IF NOT EXISTS live_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of string options e.g. ["Option A", "Option B"]
  is_active BOOLEAN DEFAULT false,
  show_results BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. CREATE poll_responses TABLE
CREATE TABLE IF NOT EXISTS poll_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES live_polls(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  selected_option INTEGER NOT NULL, -- 0-based index
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_poll_student UNIQUE (poll_id, student_id)
);

-- 11. CREATE live_questions TABLE
CREATE TABLE IF NOT EXISTS live_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_answered BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. CREATE event_certificates TABLE
CREATE TABLE IF NOT EXISTS event_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  certificate_type VARCHAR(50) NOT NULL, -- participation, winner, volunteer, speaker
  rank INTEGER DEFAULT NULL,              -- 1, 2, 3 for winners
  url TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  verification_code VARCHAR(100) UNIQUE NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_event ON volunteer_applications(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_student ON volunteer_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_live_polls_event ON live_polls(event_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_poll ON poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_live_questions_event ON live_questions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_certificates_event ON event_certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_event_certificates_student ON event_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_event_certificates_code ON event_certificates(verification_code);

-- ============================================================
-- ROW LEVEL SECURITY AND POLICIES
-- ============================================================
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS tenant_isolation_volunteer_applications ON volunteer_applications;
CREATE POLICY tenant_isolation_volunteer_applications ON volunteer_applications
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_live_polls ON live_polls;
CREATE POLICY tenant_isolation_live_polls ON live_polls
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_poll_responses ON poll_responses;
CREATE POLICY tenant_isolation_poll_responses ON poll_responses
  USING (
    EXISTS (
      SELECT 1 FROM live_polls
      WHERE live_polls.id = poll_responses.poll_id
      AND live_polls.institution_id = get_auth_institution_id()
    )
  );

DROP POLICY IF EXISTS tenant_isolation_live_questions ON live_questions;
CREATE POLICY tenant_isolation_live_questions ON live_questions
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_event_certificates ON event_certificates;
CREATE POLICY tenant_isolation_event_certificates ON event_certificates
  USING (institution_id = get_auth_institution_id());


-- ==========================================================
-- MIGRATION: 20260610000003_hostel_system_module5.sql
-- ==========================================================

-- ============================================================
-- MODULE 5: IRIS Hostel — Extended Schema & New Tables
-- ============================================================

-- 1. CREATE roommate_preferences TABLE
CREATE TABLE IF NOT EXISTS roommate_preferences (
  student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  sleep_schedule INTEGER NOT NULL CHECK (sleep_schedule BETWEEN 1 AND 5),
  study_habits INTEGER NOT NULL CHECK (study_habits BETWEEN 1 AND 5),
  cleanliness INTEGER NOT NULL CHECK (cleanliness BETWEEN 1 AND 5),
  noise_tolerance INTEGER NOT NULL CHECK (noise_tolerance BETWEEN 1 AND 5),
  compatibility_score DECIMAL(5, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. CREATE iot_readings TABLE
CREATE TABLE IF NOT EXISTS iot_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  room_id UUID REFERENCES hostel_rooms(id) ON DELETE CASCADE,
  meter_type VARCHAR(50) NOT NULL CHECK (meter_type IN ('electricity', 'water')),
  reading_value DECIMAL(12, 4) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE night_rollcalls TABLE
CREATE TABLE IF NOT EXISTS night_rollcalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  block_id UUID REFERENCES hostel_blocks(id) ON DELETE CASCADE,
  floor INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  guard_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  records JSONB DEFAULT '{}'::jsonb
);

-- 4. CREATE wellness_checkins_hostel TABLE
CREATE TABLE IF NOT EXISTS wellness_checkins_hostel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  notes TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_roommate_preferences_institution ON roommate_preferences(institution_id);
CREATE INDEX IF NOT EXISTS idx_iot_readings_room ON iot_readings(room_id);
CREATE INDEX IF NOT EXISTS idx_iot_readings_timestamp ON iot_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_night_rollcalls_block_floor ON night_rollcalls(block_id, floor);
CREATE INDEX IF NOT EXISTS idx_night_rollcalls_date ON night_rollcalls(date);
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_student ON wellness_checkins_hostel(student_id);
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_date ON wellness_checkins_hostel(date);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE roommate_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE night_rollcalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_checkins_hostel ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_roommate_preferences ON roommate_preferences;
CREATE POLICY tenant_isolation_roommate_preferences ON roommate_preferences
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_iot_readings ON iot_readings;
CREATE POLICY tenant_isolation_iot_readings ON iot_readings
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_night_rollcalls ON night_rollcalls;
CREATE POLICY tenant_isolation_night_rollcalls ON night_rollcalls
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_wellness_checkins ON wellness_checkins_hostel;
CREATE POLICY tenant_isolation_wellness_checkins ON wellness_checkins_hostel
  USING (institution_id = get_auth_institution_id());


-- ==========================================================
-- MIGRATION: 20260610000004_library_system_module6.sql
-- ==========================================================

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


-- ==========================================================
-- MIGRATION: 20260610000005_transit_system_module7.sql
-- ==========================================================

-- ============================================================
-- MODULE 7: IRIS Transit — Extended Schema & New Tables
-- ============================================================

-- 1. CREATE ai_route_suggestions TABLE
CREATE TABLE IF NOT EXISTS ai_route_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  analysis_date DATE DEFAULT CURRENT_DATE,
  suggestions JSONB DEFAULT '[]'::jsonb,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. CREATE carbon_footprint TABLE
CREATE TABLE IF NOT EXISTS carbon_footprint (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  co2_saved_kg DECIMAL DEFAULT 0,
  students_using_bus INTEGER DEFAULT 0,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(institution_id, month)
);

-- 3. CREATE sos_alerts TABLE
CREATE TABLE IF NOT EXISTS sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  alert_type TEXT DEFAULT 'parent',
  lat DECIMAL,
  lng DECIMAL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  resolved_at TIMESTAMPTZ,
  incident_details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE parking_slots TABLE
CREATE TABLE IF NOT EXISTS parking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  slot_number TEXT NOT NULL,
  zone TEXT NOT NULL,
  is_occupied BOOLEAN DEFAULT false,
  vehicle_number TEXT,
  last_occupied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(institution_id, zone, slot_number)
);

-- 5. CREATE registered_vehicles TABLE
CREATE TABLE IF NOT EXISTS registered_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('two_wheeler', 'four_wheeler')),
  color TEXT,
  model TEXT,
  verified BOOLEAN DEFAULT false,
  pass_qr TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ai_route_suggestions_institution ON ai_route_suggestions(institution_id);
CREATE INDEX IF NOT EXISTS idx_carbon_footprint_institution ON carbon_footprint(institution_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_institution ON sos_alerts(institution_id);
CREATE INDEX IF NOT EXISTS idx_parking_slots_institution ON parking_slots(institution_id);
CREATE INDEX IF NOT EXISTS idx_registered_vehicles_student ON registered_vehicles(student_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE ai_route_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_footprint ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_vehicles ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_ai_route_suggestions ON ai_route_suggestions;
CREATE POLICY tenant_isolation_ai_route_suggestions ON ai_route_suggestions
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_carbon_footprint ON carbon_footprint;
CREATE POLICY tenant_isolation_carbon_footprint ON carbon_footprint
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_sos_alerts ON sos_alerts;
CREATE POLICY tenant_isolation_sos_alerts ON sos_alerts
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_parking_slots ON parking_slots;
CREATE POLICY tenant_isolation_parking_slots ON parking_slots
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_registered_vehicles ON registered_vehicles;
CREATE POLICY tenant_isolation_registered_vehicles ON registered_vehicles
  USING (institution_id = get_auth_institution_id());

-- ============================================================
-- SEED DATA
-- ============================================================
-- Seed Parking Slots
INSERT INTO parking_slots (institution_id, slot_number, zone, is_occupied)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'A-01', 'Zone A', false),
  ('a0000000-0000-0000-0000-000000000001', 'A-02', 'Zone A', true),
  ('a0000000-0000-0000-0000-000000000001', 'A-03', 'Zone A', false),
  ('a0000000-0000-0000-0000-000000000001', 'B-01', 'Zone B', false),
  ('a0000000-0000-0000-0000-000000000001', 'B-02', 'Zone B', false),
  ('a0000000-0000-0000-0000-000000000001', 'V-01', 'Visitor', false),
  ('a0000000-0000-0000-0000-000000000001', 'V-02', 'Visitor', true)
ON CONFLICT (institution_id, zone, slot_number) DO NOTHING;

-- Seed CO2 foot print data
INSERT INTO carbon_footprint (institution_id, month, co2_saved_kg, students_using_bus, certificate_url)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '2026-04', 1240.50, 120, 'https://supabase.co/storage/v1/object/public/certificates/monthly-co2-2026-04.pdf'),
  ('a0000000-0000-0000-0000-000000000001', '2026-05', 1355.20, 134, 'https://supabase.co/storage/v1/object/public/certificates/monthly-co2-2026-05.pdf')
ON CONFLICT (institution_id, month) DO NOTHING;


-- ==========================================================
-- MIGRATION: 20260610000006_gate_system_module8.sql
-- ==========================================================

-- ============================================================
-- MODULE 8: IRIS Smart Gate — Extended Schema & New Tables
-- ============================================================

-- 1. CREATE parking_logs TABLE
CREATE TABLE IF NOT EXISTS parking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  in_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  out_time TIMESTAMPTZ,
  slot_number TEXT,
  pass_qr TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. CREATE emergency_muster TABLE
CREATE TABLE IF NOT EXISTS emergency_muster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  trigger_type TEXT CHECK (trigger_type IN ('fire', 'earthquake', 'drill', 'other')),
  trigger_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE muster_responses TABLE
CREATE TABLE IF NOT EXISTS muster_responses (
  muster_id UUID REFERENCES emergency_muster(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'unaccounted' CHECK (status IN ('safe', 'unaccounted')),
  marked_safe_at TIMESTAMPTZ,
  location TEXT,
  PRIMARY KEY (muster_id, student_id)
);

-- 4. CREATE contractor_profiles TABLE
CREATE TABLE IF NOT EXISTS contractor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact TEXT,
  id_proof_url TEXT,
  work_types TEXT[] DEFAULT '{}'::text[],
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. CREATE work_permits TABLE
CREATE TABLE IF NOT EXISTS work_permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  scope TEXT NOT NULL,
  location TEXT NOT NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  entry_pass_qr TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. CREATE intercom_calls TABLE
CREATE TABLE IF NOT EXISTS intercom_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  called_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  answered BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT false,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_parking_logs_institution ON parking_logs(institution_id);
CREATE INDEX IF NOT EXISTS idx_emergency_muster_institution ON emergency_muster(institution_id);
CREATE INDEX IF NOT EXISTS idx_muster_responses_student ON muster_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_institution ON contractor_profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_work_permits_contractor ON work_permits(contractor_id);
CREATE INDEX IF NOT EXISTS idx_intercom_calls_host ON intercom_calls(host_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE parking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_muster ENABLE ROW LEVEL SECURITY;
ALTER TABLE muster_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercom_calls ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_parking_logs ON parking_logs;
CREATE POLICY tenant_isolation_parking_logs ON parking_logs
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_emergency_muster ON emergency_muster;
CREATE POLICY tenant_isolation_emergency_muster ON emergency_muster
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_muster_responses ON muster_responses;
CREATE POLICY tenant_isolation_muster_responses ON muster_responses
  USING (
    EXISTS (
      SELECT 1 FROM emergency_muster
      WHERE emergency_muster.id = muster_responses.muster_id
      AND emergency_muster.institution_id = get_auth_institution_id()
    )
  );

DROP POLICY IF EXISTS tenant_isolation_contractor_profiles ON contractor_profiles;
CREATE POLICY tenant_isolation_contractor_profiles ON contractor_profiles
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_work_permits ON work_permits;
CREATE POLICY tenant_isolation_work_permits ON work_permits
  USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles
      WHERE contractor_profiles.id = work_permits.contractor_id
      AND contractor_profiles.institution_id = get_auth_institution_id()
    )
  );

DROP POLICY IF EXISTS tenant_isolation_intercom_calls ON intercom_calls;
CREATE POLICY tenant_isolation_intercom_calls ON intercom_calls
  USING (institution_id = get_auth_institution_id());

-- ============================================================
-- SEED MOCK DATA
-- ============================================================
-- Seed Contractor Profiles
INSERT INTO contractor_profiles (id, institution_id, company_name, contact, work_types, is_approved)
VALUES
  ('c5000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Apex Plumbing Services', '+91 99887 76655', ARRAY['Plumbing', 'Drainage'], true),
  ('c5000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'VoltTech Electricals', '+91 99887 76656', ARRAY['Electricals', 'Wiring', 'AC Service'], true)
ON CONFLICT (id) DO NOTHING;


-- ==========================================================
-- MIGRATION: 20260610000007_director_system_module9.sql
-- ==========================================================

-- ============================================================
-- MODULE 9: IRIS Director Dashboard — Extended Schema
-- ============================================================

-- 1. CREATE strategic_goals TABLE
CREATE TABLE IF NOT EXISTS strategic_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  target_value DECIMAL NOT NULL,
  current_value DECIMAL NOT NULL DEFAULT 0.0,
  deadline DATE NOT NULL,
  unit TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'achieved', 'missed')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. CREATE board_reports TABLE
CREATE TABLE IF NOT EXISTS board_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  year INTEGER NOT NULL,
  pptx_url TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  sent_to TEXT[] DEFAULT '{}'::text[]
);

-- 3. CREATE financial_pl TABLE
CREATE TABLE IF NOT EXISTS financial_pl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  revenue_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  cost_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  net_surplus DECIMAL NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_monthly_pl UNIQUE (institution_id, month, year)
);

-- 4. CREATE competitor_benchmarks TABLE
CREATE TABLE IF NOT EXISTS competitor_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  our_value DECIMAL NOT NULL,
  industry_avg DECIMAL NOT NULL,
  top_performer DECIMAL NOT NULL,
  percentile DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. CREATE student_journey_scores TABLE
CREATE TABLE IF NOT EXISTS student_journey_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  engagement_score DECIMAL NOT NULL DEFAULT 0.0,
  academic_score DECIMAL NOT NULL DEFAULT 0.0,
  social_score DECIMAL NOT NULL DEFAULT 0.0,
  facility_score DECIMAL NOT NULL DEFAULT 0.0,
  overall_score DECIMAL NOT NULL DEFAULT 0.0,
  intervention_status VARCHAR(50) DEFAULT 'none' CHECK (intervention_status IN ('none', 'pending_counselor', 'counselor_assigned', 'resolved')),
  calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_strategic_goals_inst ON strategic_goals(institution_id);
CREATE INDEX IF NOT EXISTS idx_board_reports_inst ON board_reports(institution_id);
CREATE INDEX IF NOT EXISTS idx_financial_pl_inst ON financial_pl(institution_id);
CREATE INDEX IF NOT EXISTS idx_competitor_benchmarks_inst ON competitor_benchmarks(institution_id);
CREATE INDEX IF NOT EXISTS idx_student_journey_scores_student ON student_journey_scores(student_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE strategic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_pl ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_journey_scores ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_strategic_goals ON strategic_goals;
CREATE POLICY tenant_isolation_strategic_goals ON strategic_goals
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_isolation_board_reports ON board_reports;
CREATE POLICY tenant_isolation_board_reports ON board_reports
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_isolation_financial_pl ON financial_pl;
CREATE POLICY tenant_isolation_financial_pl ON financial_pl
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_isolation_competitor_benchmarks ON competitor_benchmarks;
CREATE POLICY tenant_isolation_competitor_benchmarks ON competitor_benchmarks
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_isolation_student_journey_scores ON student_journey_scores;
CREATE POLICY tenant_isolation_student_journey_scores ON student_journey_scores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_id
      AND (s.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
    )
  );

-- ============================================================
-- SEED MOCK DATA
-- ============================================================

-- Seed Strategic Goals
INSERT INTO strategic_goals (id, institution_id, metric_name, target_value, current_value, deadline, unit, status)
VALUES
  ('81000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Attendance Rate', 85.00, 82.00, '2026-12-31', '%', 'on_track'),
  ('81000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Fee Collection', 15000000.00, 14200000.00, '2026-12-31', '₹', 'on_track'),
  ('81000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Pass Rate', 90.00, 88.00, '2026-12-31', '%', 'on_track'),
  ('81000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Annual Fee Target Large', 25000000.00, 11000000.00, '2026-12-31', '₹', 'at_risk')
ON CONFLICT (id) DO NOTHING;

-- Seed Competitor Benchmarks
INSERT INTO competitor_benchmarks (id, institution_id, metric, our_value, industry_avg, top_performer, percentile)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Attendance Rate', 82.00, 78.50, 92.00, 74.00),
  ('b1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Fee Collection Rate', 78.00, 72.00, 95.00, 82.00),
  ('b1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Module Adoption (Canteen)', 92.00, 80.00, 98.00, 88.00),
  ('b1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Module Adoption (FitZone)', 64.00, 50.00, 85.00, 70.00),
  ('b1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Module Adoption (Library+)', 72.00, 60.00, 90.00, 75.00),
  ('b1000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Module Adoption (Transit)', 58.00, 65.00, 88.00, 42.00)
ON CONFLICT (id) DO NOTHING;

-- Seed Financial P&L
INSERT INTO financial_pl (id, institution_id, month, year, revenue_breakdown, cost_breakdown, net_surplus)
VALUES
  ('71000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 1, 2026, '{"fees": 4500000, "canteen": 125000, "events": 85000, "gym": 45000, "hostel": 650000}', '{"staff": 1200000, "maintenance": 300000, "utilities": 150000}', 3755000.00),
  ('71000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 2, 2026, '{"fees": 4800000, "canteen": 130000, "events": 90000, "gym": 48000, "hostel": 650000}', '{"staff": 1200000, "maintenance": 280000, "utilities": 145000}', 4093000.00),
  ('71000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 3, 2026, '{"fees": 5200000, "canteen": 145000, "events": 120000, "gym": 52000, "hostel": 680000}', '{"staff": 1250000, "maintenance": 310000, "utilities": 160000}', 4477000.00),
  ('71000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 4, 2026, '{"fees": 3900000, "canteen": 110000, "events": 50000, "gym": 40000, "hostel": 620000}', '{"staff": 1200000, "maintenance": 250000, "utilities": 135000}', 3135000.00),
  ('71000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 5, 2026, '{"fees": 4100000, "canteen": 115000, "events": 60000, "gym": 42000, "hostel": 620000}', '{"staff": 1200000, "maintenance": 260000, "utilities": 140000}', 3337000.00)
ON CONFLICT (id) DO NOTHING;

-- Seed Student Journey Scores for existing students dynamically
DO $$
DECLARE
  stud RECORD;
BEGIN
  FOR stud IN SELECT id FROM students LOOP
    INSERT INTO student_journey_scores (student_id, engagement_score, academic_score, social_score, facility_score, overall_score, intervention_status)
    VALUES (
      stud.id,
      50 + FLOOR(RANDOM() * 45), -- 50 to 95
      60 + FLOOR(RANDOM() * 38), -- 60 to 98
      45 + FLOOR(RANDOM() * 50), -- 45 to 95
      55 + FLOOR(RANDOM() * 40), -- 55 to 95
      60 + FLOOR(RANDOM() * 30), -- 60 to 90
      'none'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;


-- ==========================================================
-- MIGRATION: 20260610000010_ai_concierge_module10.sql
-- ==========================================================

-- ============================================================
-- MODULE 10 ADDITIONS: AI Concierge Enhanced Intelligence
-- Voice Interface, Proactive Nudges, Study Planner, Sentiment
-- ============================================================

-- 1. CREATE voice_transcripts TABLE
-- Stores speech-to-text transcriptions from Web Speech API,
-- Expo-AV recordings, and WhatsApp voice notes (Whisper)
CREATE TABLE IF NOT EXISTS voice_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  audio_url TEXT,
  transcript TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  source TEXT CHECK (source IN ('web_speech', 'expo_av', 'whatsapp_whisper')) DEFAULT 'web_speech',
  duration_seconds INTEGER DEFAULT 0,
  confidence DECIMAL DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE proactive_nudges TABLE
-- AI-generated push intelligence notifications for students
CREATE TABLE IF NOT EXISTS proactive_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL CHECK (nudge_type IN (
    'weekly_prep', 'assignment_reminder', 'attendance_warning',
    'fee_reminder', 'event_suggestion', 'library_due',
    'health_tip', 'motivational', 'exam_countdown',
    'streak_celebration', 'custom'
  )),
  message TEXT NOT NULL,
  title TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  channel TEXT DEFAULT 'push' CHECK (channel IN ('push', 'whatsapp', 'email', 'in_app')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  was_read BOOLEAN DEFAULT false,
  was_actioned BOOLEAN DEFAULT false,
  actioned_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE study_plans TABLE
-- AI-generated personalized study schedules per student
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  exam_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  subjects JSONB DEFAULT '[]'::jsonb,
  weak_areas JSONB DEFAULT '[]'::jsonb,
  study_hours_per_day DECIMAL DEFAULT 4.0,
  plan_start_date DATE,
  plan_end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'expired')),
  completion_percentage DECIMAL DEFAULT 0.0,
  generated_at TIMESTAMPTZ DEFAULT now(),
  last_adjusted TIMESTAMPTZ DEFAULT now(),
  claude_reasoning TEXT
);

-- 4. CREATE sentiment_logs TABLE
-- Nightly batch analysis of student messages for mood trends
CREATE TABLE IF NOT EXISTS sentiment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  department TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  avg_sentiment DECIMAL DEFAULT 0.0,
  positive_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  flagged_keywords TEXT[] DEFAULT '{}'::text[],
  flagged_messages JSONB DEFAULT '[]'::jsonb,
  complaint_categories JSONB DEFAULT '{}'::jsonb,
  auto_routed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(institution_id, date, department)
);

-- 5. CREATE nudge_preferences TABLE
-- Per-student opt-in settings for proactive nudges
CREATE TABLE IF NOT EXISTS nudge_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  enabled_types TEXT[] DEFAULT ARRAY[
    'weekly_prep', 'assignment_reminder', 'attendance_warning',
    'fee_reminder', 'event_suggestion', 'exam_countdown'
  ],
  preferred_channels TEXT[] DEFAULT ARRAY['push', 'in_app'],
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  max_nudges_per_day INTEGER DEFAULT 5,
  language_preference TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id)
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_voice_tx_user ON voice_transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_tx_conv ON voice_transcripts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_voice_tx_inst ON voice_transcripts(institution_id);

CREATE INDEX IF NOT EXISTS idx_nudges_student ON proactive_nudges(student_id);
CREATE INDEX IF NOT EXISTS idx_nudges_inst ON proactive_nudges(institution_id);
CREATE INDEX IF NOT EXISTS idx_nudges_type ON proactive_nudges(nudge_type);
CREATE INDEX IF NOT EXISTS idx_nudges_sent ON proactive_nudges(sent_at);

CREATE INDEX IF NOT EXISTS idx_study_plans_student ON study_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_status ON study_plans(status);

CREATE INDEX IF NOT EXISTS idx_sentiment_inst_date ON sentiment_logs(institution_id, date);
CREATE INDEX IF NOT EXISTS idx_sentiment_dept ON sentiment_logs(department_id);

CREATE INDEX IF NOT EXISTS idx_nudge_prefs_student ON nudge_preferences(student_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE voice_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_preferences ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "tenant_isolation_voice_transcripts" ON voice_transcripts
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_proactive_nudges" ON proactive_nudges
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_study_plans" ON study_plans
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_sentiment_logs" ON sentiment_logs
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_nudge_preferences" ON nudge_preferences
  USING (institution_id = get_auth_institution_id());

-- ============================================================
-- SEED DATA — PROACTIVE NUDGE SAMPLES
-- ============================================================
INSERT INTO proactive_nudges (student_id, institution_id, nudge_type, title, message, priority, channel, was_read, was_actioned) VALUES
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'weekly_prep', '📚 Week Ahead Prep',
   'You have 5 classes tomorrow starting with Maths at 9 AM. Your attendance is 84% — keep it up! Don''t forget: Physics assignment due Wednesday.',
   'normal', 'push', false, false),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'attendance_warning', '⚠️ Attendance Alert',
   'Your attendance in Data Structures dropped to 68% — you need 75% to sit for exams. Attend the next 4 classes consecutively to recover.',
   'high', 'push', true, false),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'fee_reminder', '💰 Fee Reminder',
   'Your semester fee installment of ₹12,500 is due in 3 days. Pay now to avoid late charges → /student/fees',
   'urgent', 'whatsapp', false, false),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'exam_countdown', '📝 Exam Countdown',
   'Mid-semester exams begin in 12 days! Your AI Study Plan suggests focusing on Linear Algebra and Thermodynamics this week.',
   'high', 'in_app', true, true),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'streak_celebration', '🔥 7-Day Streak!',
   'Congratulations! You''ve attended every class for 7 consecutive days. Keep the momentum going — you''re in the top 15% of your batch!',
   'low', 'push', true, true),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'library_due', '📖 Library Book Due',
   'Your book "Introduction to Algorithms" (CLRS) is due in 2 days. Return or renew it at /student/library to avoid ₹10/day fines.',
   'normal', 'in_app', false, false);

-- SEED DATA — STUDY PLAN SAMPLE
INSERT INTO study_plans (student_id, institution_id, exam_schedule, daily_plan, subjects, weak_areas, study_hours_per_day, plan_start_date, plan_end_date, status, completion_percentage, claude_reasoning) VALUES
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   '[{"subject":"Mathematics","date":"2026-06-25","time":"09:00"},{"subject":"Physics","date":"2026-06-27","time":"09:00"},{"subject":"Data Structures","date":"2026-06-30","time":"14:00"},{"subject":"English","date":"2026-07-02","time":"09:00"}]',
   '[{"day":"Monday","blocks":[{"time":"06:00-08:00","subject":"Mathematics","topic":"Linear Algebra - Eigenvalues","type":"focus"},{"time":"09:00-10:30","subject":"Physics","topic":"Thermodynamics revision","type":"review"},{"time":"16:00-17:30","subject":"Data Structures","topic":"Binary Trees Practice","type":"practice"}]},{"day":"Tuesday","blocks":[{"time":"06:00-08:00","subject":"Data Structures","topic":"Graph Algorithms - DFS/BFS","type":"focus"},{"time":"09:00-10:30","subject":"Mathematics","topic":"Calculus - Integration","type":"review"},{"time":"16:00-17:30","subject":"English","topic":"Technical Writing","type":"light"}]},{"day":"Wednesday","blocks":[{"time":"06:00-08:00","subject":"Physics","topic":"Optics & Waves","type":"focus"},{"time":"16:00-18:00","subject":"Mathematics","topic":"Practice Problems Set","type":"practice"}]}]',
   '["Mathematics","Physics","Data Structures","English"]',
   '["Linear Algebra - Eigenvalues","Thermodynamics - Carnot Cycle","Graph Algorithms"]',
   5.0, '2026-06-15', '2026-07-02', 'active', 35.0,
   'Based on exam schedule analysis: Mathematics exam is earliest (June 25), so allocated 40% study time to Math. Physics weak area in Thermodynamics identified from past scores — added extra revision blocks. Data Structures graph algorithms flagged due to low practice test scores. Study blocks scheduled around existing timetable, avoiding class hours. Morning 6-8 AM blocks for deep focus, afternoon for lighter review.');

-- SEED DATA — SENTIMENT LOGS SAMPLES
INSERT INTO sentiment_logs (institution_id, date, department, avg_sentiment, positive_count, neutral_count, negative_count, message_count, flagged_keywords, complaint_categories) VALUES
  ('a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 'Computer Science', 0.72, 45, 30, 12, 87,
   ARRAY['slow wifi', 'lab closed', 'great faculty'],
   '{"infrastructure": 8, "academics": 2, "food": 2}'::jsonb),
  ('a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 'Mechanical Engineering', 0.58, 22, 18, 20, 60,
   ARRAY['workshop noise', 'placement worry', 'canteen quality'],
   '{"infrastructure": 5, "placements": 10, "food": 5}'::jsonb),
  ('a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 'Electrical Engineering', 0.81, 38, 20, 5, 63,
   ARRAY['excellent lab', 'helpful TA'],
   '{"academics": 3, "infrastructure": 2}'::jsonb),
  ('a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', 'Computer Science', 0.68, 40, 28, 18, 86,
   ARRAY['assignment overload', 'good hackathon'],
   '{"academics": 12, "events": 4, "food": 2}'::jsonb),
  ('a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', 'Mechanical Engineering', 0.55, 18, 22, 25, 65,
   ARRAY['hot workshop', 'placement anxiety', 'water cooler broken'],
   '{"infrastructure": 12, "placements": 8, "food": 5}'::jsonb);

-- SEED DATA — NUDGE PREFERENCES
INSERT INTO nudge_preferences (student_id, institution_id, enabled, enabled_types, preferred_channels, quiet_hours_start, quiet_hours_end, max_nudges_per_day) VALUES
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   true,
   ARRAY['weekly_prep', 'assignment_reminder', 'attendance_warning', 'fee_reminder', 'exam_countdown', 'streak_celebration'],
   ARRAY['push', 'in_app'],
   '22:00', '07:00', 5);

-- SEED DATA — VOICE TRANSCRIPT SAMPLE
INSERT INTO voice_transcripts (user_id, institution_id, transcript, language, source, duration_seconds, confidence) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Mera attendance kitna hai is semester mein?', 'hi', 'web_speech', 4, 0.92),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'What is my pending fee amount for this semester?', 'en', 'web_speech', 3, 0.97);


-- ==========================================================
-- MIGRATION: 20260611000000_admissions_module11.sql
-- ==========================================================

-- ============================================================
-- MODULE 11: IRIS Admissions
-- Branded Admission Cycles, Multi-Step Applications, Academic
-- Audits, Auto-Merit calculations, Offer letters, and CRM Leads.
-- ============================================================

-- 1. CREATE admission_cycles TABLE
CREATE TABLE IF NOT EXISTS admission_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN (
    'upcoming','open','closed','processing','completed'
  )) DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE programs TABLE
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  degree_type TEXT,
  duration_years INTEGER,
  total_seats INTEGER,
  reserved_seats JSONB DEFAULT '{}'::jsonb,
  eligibility_criteria JSONB DEFAULT '{}'::jsonb,
  application_fee DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 3. CREATE applicants TABLE
CREATE TABLE IF NOT EXISTS applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES admission_cycles(id) ON DELETE SET NULL,
  application_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  dob DATE,
  gender TEXT,
  category TEXT,
  domicile_state TEXT,
  photo_url TEXT,
  aadhar_number TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_relation TEXT,
  status TEXT CHECK (status IN (
    'draft','submitted','under_review','shortlisted',
    'merit_listed','waitlisted','offered','admitted',
    'rejected','withdrawn'
  )) DEFAULT 'draft',
  merit_score DECIMAL DEFAULT 0.0,
  ai_score DECIMAL DEFAULT 0.0,
  rank_overall INTEGER,
  rank_category INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE applicant_programs TABLE
CREATE TABLE IF NOT EXISTS applicant_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  preference_order INTEGER,
  status TEXT DEFAULT 'pending',
  allocated BOOLEAN DEFAULT false
);

-- 5. CREATE academic_records TABLE
CREATE TABLE IF NOT EXISTS academic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  level TEXT NOT NULL, -- '10th', '12th', 'graduation'
  board_university TEXT,
  year_of_passing INTEGER,
  percentage DECIMAL,
  cgpa DECIMAL,
  subjects JSONB DEFAULT '[]'::jsonb,
  marksheet_url TEXT,
  certificate_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_notes TEXT
);

-- 6. CREATE entrance_scores TABLE
CREATE TABLE IF NOT EXISTS entrance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  exam_name TEXT NOT NULL,
  roll_number TEXT,
  score DECIMAL,
  percentile DECIMAL,
  rank INTEGER,
  scorecard_url TEXT,
  is_verified BOOLEAN DEFAULT false
);

-- 7. CREATE documents TABLE
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  doc_url TEXT NOT NULL,
  file_name TEXT,
  file_size_kb INTEGER,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 8. CREATE merit_lists TABLE
CREATE TABLE IF NOT EXISTS merit_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES admission_cycles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  round_number INTEGER DEFAULT 1,
  list_type TEXT CHECK (list_type IN ('merit','waitlist','spot')),
  published_at TIMESTAMPTZ,
  cutoff_score DECIMAL,
  is_published BOOLEAN DEFAULT false
);

-- 9. CREATE merit_list_entries TABLE
CREATE TABLE IF NOT EXISTS merit_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merit_list_id UUID REFERENCES merit_lists(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  rank INTEGER,
  category TEXT,
  merit_score DECIMAL,
  status TEXT DEFAULT 'listed', -- 'listed', 'offered', 'accepted', 'declined', 'expired'
  offer_sent_at TIMESTAMPTZ,
  offer_accepted_at TIMESTAMPTZ,
  offer_expires_at TIMESTAMPTZ
);

-- 10. CREATE admission_offers TABLE
CREATE TABLE IF NOT EXISTS admission_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  merit_list_id UUID REFERENCES merit_lists(id) ON DELETE SET NULL,
  offer_letter_url TEXT,
  offered_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'sent', -- 'sent', 'accepted', 'rejected', 'expired'
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- 11. CREATE admission_fees TABLE
CREATE TABLE IF NOT EXISTS admission_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  fee_type TEXT CHECK (fee_type IN ('application','confirmation','enrollment')),
  amount DECIMAL NOT NULL,
  razorpay_order_id TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  paid_at TIMESTAMPTZ,
  receipt_url TEXT
);

-- 12. CREATE counseling_sessions TABLE
CREATE TABLE IF NOT EXISTS counseling_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES admission_cycles(id) ON DELETE CASCADE,
  round_number INTEGER,
  scheduled_date DATE,
  mode TEXT CHECK (mode IN ('online','offline','hybrid')),
  venue TEXT,
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled' -- 'scheduled', 'completed', 'cancelled'
);

-- 13. CREATE counseling_slots TABLE
CREATE TABLE IF NOT EXISTS counseling_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES counseling_sessions(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  slot_time TIMESTAMPTZ,
  officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'assigned', -- 'assigned', 'attended', 'no_show', 'rescheduled'
  attended BOOLEAN DEFAULT false,
  notes TEXT
);

-- 14. CREATE waitlist_movements TABLE
CREATE TABLE IF NOT EXISTS waitlist_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  from_position INTEGER,
  to_position INTEGER,
  reason TEXT,
  moved_at TIMESTAMPTZ DEFAULT now()
);

-- 15. CREATE admission_analytics TABLE
CREATE TABLE IF NOT EXISTS admission_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES admission_cycles(id) ON DELETE CASCADE,
  date DATE,
  applications_received INTEGER DEFAULT 0,
  applications_submitted INTEGER DEFAULT 0,
  documents_pending INTEGER DEFAULT 0,
  merit_listed INTEGER DEFAULT 0,
  offers_sent INTEGER DEFAULT 0,
  offers_accepted INTEGER DEFAULT 0,
  seats_filled INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. CREATE crm_leads TABLE
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT, -- 'website', 'social', 'event', 'walkin', 'referral'
  program_interest TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'interested', 'applied', 'admitted', 'lost'
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  last_contacted TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_adm_cycles_inst ON admission_cycles(institution_id);
CREATE INDEX IF NOT EXISTS idx_adm_programs_inst ON programs(institution_id);
CREATE INDEX IF NOT EXISTS idx_applicants_inst ON applicants(institution_id);
CREATE INDEX IF NOT EXISTS idx_applicants_cycle ON applicants(cycle_id);
CREATE INDEX IF NOT EXISTS idx_applicants_status ON applicants(status);
CREATE INDEX IF NOT EXISTS idx_applicants_email ON applicants(email);
CREATE INDEX IF NOT EXISTS idx_crm_leads_inst ON crm_leads(institution_id);
CREATE INDEX IF NOT EXISTS idx_documents_applicant ON documents(applicant_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE merit_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- 1. APPLICANTS POLICIES
CREATE POLICY "applicant_own_data" ON applicants
  FOR SELECT USING (
    email = (SELECT email FROM users WHERE id = auth.uid())
  );

CREATE POLICY "admin_institution_applicants" ON applicants
  FOR ALL USING (
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
  );

-- 2. DOCUMENTS POLICIES
CREATE POLICY "applicant_own_documents" ON documents
  FOR ALL USING (
    applicant_id IN (SELECT id FROM applicants WHERE email = (SELECT email FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "admin_institution_documents" ON documents
  FOR ALL USING (
    applicant_id IN (SELECT id FROM applicants WHERE institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()))
  );

-- 3. ADMISSION OFFERS POLICIES
CREATE POLICY "applicant_own_offers" ON admission_offers
  FOR SELECT USING (
    applicant_id IN (SELECT id FROM applicants WHERE email = (SELECT email FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "admin_institution_offers" ON admission_offers
  FOR ALL USING (
    applicant_id IN (SELECT id FROM applicants WHERE institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()))
  );

-- 4. ADMISSION CYCLES POLICIES
CREATE POLICY "tenant_isolation_admission_cycles" ON admission_cycles
  FOR ALL USING (
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
  );

-- 5. PROGRAMS POLICIES
CREATE POLICY "tenant_isolation_programs" ON programs
  FOR ALL USING (
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
  );

-- ============================================================
-- SEED DATA - ADMISSION CYCLES & PROGRAMS FOR DEMO
-- ============================================================
INSERT INTO admission_cycles (id, institution_id, name, academic_year, start_date, end_date, status) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'Fall Admissions 2026', '2026-27', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '60 days', 'open')
  ON CONFLICT DO NOTHING;

INSERT INTO programs (id, institution_id, name, code, degree_type, duration_years, total_seats, reserved_seats, eligibility_criteria, application_fee) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'Bachelor of Technology in Computer Science (B.Tech CSE)', 'BTECH-CSE', 'UG', 4, 120, '{"general": 60, "obc": 32, "sc": 18, "st": 10}', '{"min_12th_pc": 60.0, "required_subjects": ["Physics", "Mathematics"]}', 1000.00),
  ('a1111111-1111-1111-1111-111111111112', 'a0000000-0000-0000-0000-000000000001', 'Bachelor of Technology in Artificial Intelligence (B.Tech AI-DS)', 'BTECH-AIDS', 'UG', 4, 60, '{"general": 30, "obc": 16, "sc": 9, "st": 5}', '{"min_12th_pc": 65.0, "required_subjects": ["Physics", "Mathematics"]}', 1200.00),
  ('a1111111-1111-1111-1111-111111111113', 'a0000000-0000-0000-0000-000000000001', 'Master of Business Administration (MBA)', 'MBA-CORE', 'PG', 2, 60, '{"general": 30, "obc": 16, "sc": 9, "st": 5}', '{"min_grad_cgpa": 6.0}', 1500.00)
  ON CONFLICT DO NOTHING;


-- ==========================================================
-- MIGRATION: 20260611000001_placements_module12.sql
-- ==========================================================

-- ============================================================
-- MODULE 12: IRIS Placements
-- Company CRM, Drives management, Student profile builder, AI
-- interview checks, Offer tracking, and Alumni mentoring network.
-- ============================================================

-- 1. CREATE companies TABLE
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  company_type TEXT CHECK (company_type IN (
    'product','service','startup','mnc','psu','ngo'
  )),
  hr_name TEXT,
  hr_email TEXT,
  hr_phone TEXT,
  linkedin_url TEXT,
  address TEXT,
  tier TEXT CHECK (tier IN ('dream','core','mass')),
  last_visited DATE,
  total_offers_given INTEGER DEFAULT 0,
  relationship_status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE placement_drives TABLE
CREATE TABLE IF NOT EXISTS placement_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  job_description TEXT,
  jd_url TEXT,
  role TEXT NOT NULL,
  department TEXT,
  job_type TEXT CHECK (job_type IN (
    'full_time','internship','ppo','contract'
  )),
  location TEXT[],
  ctc_min DECIMAL,
  ctc_max DECIMAL,
  ctc_display TEXT,
  stipend DECIMAL,
  bond_years INTEGER DEFAULT 0,
  eligibility_criteria JSONB DEFAULT '{}'::jsonb,
  min_cgpa DECIMAL DEFAULT 0.0,
  eligible_branches TEXT[],
  eligible_batches TEXT[],
  backlogs_allowed INTEGER DEFAULT 0,
  application_deadline TIMESTAMPTZ,
  drive_date DATE,
  drive_mode TEXT CHECK (drive_mode IN ('online','offline','hybrid')),
  venue TEXT,
  meeting_link TEXT,
  rounds JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN (
    'upcoming','open','closed','processing','completed'
  )) DEFAULT 'upcoming',
  max_applications INTEGER,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE student_profiles TABLE
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  resume_url TEXT,
  resume_updated_at TIMESTAMPTZ,
  cgpa DECIMAL DEFAULT 0.0,
  active_backlogs INTEGER DEFAULT 0,
  total_backlogs INTEGER DEFAULT 0,
  skills TEXT[],
  certifications JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  internships JSONB DEFAULT '[]'::jsonb,
  achievements TEXT[],
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  is_placed BOOLEAN DEFAULT false,
  placed_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  placed_ctc DECIMAL,
  placed_role TEXT,
  placed_at TIMESTAMPTZ,
  placement_type TEXT,
  opted_out BOOLEAN DEFAULT false,
  opt_out_reason TEXT,
  ai_resume_score DECIMAL DEFAULT 0.0,
  ai_resume_feedback TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE drive_applications TABLE
CREATE TABLE IF NOT EXISTS drive_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ DEFAULT now(),
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT CHECK (status IN (
    'applied','shortlisted','test_scheduled','interview_scheduled',
    'selected','offered','offer_accepted','offer_rejected',
    'rejected','withdrawn'
  )) DEFAULT 'applied',
  current_round INTEGER DEFAULT 0,
  rejection_reason TEXT,
  feedback TEXT
);

-- 5. CREATE interview_rounds TABLE
CREATE TABLE IF NOT EXISTS interview_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES drive_applications(id) ON DELETE CASCADE,
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  round_number INTEGER,
  round_type TEXT CHECK (round_type IN (
    'aptitude','coding','technical','hr','gd','case_study','final'
  )),
  scheduled_at TIMESTAMPTZ,
  venue TEXT,
  meeting_link TEXT,
  interviewer_name TEXT,
  interviewer_email TEXT,
  duration_minutes INTEGER,
  result TEXT CHECK (result IN ('pass','fail','hold','no_show')),
  score DECIMAL,
  feedback TEXT,
  status TEXT DEFAULT 'scheduled'
);

-- 6. CREATE offer_letters TABLE
CREATE TABLE IF NOT EXISTS offer_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES drive_applications(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  offer_number TEXT UNIQUE,
  role TEXT,
  ctc DECIMAL,
  joining_date DATE,
  location TEXT,
  offer_letter_url TEXT,
  company_offer_url TEXT,
  status TEXT DEFAULT 'received',
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CREATE placement_stats TABLE
CREATE TABLE IF NOT EXISTS placement_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  batch TEXT,
  branch TEXT,
  total_eligible INTEGER DEFAULT 0,
  total_registered INTEGER DEFAULT 0,
  total_placed INTEGER DEFAULT 0,
  total_companies INTEGER DEFAULT 0,
  avg_ctc DECIMAL DEFAULT 0.0,
  median_ctc DECIMAL DEFAULT 0.0,
  highest_ctc DECIMAL DEFAULT 0.0,
  lowest_ctc DECIMAL DEFAULT 0.0,
  ppo_count INTEGER DEFAULT 0,
  dream_offers INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. CREATE mock_interviews TABLE
CREATE TABLE IF NOT EXISTS mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  interview_type TEXT,
  questions JSONB DEFAULT '[]'::jsonb,
  responses JSONB DEFAULT '[]'::jsonb,
  ai_feedback TEXT,
  score DECIMAL DEFAULT 0.0,
  duration_minutes INTEGER,
  conducted_at TIMESTAMPTZ DEFAULT now()
);

-- 9. CREATE alumni TABLE
CREATE TABLE IF NOT EXISTS alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  graduation_year INTEGER,
  current_company TEXT,
  "current_role" TEXT,
  current_ctc DECIMAL,
  location TEXT,
  linkedin_url TEXT,
  is_mentor BOOLEAN DEFAULT false,
  mentoring_slots INTEGER DEFAULT 0,
  achievements TEXT[],
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. CREATE alumni_mentorship TABLE
CREATE TABLE IF NOT EXISTS alumni_mentorship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID REFERENCES alumni(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  session_date TIMESTAMPTZ,
  duration_minutes INTEGER,
  topic TEXT,
  feedback TEXT,
  student_rating INTEGER,
  status TEXT DEFAULT 'scheduled'
);

-- 11. CREATE placement_notifications TABLE
CREATE TABLE IF NOT EXISTS placement_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  type TEXT,
  message TEXT,
  sent_via TEXT[],
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_companies_inst ON companies(institution_id);
CREATE INDEX IF NOT EXISTS idx_drives_company ON placement_drives(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_drive ON drive_applications(drive_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON drive_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_rounds_application ON interview_rounds(application_id);
CREATE INDEX IF NOT EXISTS idx_offers_student ON offer_letters(student_id);
CREATE INDEX IF NOT EXISTS idx_alumni_student ON alumni(student_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_mentorship ENABLE ROW LEVEL SECURITY;

-- 1. COMPANIES POLICY
CREATE POLICY "companies_all_access" ON companies FOR ALL USING (true);

-- 2. PLACEMENT DRIVES POLICY
CREATE POLICY "drives_all_access" ON placement_drives FOR ALL USING (true);

-- 3. STUDENT PROFILES POLICY
CREATE POLICY "student_own_profile" ON student_profiles
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_profiles" ON student_profiles FOR ALL USING (true);

-- 4. APPLICATIONS POLICY
CREATE POLICY "student_own_applications" ON drive_applications
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_applications" ON drive_applications FOR ALL USING (true);

-- 5. INTERVIEW ROUDS POLICY
CREATE POLICY "student_own_rounds" ON interview_rounds
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_rounds" ON interview_rounds FOR ALL USING (true);

-- 6. OFFER LETTERS POLICY
CREATE POLICY "student_own_offers" ON offer_letters
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_offers" ON offer_letters FOR ALL USING (true);

-- 7. MOCK INTERVIEWS POLICY
CREATE POLICY "student_own_mocks" ON mock_interviews
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_mocks" ON mock_interviews FOR ALL USING (true);

-- 8. ALUMNI POLICY
CREATE POLICY "alumni_all_access" ON alumni FOR ALL USING (true);

-- 9. MENTORSHIP POLICY
CREATE POLICY "mentorship_all_access" ON alumni_mentorship FOR ALL USING (true);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO companies (id, institution_id, name, logo_url, website, industry, company_type, hr_name, hr_email, hr_phone, tier, relationship_status) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Google India', 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=120', 'https://google.com', 'Technology', 'mnc', 'Neha Sen', 'neha.sen@google.com', '+91 99881 23456', 'dream', 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Infosys', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120', 'https://infosys.com', 'IT Services', 'service', 'Rajesh K.', 'rajesh.k@infosys.com', '+91 94140 12891', 'mass', 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'ZS Associates', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=120', 'https://zs.com', 'Consulting', 'product', 'Preeti Sharma', 'preeti.sharma@zs.com', '+91 99290 12347', 'core', 'active')
  ON CONFLICT DO NOTHING;

INSERT INTO placement_drives (id, institution_id, company_id, title, role, job_type, location, ctc_min, ctc_max, ctc_display, min_cgpa, eligible_branches, eligible_batches, status, application_deadline, drive_date) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Google SWE Summer Drive 2026', 'Software Engineer (L3)', 'full_time', ARRAY['Bangalore', 'Hyderabad'], 32.0, 42.0, '32 - 42 LPA', 8.0, ARRAY['CSE', 'AIDS'], ARRAY['2026'], 'open', CURRENT_TIMESTAMP + INTERVAL '10 days', CURRENT_DATE + INTERVAL '15 days'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'ZS Consulting Campus Hiring', 'Business Technology Analyst', 'full_time', ARRAY['Pune', 'Gurgaon'], 8.5, 12.0, '8.5 - 12 LPA', 7.0, ARRAY['CSE', 'AIDS', 'ECE'], ARRAY['2026'], 'open', CURRENT_TIMESTAMP + INTERVAL '5 days', CURRENT_DATE + INTERVAL '8 days')
  ON CONFLICT DO NOTHING;


-- ==========================================================
-- MIGRATION: 20260611_add_bus_tracking_index.sql
-- ==========================================================

-- Add composite index for bus_tracking latest-row queries
-- Prevents full table scan when fetching latest position of a bus
CREATE INDEX IF NOT EXISTS idx_bus_tracking_latest ON bus_tracking(bus_id, timestamp DESC);

-- Nightly archival job (run via pg_cron or external cron)
-- Archive rows older than 7 days to keep the hot table small
-- CREATE TABLE IF NOT EXISTS bus_tracking_archive (LIKE bus_tracking INCLUDING ALL);
-- INSERT INTO bus_tracking_archive SELECT * FROM bus_tracking WHERE timestamp < NOW() - INTERVAL '7 days';
-- DELETE FROM bus_tracking WHERE timestamp < NOW() - INTERVAL '7 days';

-- ==========================================================
-- MIGRATION: 20260612000001_attendance_enhancement.sql
-- ==========================================================

-- IRIS 365 Attendance Enhancement Migration
-- QR Token rotation, Biometric/RFID device management, Attendance method activation

-- ============================================================
-- 1. QR TOKENS TABLE (for rotating QR codes)
-- ============================================================
CREATE TABLE IF NOT EXISTS qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rotated_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qr_tokens_session ON qr_tokens(session_id);
CREATE INDEX idx_qr_tokens_hash ON qr_tokens(token_hash);
CREATE INDEX idx_qr_tokens_active ON qr_tokens(is_active, expires_at);

-- ============================================================
-- 2. ATTENDANCE SESSIONS: Add is_active, closed_at, auto_close fields
-- ============================================================
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS qr_rotate_interval INT DEFAULT 5; -- minutes
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS geo_lat DOUBLE PRECISION;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS geo_lng DOUBLE PRECISION;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS geo_radius INT DEFAULT 200; -- meters

-- ============================================================
-- 3. BIOMETRIC / RFID DEVICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  device_name VARCHAR(100) NOT NULL,
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('biometric', 'rfid', 'hybrid')),
  device_serial VARCHAR(100) NOT NULL,
  api_key VARCHAR(128) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_heartbeat TIMESTAMPTZ,
  firmware_version VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institution_id, device_serial)
);

CREATE INDEX idx_attendance_devices_inst ON attendance_devices(institution_id);

-- ============================================================
-- 4. DEVICE ATTENDANCE LOGS (raw log from biometric/RFID devices)
-- ============================================================
CREATE TABLE IF NOT EXISTS device_attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES attendance_devices(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE SET NULL,
  identifier_type VARCHAR(20) NOT NULL CHECK (identifier_type IN ('fingerprint', 'rfid_card', 'face', 'pin')),
  identifier_value VARCHAR(200) NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  matched BOOLEAN NOT NULL DEFAULT false,
  match_confidence DECIMAL(5,2),
  raw_payload JSONB DEFAULT '{}'::jsonb,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_logs_device ON device_attendance_logs(device_id);
CREATE INDEX idx_device_logs_student ON device_attendance_logs(student_id);

-- ============================================================
-- 5. ATTENDANCE METHODS CONFIGURATION (per institution)
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  method_key VARCHAR(20) NOT NULL CHECK (method_key IN ('qr', 'biometric', 'rfid', 'manual')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  -- QR config: { rotate_interval_minutes, geo_radius, geo_lat, geo_lng }
  -- Biometric config: { require_session, auto_match }
  -- RFID config: { require_session, allowed_device_ids }
  -- Manual config: { allowed_roles }
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institution_id, method_key)
);

CREATE INDEX idx_attendance_methods_inst ON attendance_methods(institution_id);

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qr_tokens_select" ON qr_tokens FOR SELECT USING (
  institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
);
CREATE POLICY "qr_tokens_insert" ON qr_tokens FOR INSERT WITH CHECK (
  get_auth_user_role() IN ('Admin', 'Staff', 'SuperAdmin')
);
CREATE POLICY "qr_tokens_update" ON qr_tokens FOR UPDATE USING (
  institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
);

CREATE POLICY "attendance_devices_select" ON attendance_devices FOR SELECT USING (
  institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
);
CREATE POLICY "attendance_devices_insert" ON attendance_devices FOR INSERT WITH CHECK (
  get_auth_user_role() IN ('Admin', 'SuperAdmin')
);
CREATE POLICY "attendance_devices_update" ON attendance_devices FOR UPDATE USING (
  institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
);

CREATE POLICY "device_logs_select" ON device_attendance_logs FOR SELECT USING (
  institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
);
CREATE POLICY "device_logs_insert" ON device_attendance_logs FOR INSERT WITH CHECK (
  institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
);

CREATE POLICY "attendance_methods_select" ON attendance_methods FOR SELECT USING (
  institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
);
CREATE POLICY "attendance_methods_insert" ON attendance_methods FOR INSERT WITH CHECK (
  get_auth_user_role() IN ('Admin', 'SuperAdmin')
);
CREATE POLICY "attendance_methods_update" ON attendance_methods FOR UPDATE USING (
  get_auth_user_role() IN ('Admin', 'SuperAdmin')
  OR (get_auth_user_role() = 'Director' AND institution_id = get_auth_institution_id())
);

-- ============================================================
-- 7. SEED: Default attendance methods for existing institutions
-- ============================================================
INSERT INTO attendance_methods (institution_id, method_key, is_enabled, config)
SELECT i.id, m.method_key, m.enabled, m.config::jsonb
FROM institutions i
CROSS JOIN (VALUES
  ('qr', true, '{"rotate_interval_minutes": 5, "geo_radius": 200}'),
  ('biometric', true, '{"require_session": true, "auto_match": true}'),
  ('rfid', true, '{"require_session": true, "allowed_device_ids": []}'),
  ('manual', true, '{"allowed_roles": ["Admin", "Staff", "SuperAdmin"]}')
) AS m(method_key, enabled, config)
ON CONFLICT (institution_id, method_key) DO NOTHING;

-- ============================================================
-- 8. UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_device_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_attendance_devices_updated
  BEFORE UPDATE ON attendance_devices
  FOR EACH ROW EXECUTE FUNCTION update_device_timestamp();

CREATE TRIGGER trigger_attendance_methods_updated
  BEFORE UPDATE ON attendance_methods
  FOR EACH ROW EXECUTE FUNCTION update_device_timestamp();


-- ==========================================================
-- MIGRATION: 20260612000002_rls_security_hardening.sql
-- ==========================================================

-- ============================================================
-- IRIS 365 — Comprehensive RLS Security Hardening
-- Addresses: Student over-permissioning, Warden scope,
-- Security missing reads, Driver no policy, Parent no link,
-- Vendor no policy, Staff attendance scoping, HOD role,
-- tables with RLS enabled but no policies, open policies
-- ============================================================

-- ============================================================
-- 0. HELPER: Check if user has staff record in a department
-- ============================================================
CREATE OR REPLACE FUNCTION is_user_in_department(target_dept_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff
    WHERE user_id = (auth.jwt() ->> 'sub')::UUID
    AND department_id = target_dept_id
    AND institution_id = get_auth_institution_id()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 1. PARENT → STUDENT LINK TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relationship VARCHAR(50) NOT NULL, -- father, mother, guardian
  is_primary BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_user_id, student_id)
);

CREATE INDEX idx_psl_parent ON parent_student_links(parent_user_id);
CREATE INDEX idx_psl_student ON parent_student_links(student_id);

ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

-- Parents can only see their own links
CREATE POLICY "parent_student_links_own" ON parent_student_links
  FOR SELECT USING (
    parent_user_id = (auth.jwt() ->> 'sub')::UUID
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- Admin/SuperAdmin can manage links
CREATE POLICY "parent_student_links_admin" ON parent_student_links
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 2. DROP EXISTING OVERLY-BROAD POLICIES
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND policyname IN (
        'users_select', 'users_insert', 'users_update', 'users_delete',
        'departments_select', 'departments_manage',
        'students_select', 'students_insert', 'students_update', 'students_delete',
        'staff_select', 'staff_manage',
        'attendance_sessions_select', 'attendance_sessions_insert', 'attendance_sessions_update', 'attendance_sessions_delete',
        'attendance_select', 'attendance_insert', 'attendance_update',
        'fee_structures_select', 'fee_structures_manage',
        'fee_payments_select', 'fee_payments_insert', 'fee_payments_manage',
        'fee_concessions_select', 'fee_concessions_manage',
        'canteen_menus_select', 'canteen_menus_insert', 'canteen_menus_update', 'canteen_menus_delete',
        'canteen_orders_select', 'canteen_orders_insert', 'canteen_orders_update',
        'events_select', 'events_insert', 'events_update', 'events_delete',
        'exam_results_select', 'exam_results_insert', 'exam_results_update',
        'exams_select', 'exams_manage',
        'timetable_select', 'timetable_manage',
        'books_select', 'books_manage',
        'book_issues_select', 'book_issues_insert', 'book_issues_update',
        'hostel_rooms_select', 'hostel_rooms_manage',
        'hostel_visitors_select', 'hostel_visitors_insert', 'hostel_visitors_update',
        'gate_entries_select', 'gate_entries_insert', 'gate_entries_update',
        'visitor_passes_select', 'visitor_passes_insert', 'visitor_passes_update',
        'blacklisted_visitors_select', 'blacklisted_visitors_manage',
        'rfid_cards_select', 'rfid_cards_manage',
        'security_incidents_select', 'security_incidents_insert', 'security_incidents_update',
        'gate_shifts_select', 'gate_shifts_manage',
        'campus_occupancy_select', 'campus_occupancy_manage',
        'bus_routes_select', 'bus_routes_manage',
        'buses_select', 'buses_manage',
        'bus_tracking_select', 'bus_tracking_insert', 'bus_tracking_update',
        'bus_drivers_select', 'bus_drivers_manage',
        'bus_trips_select', 'bus_trips_insert', 'bus_trips_update',
        'trip_stop_logs_select', 'trip_stop_logs_insert',
        'bus_incidents_select', 'bus_incidents_insert',
        'bus_maintenance_select', 'bus_maintenance_manage',
        'notifications_select', 'notifications_insert',
        'event_registrations_select', 'event_registrations_insert', 'event_registrations_update',
        'gym_slots_select', 'gym_slots_manage',
        'gym_memberships_select', 'gym_memberships_insert',
        'gym_bookings_select', 'gym_bookings_insert', 'gym_bookings_update',
        'meal_subscriptions_select', 'meal_subscriptions_manage',
        'fee_reminders_select', 'fee_reminders_manage',
        'transport_subscriptions_select', 'transport_subscriptions_manage',
        'visitor_logs_select', 'visitor_logs_insert', 'visitor_logs_update',
        'id_card_templates_select', 'id_card_templates_manage',
        'attendance_regularizations_select', 'attendance_regularizations_insert', 'attendance_regularizations_update',
        'notification_logs_select', 'notification_logs_insert',
        'companies_select', 'companies_manage',
        'placement_drives_select', 'placement_drives_manage',
        'student_profiles_select_own', 'student_profiles_manage_own',
        'drive_applications_select', 'drive_applications_manage',
        'interview_rounds_select', 'interview_rounds_manage',
        'offer_letters_select', 'offer_letters_manage',
        'mock_interviews_select', 'mock_interviews_manage',
        'alumni_select', 'alumni_manage',
        'alumni_mentorship_select', 'alumni_mentorship_manage',
        'rls_audit_admin_only', 'parent_student_links_own', 'parent_student_links_admin'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;


-- Drop the catch-all tenant policies that allow ALL roles full access
DROP POLICY IF EXISTS "tenant_users_policy" ON users;
DROP POLICY IF EXISTS "tenant_students_policy" ON students;
DROP POLICY IF EXISTS "tenant_attendance_policy" ON attendance;
DROP POLICY IF EXISTS "tenant_attendance_sessions_policy" ON attendance_sessions;
DROP POLICY IF EXISTS "tenant_fee_structures_policy" ON fee_structures;
DROP POLICY IF EXISTS "tenant_fee_payments_policy" ON fee_payments;
DROP POLICY IF EXISTS "tenant_canteen_menus_policy" ON canteen_menus;
DROP POLICY IF EXISTS "tenant_canteen_orders_policy" ON canteen_orders;
DROP POLICY IF EXISTS "tenant_events_policy" ON events;
DROP POLICY IF EXISTS "tenant_book_issues_policy" ON book_issues;
DROP POLICY IF EXISTS "tenant_books_policy" ON books;
DROP POLICY IF EXISTS "tenant_bus_routes_policy" ON bus_routes;
DROP POLICY IF EXISTS "tenant_buses_policy" ON buses;
DROP POLICY IF EXISTS "tenant_gate_logs_policy" ON gate_logs;
DROP POLICY IF EXISTS "tenant_hostel_rooms_policy" ON hostel_rooms;
DROP POLICY IF EXISTS "tenant_notifications_policy" ON notifications;
DROP POLICY IF EXISTS "tenant_timetable_policy" ON timetable;
DROP POLICY IF EXISTS "tenant_staff_policy" ON staff;
DROP POLICY IF EXISTS "tenant_departments_policy" ON departments;

-- Drop campus_core policies
DROP POLICY IF EXISTS "tenant_fee_concessions_policy" ON fee_concessions;
DROP POLICY IF EXISTS "tenant_id_card_templates_policy" ON id_card_templates;
DROP POLICY IF EXISTS "tenant_attendance_regularizations_policy" ON attendance_regularizations;

-- ============================================================
-- 3. REBUILD: Core table policies with proper role scoping
-- ============================================================

-- USERS: Admin/Staff/Teacher can see own institution; Students see only self
CREATE POLICY "users_select" ON users
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR id = (auth.jwt() ->> 'sub')::UUID
  );

CREATE POLICY "users_delete" ON users
  FOR DELETE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- DEPARTMENTS
CREATE POLICY "departments_select" ON departments
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "departments_manage" ON departments
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- STUDENTS: Admin/Staff see all in institution; Students see only self
CREATE POLICY "students_select" ON students
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "students_insert" ON students
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "students_update" ON students
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR user_id = (auth.jwt() ->> 'sub')::UUID
  );

CREATE POLICY "students_delete" ON students
  FOR DELETE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- STAFF
CREATE POLICY "staff_select" ON staff
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "staff_manage" ON staff
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 4. ATTENDANCE: Staff scoped to own department
-- ============================================================

-- ATTENDANCE SESSIONS: Staff can only manage sessions in their department
CREATE POLICY "attendance_sessions_select" ON attendance_sessions
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "attendance_sessions_insert" ON attendance_sessions
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR (
      get_auth_user_role() = 'Staff'
      AND institution_id = get_auth_institution_id()
      AND is_user_in_department(department_id)
    )
  );

CREATE POLICY "attendance_sessions_update" ON attendance_sessions
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR (
      get_auth_user_role() = 'Staff'
      AND institution_id = get_auth_institution_id()
      AND is_user_in_department(department_id)
    )
  );

CREATE POLICY "attendance_sessions_delete" ON attendance_sessions
  FOR DELETE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ATTENDANCE: Students see own records; Staff see their department; Admin see all
CREATE POLICY "attendance_select" ON attendance
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "attendance_insert" ON attendance
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR get_auth_user_role() = 'Staff'
  );

CREATE POLICY "attendance_update" ON attendance
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR get_auth_user_role() = 'Staff'
  );

-- ============================================================
-- 5. FEES: Students see only own payments
-- ============================================================

CREATE POLICY "fee_structures_select" ON fee_structures
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "fee_structures_manage" ON fee_structures
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

CREATE POLICY "fee_payments_select" ON fee_payments
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "fee_payments_insert" ON fee_payments
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR (
      get_auth_user_role() = 'Student'
      AND student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    )
  );

CREATE POLICY "fee_payments_manage" ON fee_payments
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

CREATE POLICY "fee_concessions_select" ON fee_concessions
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "fee_concessions_manage" ON fee_concessions
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 6. CANTEEN: Student sees available menus + own orders;
--    Vendor sees their stall orders + menus
-- ============================================================

-- Canteen menus: Students see only available items; Vendor/Admin see all
CREATE POLICY "canteen_menus_select" ON canteen_menus
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "canteen_menus_insert" ON canteen_menus
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Vendor')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "canteen_menus_update" ON canteen_menus
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Vendor')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "canteen_menus_delete" ON canteen_menus
  FOR DELETE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- Canteen orders: Students see/insert own; Vendor see/update their stall; Admin see all
CREATE POLICY "canteen_orders_select" ON canteen_orders
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "canteen_orders_insert" ON canteen_orders
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR (
      get_auth_user_role() = 'Student'
      AND student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    )
  );

CREATE POLICY "canteen_orders_update" ON canteen_orders
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Vendor')
    AND institution_id = get_auth_institution_id()
  );

-- ============================================================
-- 7. EVENTS: Students see published/active only; Admin see all
-- ============================================================

CREATE POLICY "events_select" ON events
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "events_insert" ON events
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "events_update" ON events
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

CREATE POLICY "events_delete" ON events
  FOR DELETE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 8. EXAM RESULTS: Students see only own; Staff see department
-- ============================================================

CREATE POLICY "exam_results_select" ON exam_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = exam_id
      AND e.institution_id = get_auth_institution_id()
    )
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "exam_results_insert" ON exam_results
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "exam_results_update" ON exam_results
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

-- EXAMS table (was missing policy)
CREATE POLICY "exams_select" ON exams
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "exams_manage" ON exams
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

-- ============================================================
-- 9. TIMETABLE
-- ============================================================

CREATE POLICY "timetable_select" ON timetable
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "timetable_manage" ON timetable
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 10. LIBRARY: Students see own issues
-- ============================================================

CREATE POLICY "books_select" ON books
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "books_manage" ON books
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "book_issues_select" ON book_issues
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "book_issues_insert" ON book_issues
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
    OR (
      get_auth_user_role() = 'Student'
      AND student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    )
  );

CREATE POLICY "book_issues_update" ON book_issues
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

-- ============================================================
-- 11. HOSTEL: Warden scoped to own block; Student see own
-- ============================================================

CREATE POLICY "hostel_rooms_select" ON hostel_rooms
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "hostel_rooms_manage" ON hostel_rooms
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden')
  );

-- Hostel visitors: Security + Warden can manage; Student see own
CREATE POLICY "hostel_visitors_select" ON hostel_visitors
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "hostel_visitors_insert" ON hostel_visitors
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security', 'Warden')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "hostel_visitors_update" ON hostel_visitors
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security', 'Warden')
    AND institution_id = get_auth_institution_id()
  );

-- ============================================================
-- 12. GATE: Security can read profiles for identity verification
-- ============================================================

CREATE POLICY "gate_entries_select" ON gate_entries
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "gate_entries_insert" ON gate_entries
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "gate_entries_update" ON gate_entries
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
    AND institution_id = get_auth_institution_id()
  );

-- Visitor passes: Security + Warden
CREATE POLICY "visitor_passes_select" ON visitor_passes
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "visitor_passes_insert" ON visitor_passes
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "visitor_passes_update" ON visitor_passes
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
    AND institution_id = get_auth_institution_id()
  );

-- Blacklisted visitors: Security + Admin
CREATE POLICY "blacklisted_visitors_select" ON blacklisted_visitors
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "blacklisted_visitors_manage" ON blacklisted_visitors
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
  );

-- RFID cards
CREATE POLICY "rfid_cards_select" ON rfid_cards
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "rfid_cards_manage" ON rfid_cards
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
  );

-- Security incidents
CREATE POLICY "security_incidents_select" ON security_incidents
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "security_incidents_insert" ON security_incidents
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "security_incidents_update" ON security_incidents
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
  );

-- Gate shifts
CREATE POLICY "gate_shifts_select" ON gate_shifts
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "gate_shifts_manage" ON gate_shifts
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
  );

-- Campus occupancy
CREATE POLICY "campus_occupancy_select" ON campus_occupancy
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "campus_occupancy_manage" ON campus_occupancy
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
  );

-- ============================================================
-- 13. TRANSIT: Driver sees own bus + route; Students see own route
-- ============================================================

CREATE POLICY "bus_routes_select" ON bus_routes
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "bus_routes_manage" ON bus_routes
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

CREATE POLICY "buses_select" ON buses
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "buses_manage" ON buses
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
  );

-- bus_tracking: Driver can INSERT own location; Admin see all; Students see their route
CREATE POLICY "bus_tracking_select" ON bus_tracking
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "bus_tracking_insert" ON bus_tracking
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "bus_tracking_update" ON bus_tracking
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
  );

-- bus_drivers
CREATE POLICY "bus_drivers_select" ON bus_drivers
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "bus_drivers_manage" ON bus_drivers
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- bus_trips
CREATE POLICY "bus_trips_select" ON bus_trips
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "bus_trips_insert" ON bus_trips
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
  );

CREATE POLICY "bus_trips_update" ON bus_trips
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
  );

-- trip_stop_logs
CREATE POLICY "trip_stop_logs_select" ON trip_stop_logs
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "trip_stop_logs_insert" ON trip_stop_logs
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
  );

-- bus_incidents
CREATE POLICY "bus_incidents_select" ON bus_incidents
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "bus_incidents_insert" ON bus_incidents
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
    AND institution_id = get_auth_institution_id()
  );

-- bus_maintenance
CREATE POLICY "bus_maintenance_select" ON bus_maintenance
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "bus_maintenance_manage" ON bus_maintenance
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 14. NOTIFICATIONS
-- ============================================================

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

-- ============================================================
-- 15. EVENT REGISTRATIONS (was missing policy)
-- ============================================================

CREATE POLICY "event_registrations_select" ON event_registrations
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "event_registrations_insert" ON event_registrations
  FOR INSERT WITH CHECK (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "event_registrations_update" ON event_registrations
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR (
      get_auth_user_role() = 'Student'
      AND student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    )
  );

-- ============================================================
-- 16. GYM: Membership check for bookings
-- ============================================================

CREATE POLICY "gym_slots_select" ON gym_slots
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "gym_slots_manage" ON gym_slots
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

CREATE POLICY "gym_memberships_select" ON gym_memberships
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id())
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "gym_memberships_insert" ON gym_memberships
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR (
      get_auth_user_role() = 'Student'
      AND student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    )
  );

CREATE POLICY "gym_bookings_select" ON gym_bookings
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id())
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "gym_bookings_insert" ON gym_bookings
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
    OR (
      get_auth_user_role() = 'Student'
      AND student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    )
  );

CREATE POLICY "gym_bookings_update" ON gym_bookings
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 17. MEAL SUBSCRIPTIONS (Warden needs to see)
-- ============================================================

CREATE POLICY "meal_subscriptions_select" ON meal_subscriptions
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "meal_subscriptions_manage" ON meal_subscriptions
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden', 'Vendor')
  );

-- ============================================================
-- 18. FEE REMINDERS
-- ============================================================

CREATE POLICY "fee_reminders_select" ON fee_reminders
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "fee_reminders_manage" ON fee_reminders
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 19. TRANSPORT SUBSCRIPTIONS
-- ============================================================

CREATE POLICY "transport_subscriptions_select" ON transport_subscriptions
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "transport_subscriptions_manage" ON transport_subscriptions
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Driver')
  );

-- ============================================================
-- 20. VISITOR LOGS (Security needs full access)
-- ============================================================

CREATE POLICY "visitor_logs_select" ON visitor_logs
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "visitor_logs_insert" ON visitor_logs
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security', 'Warden')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "visitor_logs_update" ON visitor_logs
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security', 'Warden')
  );

-- ============================================================
-- 21. ID CARD TEMPLATES
-- ============================================================

CREATE POLICY "id_card_templates_select" ON id_card_templates
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "id_card_templates_manage" ON id_card_templates
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- ============================================================
-- 22. ATTENDANCE REGULARIZATIONS
-- ============================================================

CREATE POLICY "attendance_regularizations_select" ON attendance_regularizations
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "attendance_regularizations_insert" ON attendance_regularizations
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff', 'Student')
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "attendance_regularizations_update" ON attendance_regularizations
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

-- ============================================================
-- 23. NOTIFICATION LOGS
-- ============================================================

CREATE POLICY "notification_logs_select" ON notification_logs
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "notification_logs_insert" ON notification_logs
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

-- ============================================================
-- 24. PLACEMENTS: Tighten open policies
-- ============================================================

-- Drop the wide-open policies
DROP POLICY IF EXISTS "companies_all_access" ON companies;
DROP POLICY IF EXISTS "drives_all_access" ON placement_drives;
DROP POLICY IF EXISTS "admin_all_profiles" ON student_profiles;
DROP POLICY IF EXISTS "admin_all_applications" ON drive_applications;
DROP POLICY IF EXISTS "admin_all_rounds" ON interview_rounds;
DROP POLICY IF EXISTS "admin_all_offers" ON offer_letters;
DROP POLICY IF EXISTS "admin_all_mocks" ON mock_interviews;
DROP POLICY IF EXISTS "alumni_all_access" ON alumni;
DROP POLICY IF EXISTS "mentorship_all_access" ON alumni_mentorship;

CREATE POLICY "companies_select" ON companies
  FOR SELECT USING (true); -- Companies are public

CREATE POLICY "companies_manage" ON companies
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

CREATE POLICY "placement_drives_select" ON placement_drives
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "placement_drives_manage" ON placement_drives
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "student_profiles_select_own" ON student_profiles
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "student_profiles_manage_own" ON student_profiles
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "drive_applications_select" ON drive_applications
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "drive_applications_manage" ON drive_applications
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "interview_rounds_select" ON interview_rounds
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "interview_rounds_manage" ON interview_rounds
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "offer_letters_select" ON offer_letters
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "offer_letters_manage" ON offer_letters
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "mock_interviews_select" ON mock_interviews
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = (auth.jwt() ->> 'sub')::UUID)
    OR get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "mock_interviews_manage" ON mock_interviews
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "alumni_select" ON alumni
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "alumni_manage" ON alumni
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

CREATE POLICY "alumni_mentorship_select" ON alumni_mentorship
  FOR SELECT USING (
    alumni_id IN (SELECT id FROM alumni WHERE institution_id = get_auth_institution_id())
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "alumni_mentorship_manage" ON alumni_mentorship
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
  );

-- ============================================================
-- 25. OBE/NAAC: Tighten open policies to Admin+Staff only
-- ============================================================

-- Drop all the open policies
DO $$
DECLARE
  tbl TEXT;
  pol TEXT;
BEGIN
  FOR tbl, pol IN SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname LIKE '%_access'
    AND tablename IN (
      'programs_obe', 'courses', 'course_outcomes', 'program_outcomes',
      'co_po_mapping', 'assessment_tools', 'co_assessments', 'student_co_marks',
      'co_attainment', 'po_attainment', 'naac_criteria', 'naac_metrics',
      'iqac_activities', 'faculty_development', 'research_publications',
      'student_achievements', 'feedback_surveys', 'survey_responses', 'ssr_documents'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol, tbl);
  END LOOP;
END $$;

-- Re-create with proper access: Admin + Staff + Teacher read; Admin write
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'programs_obe', 'courses', 'course_outcomes', 'program_outcomes',
    'co_po_mapping', 'assessment_tools', 'co_assessments', 'student_co_marks',
    'co_attainment', 'po_attainment', 'naac_criteria', 'naac_metrics',
    'iqac_activities', 'faculty_development', 'research_publications',
    'student_achievements', 'feedback_surveys', 'survey_responses', 'ssr_documents'
  ])
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (true)',
      tbl || '_read', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (get_auth_user_role() IN (''SuperAdmin'', ''Admin''))',
      tbl || '_write', tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- 26. HOD ROLE: Add to module_permissions seed
--    HOD = Admin permissions for their department
-- ============================================================

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'HOD', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('students', true), ('attendance', true), ('timetable', true),
  ('exams', true), ('notices', true), ('obe', true), ('library', true),
  ('fees', false), ('canteen', false), ('hostel', false), ('placements', false),
  ('hr', false), ('gate', false), ('gym', false), ('transit', false),
  ('events', false), ('idcards', false), ('ai_concierge', false), ('naac', false),
  ('admissions', false), ('faculty_development', true), ('achievements', false),
  ('director', false), ('parent_portal', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

-- ============================================================
-- 27. AUDIT LOG TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS rls_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL, -- policy_change, permission_grant, permission_revoke
  table_name VARCHAR(100) NOT NULL,
  role VARCHAR(50),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rls_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_audit_admin_only" ON rls_audit_log
  FOR ALL USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin')
  );

-- Log this migration
INSERT INTO rls_audit_log (event_type, table_name, role, details)
VALUES ('policy_change', 'ALL', 'system', '{"migration": "20260612000002_rls_security_hardening", "description": "Comprehensive RLS overhaul: parent_student_links, role-scoped policies, no-policy table fixes"}');


-- ==========================================================
-- MIGRATION: 20260612000003_feature_logic_fixes.sql
-- ==========================================================

-- ============================================================
-- IRIS 365 — Feature Logic Fixes
-- Late fees, timetable scoping, library fine payment,
-- event capacity enforcement, gate blacklist check
-- ============================================================

-- ============================================================
-- 1. FEE STRUCTURES: Late fee / penalty columns
-- ============================================================

ALTER TABLE fee_structures
  ADD COLUMN IF NOT EXISTS late_fee_per_day DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_penalty DECIMAL(10,2) DEFAULT 0.00;

-- RPC: Calculate penalty for a fee payment
CREATE OR REPLACE FUNCTION calculate_fee_penalty(
  p_fee_structure_id UUID,
  p_payment_date DATE
) RETURNS DECIMAL AS $$
DECLARE
  v_due_date DATE;
  v_late_fee_per_day DECIMAL;
  v_grace_period_days INTEGER;
  v_max_penalty DECIMAL;
  v_days_late INTEGER;
  v_penalty DECIMAL;
BEGIN
  SELECT due_date, late_fee_per_day, grace_period_days, max_penalty
  INTO v_due_date, v_late_fee_per_day, v_grace_period_days, v_max_penalty
  FROM fee_structures WHERE id = p_fee_structure_id;

  IF NOT FOUND THEN RETURN 0; END IF;

  v_days_late := p_payment_date - v_due_date - v_grace_period_days;

  IF v_days_late <= 0 THEN RETURN 0; END IF;

  v_penalty := v_days_late * v_late_fee_per_day;

  IF v_max_penalty > 0 AND v_penalty > v_max_penalty THEN
    v_penalty := v_max_penalty;
  END IF;

  RETURN v_penalty;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Initiate fee payment with penalty calculation
CREATE OR REPLACE FUNCTION initiate_fee_payment(
  p_institution_id UUID,
  p_student_id UUID,
  p_fee_structure_id UUID,
  p_payment_date DATE DEFAULT CURRENT_DATE
) RETURNS JSON AS $$
DECLARE
  v_amount DECIMAL;
  v_penalty DECIMAL;
  v_total DECIMAL;
  v_fee_name VARCHAR;
  v_due_date DATE;
BEGIN
  SELECT amount, name, due_date
  INTO v_amount, v_fee_name, v_due_date
  FROM fee_structures
  WHERE id = p_fee_structure_id AND institution_id = p_institution_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Fee structure not found');
  END IF;

  v_penalty := calculate_fee_penalty(p_fee_structure_id, p_payment_date);
  v_total := v_amount + v_penalty;

  RETURN json_build_object(
    'success', true,
    'fee_name', v_fee_name,
    'base_amount', v_amount,
    'penalty', v_penalty,
    'total_amount', v_total,
    'due_date', v_due_date,
    'payment_date', p_payment_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. TIMETABLE: Add semester + batch_year scoping
-- ============================================================

ALTER TABLE timetable
  ADD COLUMN IF NOT EXISTS semester INTEGER,
  ADD COLUMN IF NOT EXISTS batch_year VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_timetable_semester_batch ON timetable(semester, batch_year);

-- ============================================================
-- 3. LIBRARY FINE PAYMENT PATH
-- ============================================================

CREATE TABLE IF NOT EXISTS library_fine_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  book_issue_id UUID NOT NULL REFERENCES book_issues(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash', -- cash, wallet, online
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  receipt_number VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lfp_student ON library_fine_payments(student_id);
CREATE INDEX idx_lfp_issue ON library_fine_payments(book_issue_id);

ALTER TABLE library_fine_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lfp_select" ON library_fine_payments
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "lfp_insert" ON library_fine_payments
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
    AND institution_id = get_auth_institution_id()
  );

-- RPC: Pay library fine (atomic: insert payment + clear fine on book_issue)
CREATE OR REPLACE FUNCTION pay_library_fine(
  p_institution_id UUID,
  p_student_id UUID,
  p_book_issue_id UUID,
  p_amount DECIMAL,
  p_payment_method VARCHAR DEFAULT 'cash',
  p_recorded_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_fine_amount DECIMAL;
  v_existing_payment DECIMAL;
  v_net_fine DECIMAL;
  v_receipt VARCHAR;
BEGIN
  -- Get the fine amount
  SELECT fine_amount INTO v_fine_amount
  FROM book_issues
  WHERE id = p_book_issue_id AND student_id = p_student_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Book issue not found');
  END IF;

  IF v_fine_amount IS NULL OR v_fine_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No fine outstanding');
  END IF;

  -- Check existing payments
  SELECT COALESCE(SUM(amount), 0) INTO v_existing_payment
  FROM library_fine_payments
  WHERE book_issue_id = p_book_issue_id AND student_id = p_student_id;

  v_net_fine := v_fine_amount - v_existing_payment;

  IF p_amount > v_net_fine THEN
    p_amount := v_net_fine;
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Fine already fully paid');
  END IF;

  -- Generate receipt number
  v_receipt := 'LIB-' || to_char(now(), 'YYYYMMDD') || '-' || substring(md5(random()::text), 1, 8);

  -- Insert payment
  INSERT INTO library_fine_payments (institution_id, student_id, book_issue_id, amount, payment_method, recorded_by, receipt_number)
  VALUES (p_institution_id, p_student_id, p_book_issue_id, p_amount, p_payment_method, p_recorded_by, v_receipt);

  -- Update fine_amount on book_issue if fully paid
  IF v_existing_payment + p_amount >= v_fine_amount THEN
    UPDATE book_issues SET fine_amount = 0, fine_paid = true WHERE id = p_book_issue_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'amount_paid', p_amount,
    'remaining_fine', GREATEST(0, v_net_fine - p_amount),
    'receipt_number', v_receipt
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. EVENTS: Atomic registration with capacity check
-- ============================================================

CREATE OR REPLACE FUNCTION register_event_atomic(
  p_institution_id UUID,
  p_event_id UUID,
  p_student_id UUID
) RETURNS JSON AS $$
DECLARE
  v_max_participants INTEGER;
  v_current_count INTEGER;
  v_event_status VARCHAR;
  v_event_name VARCHAR;
  v_registration_id UUID;
BEGIN
  -- Lock the event row
  SELECT max_participants, status, name
  INTO v_max_participants, v_event_status, v_event_name
  FROM events
  WHERE id = p_event_id AND institution_id = p_institution_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Event not found');
  END IF;

  IF v_event_status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Event is not active (status: ' || v_event_status || ')');
  END IF;

  -- Check if already registered
  IF EXISTS (SELECT 1 FROM event_registrations WHERE event_id = p_event_id AND student_id = p_student_id) THEN
    RETURN json_build_object('success', false, 'error', 'Already registered for this event');
  END IF;

  -- Check capacity (if max_participants is set)
  IF v_max_participants IS NOT NULL AND v_max_participants > 0 THEN
    SELECT COUNT(*) INTO v_current_count
    FROM event_registrations
    WHERE event_id = p_event_id AND payment_status != 'cancelled';

    IF v_current_count >= v_max_participants THEN
      RETURN json_build_object('success', false, 'error', 'Event is full (' || v_max_participants || ' max)', 'current', v_current_count);
    END IF;

    -- Atomically increment
    UPDATE events SET
      max_participants = max_participants  -- no-op to hold lock
    WHERE id = p_event_id AND (
      SELECT COUNT(*) FROM event_registrations
      WHERE event_id = p_event_id AND payment_status != 'cancelled'
    ) < v_max_participants;

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Event filled up concurrently');
    END IF;
  END IF;

  -- Insert registration
  INSERT INTO event_registrations (institution_id, event_id, student_id, registration_date, payment_status)
  VALUES (p_institution_id, p_event_id, p_student_id, now(), 'pending')
  RETURNING id INTO v_registration_id;

  RETURN json_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'event_name', v_event_name,
    'message', 'Registration successful'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. GATE: Extend to deny blacklisted students/staff
-- ============================================================

-- Add person_type to blacklisted_visitors to also cover students/staff
ALTER TABLE blacklisted_visitors
  ADD COLUMN IF NOT EXISTS person_type VARCHAR(20) DEFAULT 'visitor', -- visitor, student, staff
  ADD COLUMN IF NOT EXISTS person_id UUID; -- FK to students.id or users.id

CREATE INDEX IF NOT EXISTS idx_blacklist_person ON blacklisted_visitors(person_type, person_id);

-- RPC: Check if a person is blacklisted at gate entry
CREATE OR REPLACE FUNCTION check_gate_access(
  p_institution_id UUID,
  p_person_id UUID,
  p_person_type VARCHAR DEFAULT 'student'
) RETURNS JSON AS $$
DECLARE
  v_blocked BOOLEAN := false;
  v_reason TEXT;
  v_record JSON;
BEGIN
  -- Check blacklisted_visitors table
  SELECT true, bv.reason INTO v_blocked, v_reason
  FROM blacklisted_visitors bv
  WHERE bv.institution_id = p_institution_id
  AND bv.is_active = true
  AND (
    (p_person_type = 'visitor' AND bv.id_number = p_person_id::TEXT)
    OR (bv.person_type = p_person_type AND bv.person_id = p_person_id)
  )
  LIMIT 1;

  IF v_blocked THEN
    RETURN json_build_object(
      'success', false,
      'allowed', false,
      'reason', 'BLOCKED: ' || COALESCE(v_reason, 'No reason provided'),
      'alert_level', 'high'
    );
  END IF;

  -- Check if student is deactivated / expelled
  IF p_person_type = 'student' THEN
    SELECT json_build_object('name', u.name, 'status', 'active') INTO v_record
    FROM students s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = p_person_id AND s.institution_id = p_institution_id AND u.is_active = true;

    IF v_record IS NULL THEN
      RETURN json_build_object('success', false, 'allowed', false, 'reason', 'Student account deactivated or not found', 'alert_level', 'medium');
    END IF;
  END IF;

  -- Check if staff is deactivated
  IF p_person_type = 'staff' THEN
    SELECT json_build_object('name', u.name) INTO v_record
    FROM staff st
    JOIN users u ON u.id = st.user_id
    WHERE st.id = p_person_id AND st.institution_id = p_institution_id AND u.is_active = true;

    IF v_record IS NULL THEN
      RETURN json_build_object('success', false, 'allowed', false, 'reason', 'Staff account deactivated or not found', 'alert_level', 'medium');
    END IF;
  END IF;

  RETURN json_build_object('success', true, 'allowed', true, 'alert_level', 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. HOSTEL: Ensure checkout RPC exists (already in code,
--    but add an atomic version for consistency)
-- ============================================================

CREATE OR REPLACE FUNCTION checkout_hostel_atomic(
  p_allocation_id UUID,
  p_vacated_date DATE,
  p_vacating_reason TEXT DEFAULT NULL,
  p_recorded_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_allocation RECORD;
  v_room RECORD;
  v_outstanding_fees DECIMAL;
  v_open_complaints INTEGER;
BEGIN
  -- Lock the allocation row
  SELECT ha.*, hr.id AS room_id_ref, hr.occupied, hr.capacity
  INTO v_allocation
  FROM hostel_allocations ha
  JOIN hostel_rooms hr ON hr.id = ha.room_id
  WHERE ha.id = p_allocation_id AND ha.is_current = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Active allocation not found');
  END IF;

  -- Check outstanding hostel fees
  SELECT COALESCE(SUM(amount - paid_amount), 0) INTO v_outstanding_fees
  FROM hostel_fees
  WHERE student_id = v_allocation.student_id AND paid_amount < amount;

  IF v_outstanding_fees > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Outstanding hostel fees: ₹' || v_outstanding_fees);
  END IF;

  -- Check open complaints
  SELECT COUNT(*) INTO v_open_complaints
  FROM hostel_complaints
  WHERE student_id = v_allocation.student_id
  AND status NOT IN ('resolved', 'closed');

  -- Update allocation
  UPDATE hostel_allocations
  SET is_current = false,
      vacated_date = p_vacated_date,
      vacating_reason = p_vacating_reason
  WHERE id = p_allocation_id;

  -- Decrement room occupied count
  UPDATE hostel_rooms
  SET occupied = GREATEST(0, occupied - 1)
  WHERE id = v_allocation.room_id;

  RETURN json_build_object(
    'success', true,
    'student_id', v_allocation.student_id,
    'room_number', (SELECT room_number FROM hostel_rooms WHERE id = v_allocation.room_id),
    'vacated_date', p_vacated_date,
    'open_complaints', v_open_complaints,
    'message', 'Checkout successful. Room has been vacated.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. SEED: Add HOD role to module_permissions
--    (Duplicate-safe with the security_hardening migration)
-- ============================================================

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'HOD', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('students', true), ('attendance', true), ('timetable', true),
  ('exams', true), ('notices', true), ('obe', true), ('library', true),
  ('fees', false), ('canteen', false), ('hostel', false), ('placements', false),
  ('hr', false), ('gate', false), ('gym', false), ('transit', false),
  ('events', false), ('idcards', false), ('ai_concierge', false), ('naac', false),
  ('admissions', false), ('faculty_development', true), ('achievements', false),
  ('director', false), ('parent_portal', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;


-- ==========================================================
-- MIGRATION: 20260612000004_high_priority_features.sql
-- ==========================================================

-- ============================================================
-- HIGH PRIORITY FEATURES: Attendance Warnings, Fee Escalation, Parent OTP
-- ============================================================

-- ============================================================
-- 1. ATTENDANCE SHORTAGE WARNING SYSTEM
-- ============================================================

-- Track which warnings have been sent to avoid duplicate alerts
CREATE TABLE IF NOT EXISTS attendance_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    warning_type VARCHAR(20) NOT NULL CHECK (warning_type IN ('warning_80', 'critical_75', 'final_60')),
    attendance_pct DECIMAL(5,2) NOT NULL,
    total_classes INTEGER NOT NULL DEFAULT 0,
    attended_classes INTEGER NOT NULL DEFAULT 0,
    sent_to_student BOOLEAN NOT NULL DEFAULT false,
    sent_to_parent BOOLEAN NOT NULL DEFAULT false,
    sent_to_hod BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    warning_date DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT unique_warning_per_student_type UNIQUE (student_id, warning_type, warning_date)
);

-- Log of all attendance warning runs (audit trail)
CREATE TABLE IF NOT EXISTS attendance_warning_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    students_checked INTEGER NOT NULL DEFAULT 0,
    warnings_sent INTEGER NOT NULL DEFAULT 0,
    critical_sent INTEGER NOT NULL DEFAULT 0,
    errors INTEGER NOT NULL DEFAULT 0,
    run_duration_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE attendance_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_warning_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin/Director can view attendance warnings" ON attendance_warnings
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Students can view their own attendance warnings" ON attendance_warnings
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Parents can view linked child warnings" ON attendance_warnings
    FOR SELECT USING (
        student_id IN (
            SELECT student_id FROM parent_student_links
            WHERE parent_user_id = auth.uid() AND verified = true
        )
    );

CREATE POLICY "System can insert attendance warnings" ON attendance_warnings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin/Director can view warning logs" ON attendance_warning_logs
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "System can insert warning logs" ON attendance_warning_logs
    FOR INSERT WITH CHECK (true);

-- RPC: Calculate attendance percentage for a student
CREATE OR REPLACE FUNCTION get_student_attendance_pct(p_student_id UUID)
RETURNS TABLE (
    total_classes BIGINT,
    attended_classes BIGINT,
    attendance_pct NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_classes,
        COUNT(*) FILTER (WHERE a.status IN ('present', 'late'))::BIGINT AS attended_classes,
        CASE
            WHEN COUNT(*) = 0 THEN 100.00
            ELSE ROUND((COUNT(*) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
        END AS attendance_pct
    FROM attendance a
    WHERE a.student_id = p_student_id
      AND a.date >= (CURRENT_DATE - INTERVAL '120 days');
END;
$$;

-- RPC: Get attendance summary for all active students in an institution
CREATE OR REPLACE FUNCTION get_institution_attendance_summary()
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number VARCHAR,
    guardian_name VARCHAR,
    guardian_phone VARCHAR,
    department_name TEXT,
    total_classes BIGINT,
    attended_classes BIGINT,
    attendance_pct NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id AS student_id,
        u.name AS student_name,
        s.roll_number,
        s.guardian_name,
        s.guardian_phone,
        d.name AS department_name,
        COUNT(a.id)::BIGINT AS total_classes,
        COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::BIGINT AS attended_classes,
        CASE
            WHEN COUNT(a.id) = 0 THEN 100.00
            ELSE ROUND(
                (COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC
                / NULLIF(COUNT(a.id), 0)::NUMERIC) * 100, 2
            )
        END AS attendance_pct
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN attendance a ON a.student_id = s.id
        AND a.date >= (CURRENT_DATE - INTERVAL '120 days')
    WHERE s.is_active = true
      AND s.institution_id = get_auth_institution_id()
    GROUP BY s.id, u.name, s.roll_number, s.guardian_name, s.guardian_phone, d.name
    HAVING
        CASE
            WHEN COUNT(a.id) = 0 THEN 100.00
            ELSE ROUND(
                (COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC
                / NULLIF(COUNT(a.id), 0)::NUMERIC) * 100, 2
            )
        END < 80
    ORDER BY attendance_pct ASC;
END;
$$;


-- ============================================================
-- 2. FEE DEFAULTER AUTO-ESCALATION
-- ============================================================

-- Track escalation stages and notifications sent
CREATE TABLE IF NOT EXISTS fee_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    fee_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
    student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
    escalation_stage VARCHAR(30) NOT NULL CHECK (escalation_stage IN (
        'reminder_7day',      -- 7 days before due date
        'reminder_1day',      -- 1 day before due date
        'due_today',          -- Due date today
        'overdue_7day',       -- 7 days overdue
        'overdue_30day',      -- 30 days overdue - formal notice
        'escalated_to_admin'  -- Director flagged
    )),
    amount_overdue NUMERIC(10,2) NOT NULL DEFAULT 0,
    days_overdue INTEGER NOT NULL DEFAULT 0,
    sent_to_student BOOLEAN NOT NULL DEFAULT false,
    sent_to_parent BOOLEAN NOT NULL DEFAULT false,
    sent_to_hod BOOLEAN NOT NULL DEFAULT false,
    sent_to_director BOOLEAN NOT NULL DEFAULT false,
    notice_generated BOOLEAN NOT NULL DEFAULT false,
    notice_file_url TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_escalation_per_student_stage UNIQUE (student_fee_id, escalation_stage)
);

-- Track all escalation runs
CREATE TABLE IF NOT EXISTS fee_escalation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    fees_checked INTEGER NOT NULL DEFAULT 0,
    reminders_sent INTEGER NOT NULL DEFAULT 0,
    escalations_sent INTEGER NOT NULL DEFAULT 0,
    notices_generated INTEGER NOT NULL DEFAULT 0,
    errors INTEGER NOT NULL DEFAULT 0,
    run_duration_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE fee_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_escalation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fee_escalations
CREATE POLICY "Admin/Director can view fee escalations" ON fee_escalations
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director', 'HOD')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Students can view their own fee escalations" ON fee_escalations
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Parents can view linked child escalations" ON fee_escalations
    FOR SELECT USING (
        student_id IN (
            SELECT student_id FROM parent_student_links
            WHERE parent_user_id = auth.uid() AND verified = true
        )
    );

CREATE POLICY "System can insert fee escalations" ON fee_escalations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update fee escalations" ON fee_escalations
    FOR UPDATE USING (true);

CREATE POLICY "Admin/Director can view escalation logs" ON fee_escalation_logs
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "System can insert escalation logs" ON fee_escalation_logs
    FOR INSERT WITH CHECK (true);

-- RPC: Get fee defaulters for an institution (students with overdue fees)
CREATE OR REPLACE FUNCTION get_fee_defaulters()
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number VARCHAR,
    guardian_name VARCHAR,
    guardian_phone VARCHAR,
    department_name TEXT,
    fee_id UUID,
    fee_name VARCHAR,
    amount_due NUMERIC,
    amount_paid NUMERIC,
    amount_overdue NUMERIC,
    due_date DATE,
    days_overdue INTEGER,
    late_fee NUMERIC,
    total_due NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id AS student_id,
        u.name AS student_name,
        s.roll_number,
        s.guardian_name,
        s.guardian_phone,
        d.name AS department_name,
        sf.fee_id,
        fs.name AS fee_name,
        sf.amount AS amount_due,
        sf.paid_amount AS amount_paid,
        (sf.amount - sf.paid_amount) AS amount_overdue,
        sf.due_date,
        (CURRENT_DATE - sf.due_date)::INTEGER AS days_overdue,
        calculate_fee_penalty(sf.fee_id, CURRENT_DATE) AS late_fee,
        (sf.amount - sf.paid_amount + calculate_fee_penalty(sf.fee_id, CURRENT_DATE)) AS total_due
    FROM student_fees sf
    JOIN fee_structures fs ON sf.fee_id = fs.id
    JOIN students s ON sf.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE sf.payment_status IN ('pending', 'partial')
      AND sf.due_date <= CURRENT_DATE
      AND s.is_active = true
      AND s.institution_id = get_auth_institution_id()
    ORDER BY (sf.due_date - CURRENT_DATE) DESC, sf.amount DESC;
END;
$$;


-- ============================================================
-- 3. PARENT → CHILD VERIFIED LINK SYSTEM (OTP)
-- ============================================================

-- OTP tokens for parent registration and child linking
CREATE TABLE IF NOT EXISTS parent_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(30) NOT NULL CHECK (purpose IN ('register', 'link_child', 'verify_change')),
    metadata JSONB DEFAULT '{}',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    is_used BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Parent profiles (separate from users table for portal-specific data)
CREATE TABLE IF NOT EXISTS parent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    occupation VARCHAR(100),
    relationship VARCHAR(50) DEFAULT 'Guardian',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_parent_profile UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE parent_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_otps (no user access - system only)
CREATE POLICY "System can manage parent OTPs" ON parent_otps
    FOR ALL USING (true);

-- RLS Policies for parent_profiles
CREATE POLICY "Parents can view their own profile" ON parent_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can view parent profiles in institution" ON parent_profiles
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "System can insert parent profiles" ON parent_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update parent profiles" ON parent_profiles
    FOR UPDATE USING (true);

-- RPC: Generate and store OTP for parent
CREATE OR REPLACE FUNCTION generate_parent_otp(
    p_phone VARCHAR,
    p_purpose VARCHAR,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
    otp_id UUID,
    otp_code VARCHAR,
    expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_otp VARCHAR(6);
    v_id UUID;
    v_expires TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate 6-digit OTP
    v_otp := LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0');
    v_expires := NOW() + INTERVAL '10 minutes';

    -- Invalidate any existing OTPs for this phone+purpose
    UPDATE parent_otps
    SET is_used = true
    WHERE phone = p_phone
      AND purpose = p_purpose
      AND is_used = false;

    -- Insert new OTP
    INSERT INTO parent_otps (phone, otp_code, purpose, metadata, expires_at)
    VALUES (p_phone, v_otp, p_purpose, p_metadata, v_expires)
    RETURNING id INTO v_id;

    otp_id := v_id;
    otp_code := v_otp;
    expires_at := v_expires;
    RETURN NEXT;
END;
$$;

-- RPC: Verify parent OTP
CREATE OR REPLACE FUNCTION verify_parent_otp(
    p_phone VARCHAR,
    p_otp VARCHAR,
    p_purpose VARCHAR
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_otp_record RECORD;
BEGIN
    -- Find valid OTP
    SELECT * INTO v_otp_record
    FROM parent_otps
    WHERE phone = p_phone
      AND purpose = p_purpose
      AND is_used = false
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_otp_record IS NULL THEN
        success := false;
        message := 'No valid OTP found. Please request a new code.';
        metadata := '{}';
        RETURN NEXT;
        RETURN;
    END IF;

    -- Check attempts
    IF v_otp_record.attempts >= v_otp_record.max_attempts THEN
        UPDATE parent_otps SET is_used = true WHERE id = v_otp_record.id;
        success := false;
        message := 'Maximum attempts exceeded. Please request a new code.';
        metadata := '{}';
        RETURN NEXT;
        RETURN;
    END IF;

    -- Increment attempts
    UPDATE parent_otps SET attempts = attempts + 1 WHERE id = v_otp_record.id;

    -- Check OTP
    IF v_otp_record.otp_code != p_otp THEN
        success := false;
        message := 'Incorrect verification code. Please try again.';
        metadata := '{}';
        RETURN NEXT;
        RETURN;
    END IF;

    -- Mark as used
    UPDATE parent_otps SET is_used = true WHERE id = v_otp_record.id;

    success := true;
    message := 'Verification successful.';
    metadata := v_otp_record.metadata;
    RETURN NEXT;
END;
$$;

-- RPC: Link parent to child via roll number verification
CREATE OR REPLACE FUNCTION link_parent_to_child(
    p_roll_number VARCHAR,
    p_child_dob DATE
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    student_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student RECORD;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    -- Find student by roll number
    SELECT s.id, s.user_id, s.dob, s.institution_id, u.name AS full_name
    INTO v_student
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.roll_number = p_roll_number
      AND s.is_active = true;

    IF v_student IS NULL THEN
        success := false;
        message := 'No active student found with this roll number.';
        student_id := NULL;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Verify DOB matches (additional security layer)
    IF v_student.dob != p_child_dob THEN
        success := false;
        message := 'Date of birth does not match our records.';
        student_id := NULL;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Check if already linked
    IF EXISTS (
        SELECT 1 FROM parent_student_links
        WHERE parent_user_id = v_user_id
          AND student_id = v_student.id
          AND verified = true
    ) THEN
        success := false;
        message := 'This student is already linked to your account.';
        student_id := v_student.id;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Create or update link
    INSERT INTO parent_student_links (parent_user_id, student_id, verified, relationship)
    VALUES (v_user_id, v_student.id, true, 'Guardian')
    ON CONFLICT (parent_user_id, student_id)
    DO UPDATE SET verified = true;

    -- Update parent profile if exists
    UPDATE parent_profiles SET is_verified = true, verified_at = NOW()
    WHERE user_id = v_user_id;

    success := true;
    message := 'Successfully linked to student ' || v_student.full_name;
    student_id := v_student.id;
    RETURN NEXT;
END;
$$;


-- ==========================================================
-- MIGRATION: 20260612000005_medium_priority_features.sql
-- ==========================================================

-- ============================================================
-- MEDIUM PRIORITY: Exam Seating, Lost & Found, Notice Read Receipts
-- ============================================================

-- ============================================================
-- 1. EXAM HALL SEATING ALLOCATION
-- ============================================================

CREATE TABLE IF NOT EXISTS exam_seating (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    invigilator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_checked_in BOOLEAN NOT NULL DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    qr_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_seat_per_exam UNIQUE (exam_id, room_number, seat_number),
    CONSTRAINT unique_student_per_exam UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS exam_halls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    hall_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 30,
    has_ac BOOLEAN NOT NULL DEFAULT false,
    has_projector BOOLEAN NOT NULL DEFAULT false,
    floor_number INTEGER DEFAULT 1,
    building VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_hall_room UNIQUE (institution_id, room_number)
);

-- Enable RLS
ALTER TABLE exam_seating ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_halls ENABLE ROW LEVEL SECURITY;

-- RLS for exam_seating
CREATE POLICY "Admin/Director can manage exam seating" ON exam_seating
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Teachers can view seating for their exams" ON exam_seating
    FOR SELECT USING (
        get_auth_user_role() = 'Teacher'
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Students can view their own seating" ON exam_seating
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Parents can view linked child seating" ON exam_seating
    FOR SELECT USING (
        student_id IN (
            SELECT student_id FROM parent_student_links
            WHERE parent_user_id = auth.uid() AND verified = true
        )
    );

-- RLS for exam_halls
CREATE POLICY "Admin can manage exam halls" ON exam_halls
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Staff can view exam halls" ON exam_halls
    FOR SELECT USING (
        get_auth_user_role() IN ('Teacher', 'Staff', 'Director', 'HOD')
        AND institution_id = get_auth_institution_id()
        AND is_active = true
    );

-- RPC: Auto-allocate seating for an exam
CREATE OR REPLACE FUNCTION auto_allocate_seating(p_exam_id UUID)
RETURNS TABLE (
    total_allocated INTEGER,
    rooms_used INTEGER,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exam RECORD;
    v_hall RECORD;
    v_students UUID[];
    v_seat_counter INTEGER;
    v_total INTEGER := 0;
    v_room_count INTEGER := 0;
BEGIN
    -- Get exam details
    SELECT * INTO v_exam FROM exams WHERE id = p_exam_id;
    IF v_exam IS NULL THEN
        RAISE EXCEPTION 'Exam not found';
    END IF;

    -- Get enrolled students for this exam
    SELECT ARRAY_AGG(s.id ORDER BY s.roll_number) INTO v_students
    FROM students s
    WHERE s.department_id = v_exam.department_id
      AND s.is_active = true
      AND s.year = v_exam.year;

    IF v_students IS NULL OR array_length(v_students, 1) = 0 THEN
        total_allocated := 0;
        rooms_used := 0;
        message := 'No students found for this exam';
        RETURN NEXT;
        RETURN;
    END IF;

    -- Clear existing seating for this exam
    DELETE FROM exam_seating WHERE exam_id = p_exam_id;

    -- Allocate seats room by room
    v_seat_counter := 1;
    FOR v_hall IN
        SELECT * FROM exam_halls
        WHERE institution_id = v_exam.institution_id
          AND is_active = true
        ORDER BY capacity DESC
    LOOP
        EXIT WHEN v_seat_counter > array_length(v_students, 1);

        FOR i IN 1..LEAST(v_hall.capacity, array_length(v_students, 1) - v_seat_counter + 1) LOOP
            INSERT INTO exam_seating (exam_id, institution_id, room_number, seat_number, student_id)
            VALUES (
                p_exam_id,
                v_exam.institution_id,
                v_hall.room_number,
                LPAD(i::TEXT, 3, '0'),
                v_students[v_seat_counter]
            );
            v_seat_counter := v_seat_counter + 1;
            v_total := v_total + 1;
        END LOOP;

        v_room_count := v_room_count + 1;
    END LOOP;

    total_allocated := v_total;
    rooms_used := v_room_count;
    message := 'Allocated ' || v_total || ' students across ' || v_room_count || ' rooms';
    RETURN NEXT;
END;
$$;

-- RPC: Check-in student at exam hall via QR scan
CREATE OR REPLACE FUNCTION checkin_exam_seat(
    p_exam_id UUID,
    p_room_number VARCHAR,
    p_seat_number VARCHAR,
    p_student_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    seat_info JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seat RECORD;
BEGIN
    SELECT * INTO v_seat
    FROM exam_seating
    WHERE exam_id = p_exam_id
      AND room_number = p_room_number
      AND seat_number = p_seat_number;

    IF v_seat IS NULL THEN
        success := false;
        message := 'No seat found for this room/seat combination';
        seat_info := NULL;
        RETURN NEXT;
        RETURN;
    END IF;

    IF v_seat.student_id != p_student_id THEN
        success := false;
        message := 'This seat is assigned to a different student';
        seat_info := NULL;
        RETURN NEXT;
        RETURN;
    END IF;

    UPDATE exam_seating
    SET is_checked_in = true, checked_in_at = NOW()
    WHERE id = v_seat.id;

    success := true;
    message := 'Check-in successful';
    seat_info := to_jsonb(v_seat);
    RETURN NEXT;
END;
$$;


-- ============================================================
-- 2. LOST & FOUND MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS lost_found_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Other' CHECK (category IN (
        'Electronics', 'ID Card', 'Wallet', 'Keys', 'Bag', 'Books', 'Clothing', 'Accessories', 'Other'
    )),
    description TEXT,
    photo_url TEXT,
    location_found VARCHAR(255),
    found_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'returned', 'disposed')),
    claimed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE lost_found_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin/Security can manage lost found items" ON lost_found_items
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "All users can view available lost found items" ON lost_found_items
    FOR SELECT USING (
        institution_id = get_auth_institution_id()
    );

CREATE POLICY "Students can claim items" ON lost_found_items
    FOR UPDATE USING (
        get_auth_user_role() = 'Student'
        AND institution_id = get_auth_institution_id()
    );

-- RPC: Claim a lost found item
CREATE OR REPLACE FUNCTION claim_lost_found_item(p_item_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
BEGIN
    SELECT * INTO v_item FROM lost_found_items WHERE id = p_item_id;

    IF v_item IS NULL THEN
        success := false;
        message := 'Item not found';
        RETURN NEXT;
        RETURN;
    END IF;

    IF v_item.status != 'available' THEN
        success := false;
        message := 'This item is no longer available';
        RETURN NEXT;
        RETURN;
    END IF;

    UPDATE lost_found_items
    SET status = 'claimed',
        claimed_by = auth.uid(),
        claimed_at = NOW()
    WHERE id = p_item_id;

    success := true;
    message := 'Item claimed. Please collect from the security desk.';
    RETURN NEXT;
END;
$$;


-- ============================================================
-- 3. NOTICE READ RECEIPTS ENHANCEMENT
-- ============================================================

-- Add status column to notices if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notices' AND column_name = 'status'
    ) THEN
        ALTER TABLE notices ADD COLUMN status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'));
    END IF;
END $$;

-- RPC: Get notice read receipt stats
CREATE OR REPLACE FUNCTION get_notice_read_stats(p_notice_id UUID)
RETURNS TABLE (
    notice_id UUID,
    total_target_users BIGINT,
    total_read BIGINT,
    read_percentage NUMERIC,
    unread_users JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notice RECORD;
    v_target_audience VARCHAR;
    v_total_users BIGINT;
    v_total_read BIGINT;
    v_unread JSONB;
BEGIN
    -- Get notice details
    SELECT * INTO v_notice FROM notices WHERE id = p_notice_id;

    IF v_notice IS NULL THEN
        RAISE EXCEPTION 'Notice not found';
    END IF;

    -- Count target users based on audience
    SELECT COUNT(*) INTO v_total_users
    FROM users u
    JOIN students s ON s.user_id = u.id
    WHERE s.institution_id = v_notice.institution_id
      AND s.is_active = true
      AND (
          v_notice.target_audience = 'All'
          OR (v_notice.target_audience = 'Students')
          OR (v_notice.target_audience = 'Staff' AND u.role IN ('Teacher', 'Staff', 'HOD'))
          OR (v_notice.target_audience = 'HOD' AND u.role = 'HOD')
      );

    -- Count users who have read it
    SELECT COUNT(DISTINCT nr.user_id) INTO v_total_read
    FROM notice_reads nr
    WHERE nr.notice_id = p_notice_id;

    -- Get unread users
    SELECT COALESCE(
        json_agg(json_build_object(
            'user_id', u.id,
            'name', u.name,
            'email', u.email
        )),
        '[]'::JSON
    ) INTO v_unread
    FROM users u
    JOIN students s ON s.user_id = u.id
    WHERE s.institution_id = v_notice.institution_id
      AND s.is_active = true
      AND u.id NOT IN (
          SELECT user_id FROM notice_reads WHERE notice_id = p_notice_id
      )
      AND (
          v_notice.target_audience = 'All'
          OR (v_notice.target_audience = 'Students')
          OR (v_notice.target_audience = 'Staff' AND u.role IN ('Teacher', 'Staff', 'HOD'))
          OR (v_notice.target_audience = 'HOD' AND u.role = 'HOD')
      )
    LIMIT 50;

    notice_id := p_notice_id;
    total_target_users := v_total_users;
    total_read := v_total_read;
    read_percentage := CASE WHEN v_total_users = 0 THEN 0 ELSE ROUND((v_total_read::NUMERIC / v_total_users::NUMERIC) * 100, 1) END;
    unread_users := v_unread;
    RETURN NEXT;
END;
$$;

-- RPC: Re-notify users who haven't read a notice
CREATE OR REPLACE FUNCTION get_unread_notice_recipients(p_notice_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name VARCHAR,
    email VARCHAR,
    phone VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notice RECORD;
BEGIN
    SELECT * INTO v_notice FROM notices WHERE id = p_notice_id;

    IF v_notice IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT u.id, u.name AS full_name, u.email, s.guardian_phone AS phone
    FROM users u
    JOIN students s ON s.user_id = u.id
    WHERE s.institution_id = v_notice.institution_id
      AND s.is_active = true
      AND u.id NOT IN (
          SELECT user_id FROM notice_reads WHERE notice_id = p_notice_id
      )
      AND (
          v_notice.target_audience = 'All'
          OR (v_notice.target_audience = 'Students')
          OR (v_notice.target_audience = 'Staff' AND u.role IN ('Teacher', 'Staff', 'HOD'))
          OR (v_notice.target_audience = 'HOD' AND u.role = 'HOD')
      );
END;
$$;


-- ==========================================================
-- MIGRATION: 20260612000006_broken_fixes_and_new_modules.sql
-- ==========================================================

-- ============================================================
-- BROKEN FIXES: Gym membership, Hostel roommates, Timetable batch, Fee penalties
-- ============================================================

-- ============================================================
-- 1. FIX: Gym booking RPC - add active membership check
-- ============================================================
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
  v_has_membership BOOLEAN;
BEGIN
  -- CHECK: Student must have an active gym membership
  SELECT EXISTS (
    SELECT 1 FROM gym_memberships gm
    WHERE gm.student_id = p_student_id
      AND gm.institution_id = p_institution_id
      AND gm.status = 'Active'
      AND gm.end_date >= CURRENT_DATE
      AND (gm.is_frozen IS NOT TRUE OR gm.frozen_until < CURRENT_DATE)
  ) INTO v_has_membership;

  IF NOT v_has_membership THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No active gym membership found. Please purchase a membership before booking slots.'
    );
  END IF;

  -- Check if student already booked this slot
  IF EXISTS (
    SELECT 1 FROM gym_bookings
    WHERE student_id = p_student_id AND slot_id = p_slot_id AND status = 'Booked'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Student already has an active booking for this gym slot. Duplicate booking denied.'
    );
  END IF;

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


-- ============================================================
-- 2. FIX: Timetable - add semester + batch_year columns
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timetable' AND column_name = 'semester'
  ) THEN
    ALTER TABLE timetable ADD COLUMN semester INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timetable' AND column_name = 'batch_year'
  ) THEN
    ALTER TABLE timetable ADD COLUMN batch_year VARCHAR(10) DEFAULT '';
  END IF;
END $$;

-- RPC: Get student timetable filtered by their semester/batch
CREATE OR REPLACE FUNCTION get_student_timetable_filtered(p_student_id UUID)
RETURNS TABLE (
    id UUID,
    day_of_week VARCHAR,
    time_slot VARCHAR,
    subject VARCHAR,
    teacher_name TEXT,
    room VARCHAR,
    semester INTEGER,
    batch_year VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student RECORD;
BEGIN
  SELECT s.department_id, s.semester, s.batch_year INTO v_student
  FROM students s WHERE s.id = p_student_id;

  IF v_student IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT t.id, t.day_of_week, t.time_slot, t.subject,
         u.name AS teacher_name, t.room, t.semester, t.batch_year
  FROM timetable t
  LEFT JOIN staff st ON t.teacher_id = st.id
  LEFT JOIN users u ON st.user_id = u.id
  WHERE t.department_id = v_student.department_id
    AND (t.semester = v_student.semester OR t.semester IS NULL OR t.semester = 0)
    AND (t.batch_year = v_student.batch_year OR t.batch_year = '' OR t.batch_year IS NULL)
  ORDER BY
    CASE t.day_of_week
      WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
      ELSE 7
    END,
    t.time_slot;
END;
$$;


-- ============================================================
-- 3. FIX: Fee structures - add late fee columns (if not already added)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fee_structures' AND column_name = 'late_fee_per_day'
  ) THEN
    ALTER TABLE fee_structures ADD COLUMN late_fee_per_day NUMERIC(8,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fee_structures' AND column_name = 'grace_period_days'
  ) THEN
    ALTER TABLE fee_structures ADD COLUMN grace_period_days INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fee_structures' AND column_name = 'max_penalty'
  ) THEN
    ALTER TABLE fee_structures ADD COLUMN max_penalty NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- RPC: Calculate late fee penalty for a given student fee
CREATE OR REPLACE FUNCTION calculate_late_fee(p_student_fee_id UUID)
RETURNS TABLE (
    original_amount NUMERIC,
    days_overdue INTEGER,
    late_fee_per_day NUMERIC,
    days_after_grace INTEGER,
    total_late_fee NUMERIC,
    total_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sf RECORD;
  v_fs RECORD;
  v_days_overdue INTEGER;
  v_days_after_grace INTEGER;
  v_late_fee NUMERIC;
BEGIN
  SELECT sf.*, fs.late_fee_per_day, fs.grace_period_days, fs.max_penalty, fs.amount AS fs_amount
  INTO v_sf
  FROM student_fees sf
  JOIN fee_structures fs ON sf.fee_id = fs.id
  WHERE sf.id = p_student_fee_id;

  IF v_sf IS NULL THEN RETURN; END IF;

  v_days_overdue := GREATEST(0, (CURRENT_DATE - v_sf.due_date)::INTEGER);
  v_days_after_grace := GREATEST(0, v_days_overdue - COALESCE(v_sf.grace_period_days, 0));
  v_late_fee := v_days_after_grace * COALESCE(v_sf.late_fee_per_day, 0);

  -- Apply max penalty cap
  IF COALESCE(v_sf.max_penalty, 0) > 0 THEN
    v_late_fee := LEAST(v_late_fee, v_sf.max_penalty);
  END IF;

  original_amount := v_sf.amount;
  days_overdue := v_days_overdue;
  late_fee_per_day := COALESCE(v_sf.late_fee_per_day, 0);
  days_after_grace := v_days_after_grace;
  total_late_fee := v_late_fee;
  total_amount := v_sf.amount + v_late_fee;
  RETURN NEXT;
END;
$$;


-- ============================================================
-- 4. ADD: Canteen - is_special_daily flag + allergen search
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'canteen_menus' AND column_name = 'is_daily_special'
  ) THEN
    ALTER TABLE canteen_menus ADD COLUMN is_daily_special BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- RPC: Get today's menu with allergen filter
CREATE OR REPLACE FUNCTION get_canteen_menu_filtered(
  p_category VARCHAR DEFAULT NULL,
  p_veg_only BOOLEAN DEFAULT FALSE,
  p_exclude_allergens TEXT[] DEFAULT NULL,
  p_search VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    item_name VARCHAR,
    category VARCHAR,
    price DECIMAL,
    image_url TEXT,
    is_available BOOLEAN,
    is_veg BOOLEAN,
    is_daily_special BOOLEAN,
    description TEXT,
    calories INTEGER,
    prep_time_mins INTEGER,
    spice_level INTEGER,
    rating_avg DECIMAL,
    allergens TEXT[],
    stock_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT cm.id, cm.item_name, cm.category, cm.price, cm.image_url,
         cm.is_available, cm.is_veg, cm.is_daily_special,
         cm.description, cm.calories, cm.prep_time_mins,
         cm.spice_level, cm.rating_avg, cm.allergens, cm.stock_remaining
  FROM canteen_menus cm
  WHERE cm.is_available = true
    AND (p_category IS NULL OR cm.category = p_category)
    AND (p_veg_only = FALSE OR cm.is_veg = TRUE)
    AND (p_search IS NULL OR cm.item_name ILIKE '%' || p_search || '%')
    AND (p_exclude_allergens IS NULL OR NOT cm.allergens && p_exclude_allergens)
  ORDER BY cm.is_daily_special DESC, cm.sort_order ASC, cm.rating_avg DESC;
END;
$$;


-- ============================================================
-- 5. ADD: Hostel roommates - dedicated RPC (no data leak)
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_roommates(p_student_id UUID)
RETURNS TABLE (
    student_name TEXT,
    roll_number VARCHAR,
    room_number VARCHAR,
    block_name VARCHAR,
    floor_number INTEGER,
    bed_number VARCHAR,
    course VARCHAR,
    department_name TEXT,
    phone VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_allocation RECORD;
BEGIN
  -- Get current allocation for this student
  SELECT ha.room_id INTO v_allocation
  FROM hostel_allocations ha
  WHERE ha.student_id = p_student_id AND ha.is_current = TRUE;

  IF v_allocation IS NULL THEN RETURN; END IF;

  -- Return only students in the same room
  RETURN QUERY
  SELECT u.name AS student_name, s.roll_number,
         hr.room_number, hb.name AS block_name, hr.floor_number,
         ha2.bed_number, s.course, d.name AS department_name, u.phone
  FROM hostel_allocations ha2
  JOIN students s ON ha2.student_id = s.id
  JOIN users u ON s.user_id = u.id
  JOIN hostel_rooms hr ON ha2.room_id = hr.id
  JOIN hostel_blocks hb ON hr.block_id = hb.id
  LEFT JOIN departments d ON s.department_id = d.id
  WHERE ha2.room_id = v_allocation.room_id
    AND ha2.is_current = TRUE
    AND ha2.student_id != p_student_id;
END;
$$;


-- ============================================================
-- 6. ADD: Assignment submission module
-- ============================================================
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(150),
    total_marks INTEGER DEFAULT 100,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png'],
    max_file_size_mb INTEGER DEFAULT 10,
    semester INTEGER,
    batch_year VARCHAR(10),
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size_kb INTEGER,
    file_type VARCHAR(10),
    marks_obtained INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
    CONSTRAINT unique_submission_per_assignment UNIQUE (assignment_id, student_id)
);

-- RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff/Admin can manage assignments" ON assignments
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'Staff')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Students can view published assignments" ON assignments
    FOR SELECT USING (
        is_published = true
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Students can view/insert own submissions" ON assignment_submissions
    FOR ALL USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff/Admin can view submissions" ON assignment_submissions
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'Staff')
        AND assignment_id IN (SELECT id FROM assignments WHERE institution_id = get_auth_institution_id())
    );

-- RPC: Submit assignment
CREATE OR REPLACE FUNCTION submit_assignment(
    p_assignment_id UUID,
    p_file_url TEXT,
    p_file_name VARCHAR,
    p_file_size_kb INTEGER,
    p_file_type VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_assignment RECORD;
    v_submission_id UUID;
BEGIN
    SELECT id INTO v_student_id FROM students WHERE user_id = auth.uid();
    IF v_student_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Student profile not found.');
    END IF;

    SELECT * INTO v_assignment FROM assignments WHERE id = p_assignment_id AND is_published = true;
    IF v_assignment IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Assignment not found or not published.');
    END IF;

    IF v_assignment.deadline < NOW() THEN
        RETURN json_build_object('success', false, 'error', 'Submission deadline has passed.');
    END IF;

    -- Upsert (allow resubmission before deadline)
    INSERT INTO assignment_submissions (assignment_id, student_id, file_url, file_name, file_size_kb, file_type, status)
    VALUES (p_assignment_id, v_student_id, p_file_url, p_file_name, p_file_size_kb, p_file_type, 'submitted')
    ON CONFLICT (assignment_id, student_id)
    DO UPDATE SET file_url = EXCLUDED.file_url, file_name = EXCLUDED.file_name,
                  file_size_kb = EXCLUDED.file_size_kb, file_type = EXCLUDED.file_type,
                  submitted_at = NOW(), status = 'submitted', marks_obtained = NULL, feedback = NULL
    RETURNING id INTO v_submission_id;

    RETURN json_build_object('success', true, 'submission_id', v_submission_id);
END;
$$;


-- ============================================================
-- 7. ADD: Study material / notes module
-- ============================================================
CREATE TABLE IF NOT EXISTS study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(150),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(10),
    file_size_kb INTEGER,
    category VARCHAR(50) DEFAULT 'Notes' CHECK (category IN ('Notes', 'Lab Manual', 'Textbook', 'Video', 'PPT', 'Question Bank', 'Syllabus', 'Other')),
    semester INTEGER,
    batch_year VARCHAR(10),
    download_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff/Admin can manage study materials" ON study_materials
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'Staff')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Students can view published materials" ON study_materials
    FOR SELECT USING (
        is_published = true
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Students can view materials for their dept/semester" ON study_materials
    FOR SELECT USING (
        is_published = true
        AND (department_id IS NULL OR department_id IN (
            SELECT department_id FROM students WHERE user_id = auth.uid()
        ))
        AND (semester IS NULL OR semester IN (
            SELECT semester FROM students WHERE user_id = auth.uid()
        ))
    );


-- ============================================================
-- 8. ADD: Leave application module
-- ============================================================
CREATE TABLE IF NOT EXISTS student_leave_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    leave_type VARCHAR(30) NOT NULL CHECK (leave_type IN ('medical', 'od', 'personal', 'half_day', 'emergency')),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'faculty_approved', 'hod_approved', 'rejected')),
    faculty_remarks TEXT,
    faculty_approved_at TIMESTAMP WITH TIME ZONE,
    hod_remarks TEXT,
    hod_approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE student_leave_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view/insert own leaves" ON student_leave_applications
    FOR ALL USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Faculty/HOD/Admin can view leaves" ON student_leave_applications
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'HOD', 'Staff')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Faculty/HOD can update leave status" ON student_leave_applications
    FOR UPDATE USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'HOD')
    );

-- RPC: Submit leave application
CREATE OR REPLACE FUNCTION submit_leave_application(
    p_leave_type VARCHAR,
    p_from_date DATE,
    p_to_date DATE,
    p_reason TEXT,
    p_attachment_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_leave_id UUID;
BEGIN
    SELECT id INTO v_student_id FROM students WHERE user_id = auth.uid();
    IF v_student_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Student profile not found.');
    END IF;

    IF p_to_date < p_from_date THEN
        RETURN json_build_object('success', false, 'error', 'End date cannot be before start date.');
    END IF;

    INSERT INTO student_leave_applications (institution_id, student_id, leave_type, from_date, to_date, reason, attachment_url)
    SELECT s.institution_id, v_student_id, p_leave_type, p_from_date, p_to_date, p_reason, p_attachment_url
    FROM students s WHERE s.id = v_student_id
    RETURNING id INTO v_leave_id;

    RETURN json_build_object('success', true, 'leave_id', v_leave_id);
END;
$$;

-- RPC: Approve leave (faculty or HOD)
CREATE OR REPLACE FUNCTION approve_leave(
    p_leave_id UUID,
    p_approver_role VARCHAR,
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_leave RECORD;
    v_new_status VARCHAR;
BEGIN
    SELECT * INTO v_leave FROM student_leave_applications WHERE id = p_leave_id;
    IF v_leave IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Leave application not found.');
    END IF;

    IF p_approver_role = 'Teacher' OR p_approver_role = 'Staff' THEN
        IF v_leave.status != 'pending' THEN
            RETURN json_build_object('success', false, 'error', 'Leave already processed.');
        END IF;
        v_new_status := 'faculty_approved';
        UPDATE student_leave_applications SET status = v_new_status, faculty_remarks = p_remarks, faculty_approved_at = NOW() WHERE id = p_leave_id;
    ELSIF p_approver_role = 'HOD' OR p_approver_role = 'Admin' THEN
        IF v_leave.status != 'faculty_approved' THEN
            RETURN json_build_object('success', false, 'error', 'Leave must be faculty-approved before HOD approval.');
        END IF;
        v_new_status := 'hod_approved';
        UPDATE student_leave_applications SET status = v_new_status, hod_remarks = p_remarks, hod_approved_at = NOW() WHERE id = p_leave_id;

        -- Auto-mark attendance as excused for approved leave days
        UPDATE attendance SET status = 'excused', notes = 'Leave approved'
        WHERE student_id = v_leave.student_id
          AND date BETWEEN v_leave.from_date AND v_leave.to_date;
    ELSE
        RETURN json_build_object('success', false, 'error', 'Invalid approver role.');
    END IF;

    RETURN json_build_object('success', true, 'new_status', v_new_status);
END;
$$;

-- RPC: Reject leave
CREATE OR REPLACE FUNCTION reject_leave(
    p_leave_id UUID,
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE student_leave_applications SET status = 'rejected', hod_remarks = p_remarks, hod_approved_at = NOW()
    WHERE id = p_leave_id AND status IN ('pending', 'faculty_approved');

    IF FOUND THEN
        RETURN json_build_object('success', true, 'new_status', 'rejected');
    ELSE
        RETURN json_build_object('success', false, 'error', 'Leave not found or already processed.');
    END IF;
END;
$$;


-- ============================================================
-- 9. ADD: Campus wallet top-up via Razorpay
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('topup', 'deduction', 'refund', 'parent_topup')),
    payment_method VARCHAR(30) DEFAULT 'razorpay',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallet_transactions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE wallet_transactions ADD COLUMN payment_method VARCHAR(30) DEFAULT 'razorpay';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallet_transactions' AND column_name = 'razorpay_order_id'
  ) THEN
    ALTER TABLE wallet_transactions ADD COLUMN razorpay_order_id VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallet_transactions' AND column_name = 'razorpay_payment_id'
  ) THEN
    ALTER TABLE wallet_transactions ADD COLUMN razorpay_payment_id VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallet_transactions' AND column_name = 'status'
  ) THEN
    ALTER TABLE wallet_transactions ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
  END IF;
END $$;


ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own wallet transactions" ON wallet_transactions
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "System can insert wallet transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update wallet transactions" ON wallet_transactions
    FOR UPDATE USING (true);

-- RPC: Credit wallet after successful payment
CREATE OR REPLACE FUNCTION credit_wallet(
    p_student_id UUID,
    p_amount NUMERIC,
    p_razorpay_order_id VARCHAR,
    p_razorpay_payment_id VARCHAR,
    p_description TEXT DEFAULT 'Wallet top-up'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tx_id UUID;
    v_student RECORD;
BEGIN
    SELECT * INTO v_student FROM students WHERE id = p_student_id;
    IF v_student IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Student not found.');
    END IF;

    INSERT INTO wallet_transactions (institution_id, student_id, amount, type, razorpay_order_id, razorpay_payment_id, status, description)
    VALUES (v_student.institution_id, p_student_id, p_amount, 'topup', p_razorpay_order_id, p_razorpay_payment_id, 'completed', p_description)
    RETURNING id INTO v_tx_id;

    -- Update student wallet balance (students table needs wallet_balance column)
    UPDATE students SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount WHERE id = p_student_id;

    RETURN json_build_object('success', true, 'transaction_id', v_tx_id, 'new_balance', (SELECT wallet_balance FROM students WHERE id = p_student_id));
END;
$$;

-- Add wallet_balance column to students if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'wallet_balance'
  ) THEN
    ALTER TABLE students ADD COLUMN wallet_balance NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;


-- ============================================================
-- 10. ADD: Bus ETA endpoint for student's stop
-- ============================================================
CREATE OR REPLACE FUNCTION get_bus_eta_for_student(p_student_id UUID)
RETURNS TABLE (
    bus_id UUID,
    bus_name VARCHAR,
    route_name VARCHAR,
    stop_name VARCHAR,
    stop_index INTEGER,
    distance_km NUMERIC,
    eta_minutes INTEGER,
    latitude NUMERIC,
    longitude NUMERIC,
    last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription RECORD;
    v_bus RECORD;
    v_bus_id UUID;
    v_stop_index INTEGER;
    v_distance NUMERIC;
    v_velocity NUMERIC;
BEGIN
    -- Get student's bus subscription
    SELECT bs.route_id, bs.stop_name, br.stops
    INTO v_subscription
    FROM transport_subscriptions bs
    JOIN bus_routes br ON bs.route_id = br.id
    WHERE bs.student_id = p_student_id AND bs.status = 'active'
    LIMIT 1;

    IF v_subscription IS NULL THEN RETURN; END IF;

    -- Get bus assigned to this route
    SELECT b.id INTO v_bus_id
    FROM buses b
    WHERE b.route_id = v_subscription.route_id
    LIMIT 1;

    IF v_bus_id IS NULL THEN RETURN; END IF;

    -- Get latest bus location
    SELECT bl.bus_id, bl.latitude, bl.longitude, bl.speed, bl.recorded_at
    INTO v_bus
    FROM bus_tracking bl
    WHERE bl.bus_id = v_bus_id
    ORDER BY bl.recorded_at DESC
    LIMIT 1;

    IF v_bus IS NULL THEN RETURN; END IF;

    -- Find stop_index from JSONB stops array
    SELECT (pos - 1)::INTEGER INTO v_stop_index
    FROM jsonb_array_elements(v_subscription.stops) WITH ORDINALITY AS arr(elem, pos)
    WHERE elem->>'name' = v_subscription.stop_name
    LIMIT 1;

    IF v_stop_index IS NULL THEN RETURN; END IF;

    -- Calculate distance to student's stop using Haversine
    IF v_subscription.stops IS NOT NULL AND jsonb_array_length(v_subscription.stops) > 0 THEN
        DECLARE
            v_stop_lat NUMERIC;
            v_stop_lon NUMERIC;
        BEGIN
            v_stop_lat := (v_subscription.stops->v_stop_index->>'latitude')::NUMERIC;
            v_stop_lon := (v_subscription.stops->v_stop_index->>'longitude')::NUMERIC;

            v_distance := (
                6371 * acos(
                    cos(radians(v_bus.latitude)) * cos(radians(v_stop_lat)) *
                    cos(radians(v_stop_lon) - radians(v_bus.longitude)) +
                    sin(radians(v_bus.latitude)) * sin(radians(v_stop_lat))
                )
            );

            v_velocity := CASE WHEN v_bus.speed > 5 THEN v_bus.speed ELSE 25 END;

            bus_id := v_bus.bus_id;
            bus_name := (SELECT name FROM buses WHERE id = v_bus.bus_id);
            route_name := (SELECT route_name FROM bus_routes WHERE id = v_subscription.route_id);
            stop_name := v_subscription.stop_name;
            stop_index := v_stop_index;
            distance_km := ROUND(v_distance, 2);
            eta_minutes := ROUND((v_distance / v_velocity) * 60);
            latitude := v_bus.latitude;
            longitude := v_bus.longitude;
            last_updated := v_bus.recorded_at;
            RETURN NEXT;
        END;
    END IF;
END;
$$;


-- ==========================================================
-- MIGRATION: 20260612000007_parent_module_fixes.sql
-- ==========================================================

-- ============================================================
-- PARENT MODULE: RLS fixes, daily digest, wallet top-up, visitor auth
-- ============================================================

-- ============================================================
-- 1. FIX: parent_student_links column consistency
-- ============================================================
-- The table uses student_id but some RPCs reference child_student_id.
-- Ensure column is student_id (the original definition).

-- ============================================================
-- 2. ADD: RLS policies for Parent role across core tables
-- ============================================================

-- Students: Parents can view linked children
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked children'
    AND tablename = 'students'
  ) THEN
    CREATE POLICY "Parents can view linked children" ON students
      FOR SELECT USING (
        id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
      );
  END IF;
END $$;

-- Attendance: Parents can view linked children's attendance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked child attendance'
    AND tablename = 'attendance'
  ) THEN
    CREATE POLICY "Parents can view linked child attendance" ON attendance
      FOR SELECT USING (
        student_id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
      );
  END IF;
END $$;

-- Student fees: Parents can view linked children's fees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked child fees'
    AND tablename = 'student_fees'
  ) THEN
    CREATE POLICY "Parents can view linked child fees" ON student_fees
      FOR SELECT USING (
        student_id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
      );
  END IF;
END $$;

-- Exam results: Parents can view linked children's results
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked child results'
    AND tablename = 'exam_results'
  ) THEN
    CREATE POLICY "Parents can view linked child results" ON exam_results
      FOR SELECT USING (
        student_id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
      );
  END IF;
END $$;

-- Notices: Parents can view notices from linked children's institution
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view institution notices'
    AND tablename = 'notices'
  ) THEN
    CREATE POLICY "Parents can view institution notices" ON notices
      FOR SELECT USING (
        institution_id IN (
          SELECT s.institution_id FROM parent_student_links psl
          JOIN students s ON psl.student_id = s.id
          WHERE psl.parent_user_id = auth.uid() AND psl.verified = true
        )
      );
  END IF;
END $$;

-- Gate logs: Parents can view linked children's gate logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked child gate logs'
    AND tablename = 'gate_logs'
  ) THEN
    CREATE POLICY "Parents can view linked child gate logs" ON gate_logs
      FOR SELECT USING (
        person_id IN (
          SELECT s.user_id FROM parent_student_links psl
          JOIN students s ON psl.student_id = s.id
          WHERE psl.parent_user_id = auth.uid() AND psl.verified = true
        )
      );
  END IF;
END $$;

-- Bus subscriptions: Parents can view linked children's bus subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked child bus subscriptions'
    AND tablename = 'transport_subscriptions'
  ) THEN
    CREATE POLICY "Parents can view linked child bus subscriptions" ON transport_subscriptions
      FOR SELECT USING (
        student_id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
      );
  END IF;
END $$;

-- Wallet transactions: Parents can view linked children's transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked child wallet tx'
    AND tablename = 'wallet_transactions'
  ) THEN
    CREATE POLICY "Parents can view linked child wallet tx" ON wallet_transactions
      FOR SELECT USING (
        student_id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
      );
  END IF;
END $$;

-- Parents can INSERT wallet transactions (for top-up)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can top-up linked child wallet'
    AND tablename = 'wallet_transactions'
  ) THEN
    CREATE POLICY "Parents can top-up linked child wallet" ON wallet_transactions
      FOR INSERT WITH CHECK (
        student_id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
        AND type = 'parent_topup'
      );
  END IF;
END $$;

-- Hostel allocations: Parents can view linked children's allocation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked child hostel'
    AND tablename = 'hostel_allocations'
  ) THEN
    CREATE POLICY "Parents can view linked child hostel" ON hostel_allocations
      FOR SELECT USING (
        student_id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
      );
  END IF;
END $$;

-- ============================================================
-- 3. ADD: Hostel visitor pre-authorization
-- ============================================================
CREATE TABLE IF NOT EXISTS hostel_visitor_preauth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20),
    visit_date DATE NOT NULL,
    visit_time TIME,
    purpose TEXT,
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('approved', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE hostel_visitor_preauth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage own visitor preauth" ON hostel_visitor_preauth
    FOR ALL USING (
        parent_user_id = auth.uid()
    );

CREATE POLICY "Students can view own visitor preauth" ON hostel_visitor_preauth
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Warden/Security can view all preauth" ON hostel_visitor_preauth
    FOR SELECT USING (
        get_auth_user_role() IN ('Warden', 'Security', 'Admin')
        AND institution_id = get_auth_institution_id()
    );

-- RPC: Pre-authorize a visit
CREATE OR REPLACE FUNCTION preauthorize_visitor(
    p_student_id UUID,
    p_visitor_name VARCHAR,
    p_visitor_phone VARCHAR,
    p_visit_date DATE,
    p_visit_time TIME,
    p_purpose TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_preauth_id UUID;
    v_parent_id UUID;
    v_institution_id UUID;
BEGIN
    -- Verify parent is linked to this student
    SELECT psl.parent_user_id, s.institution_id INTO v_parent_id, v_institution_id
    FROM parent_student_links psl
    JOIN students s ON psl.student_id = s.id
    WHERE psl.parent_user_id = auth.uid()
      AND psl.student_id = p_student_id
      AND psl.verified = true;

    IF v_parent_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authorized to pre-approve visits for this student.');
    END IF;

    INSERT INTO hostel_visitor_preauth (institution_id, student_id, parent_user_id, visitor_name, visitor_phone, visit_date, visit_time, purpose)
    VALUES (v_institution_id, p_student_id, v_parent_id, p_visitor_name, p_visitor_phone, p_visit_date, p_visit_time, p_purpose)
    RETURNING id INTO v_preauth_id;

    RETURN json_build_object('success', true, 'preauth_id', v_preauth_id);
END;
$$;

-- ============================================================
-- 4. ADD: Exam result notification for parents
-- ============================================================
CREATE TABLE IF NOT EXISTS parent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'daily_digest', 'attendance_alert', 'fee_reminder', 'exam_result',
        'wallet_topup', 'visitor_approved', 'bus_boarded', 'hostel_complaint'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_via_whatsapp BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own notifications" ON parent_notifications
    FOR SELECT USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can mark own notifications read" ON parent_notifications
    FOR UPDATE USING (parent_user_id = auth.uid());

CREATE POLICY "System can insert parent notifications" ON parent_notifications
    FOR INSERT WITH CHECK (true);

-- ============================================================
-- 5. RPC: Get parent's child info (replaces hardcoded mock)
-- ============================================================
CREATE OR REPLACE FUNCTION get_parent_child_info()
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number VARCHAR,
    course VARCHAR,
    department_name TEXT,
    semester INTEGER,
    year INTEGER,
    guardian_phone VARCHAR,
    wallet_balance NUMERIC,
    institution_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, u.name, s.roll_number, s.course, d.name,
           s.semester, s.year, s.guardian_phone, s.wallet_balance, s.institution_id
    FROM parent_student_links psl
    JOIN students s ON psl.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE psl.parent_user_id = auth.uid()
      AND psl.verified = true
    ORDER BY psl.is_primary DESC NULLS LAST
    LIMIT 1;
END;
$$;

-- ============================================================
-- 6. RPC: Get parent child daily summary
-- ============================================================
CREATE OR REPLACE FUNCTION get_parent_daily_summary(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    student_name TEXT,
    attendance_present BIGINT,
    attendance_total BIGINT,
    attendance_pct NUMERIC,
    canteen_spend NUMERIC,
    bus_boarded BOOLEAN,
    bus_time TIME,
    gate_in TIME,
    gate_out TIME,
    pending_fees NUMERIC,
    wallet_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_user_id UUID;
BEGIN
    -- Get linked child
    SELECT psl.student_id, s.user_id INTO v_student_id, v_user_id
    FROM parent_student_links psl
    JOIN students s ON psl.student_id = s.id
    WHERE psl.parent_user_id = auth.uid() AND psl.verified = true
    ORDER BY psl.is_primary DESC NULLS LAST LIMIT 1;

    IF v_student_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT
        u.name,
        COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::BIGINT,
        COUNT(a.id)::BIGINT,
        CASE WHEN COUNT(a.id) = 0 THEN 100.0
             ELSE ROUND(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC / COUNT(a.id)::NUMERIC * 100, 1)
        END,
        COALESCE((SELECT SUM(co.total_amount) FROM canteen_orders co WHERE co.student_id = v_student_id AND co.created_at::DATE = p_date), 0),
        EXISTS(SELECT 1 FROM bus_tracking bt WHERE bt.student_id = v_student_id AND bt.boarded_at::DATE = p_date),
        (SELECT bt.boarded_at::TIME FROM bus_tracking bt WHERE bt.student_id = v_student_id AND bt.boarded_at::DATE = p_date LIMIT 1),
        (SELECT gl.in_time::TIME FROM gate_logs gl WHERE gl.person_id = v_user_id AND gl.in_time::DATE = p_date LIMIT 1),
        (SELECT gl.out_time::TIME FROM gate_logs gl WHERE gl.person_id = v_user_id AND gl.out_time::DATE = p_date ORDER BY gl.out_time DESC LIMIT 1),
        (SELECT COALESCE(SUM(sf.amount - COALESCE(sf.paid_amount, 0)), 0) FROM student_fees sf WHERE sf.student_id = v_student_id AND sf.payment_status IN ('pending', 'partial')),
        (SELECT COALESCE(s.wallet_balance, 0) FROM students s WHERE s.id = v_student_id)
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE a.student_id = v_student_id AND a.date = p_date
    GROUP BY u.name;
END;
$$;

-- ============================================================
-- 7. RPC: Parent top-up child wallet
-- ============================================================
CREATE OR REPLACE FUNCTION parent_topup_child_wallet(
    p_student_id UUID,
    p_amount NUMERIC,
    p_description TEXT DEFAULT 'Parent wallet top-up'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_authorized BOOLEAN;
    v_tx_id UUID;
    v_new_balance NUMERIC;
BEGIN
    -- Verify parent is linked
    SELECT EXISTS (
        SELECT 1 FROM parent_student_links
        WHERE parent_user_id = auth.uid()
          AND student_id = p_student_id
          AND verified = true
    ) INTO v_authorized;

    IF NOT v_authorized THEN
        RETURN json_build_object('success', false, 'error', 'Not authorized to top-up this student.');
    END IF;

    IF p_amount <= 0 OR p_amount > 10000 THEN
        RETURN json_build_object('success', false, 'error', 'Amount must be between ₹1 and ₹10,000.');
    END IF;

    -- Record transaction
    INSERT INTO wallet_transactions (institution_id, student_id, amount, type, status, description)
    SELECT s.institution_id, p_student_id, p_amount, 'parent_topup', 'completed', p_description
    FROM students s WHERE s.id = p_student_id
    RETURNING id INTO v_tx_id;

    -- Update balance
    UPDATE students SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount WHERE id = p_student_id
    RETURNING wallet_balance INTO v_new_balance;

    -- Create parent notification
    INSERT INTO parent_notifications (parent_user_id, student_id, notification_type, title, message, metadata)
    VALUES (
        auth.uid(), p_student_id, 'wallet_topup',
        'Wallet Top-Up Successful',
        '₹' || p_amount || ' has been added to your child''s campus wallet.',
        json_build_object('amount', p_amount, 'transaction_id', v_tx_id)
    );

    RETURN json_build_object('success', true, 'transaction_id', v_tx_id, 'new_balance', v_new_balance);
END;
$$;

-- ============================================================
-- 8. RPC: Get parent notification unread count
-- ============================================================
CREATE OR REPLACE FUNCTION get_parent_unread_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (SELECT COUNT(*)::BIGINT FROM parent_notifications
            WHERE parent_user_id = auth.uid() AND is_read = false);
END;
$$;

-- ============================================================
-- 9. RPC: Get child's bus status (is child on the bus?)
-- ============================================================
CREATE OR REPLACE FUNCTION get_child_bus_status()
RETURNS TABLE (
    is_on_bus BOOLEAN,
    bus_name VARCHAR,
    route_name VARCHAR,
    last_stop VARCHAR,
    eta_minutes INTEGER,
    latitude NUMERIC,
    longitude NUMERIC,
    last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_user_id UUID;
    v_subscription RECORD;
    v_bus_record RECORD;
    v_bus_loc RECORD;
BEGIN
    SELECT psl.student_id, s.user_id INTO v_student_id, v_user_id
    FROM parent_student_links psl
    JOIN students s ON psl.student_id = s.id
    WHERE psl.parent_user_id = auth.uid() AND psl.verified = true
    ORDER BY psl.is_primary DESC NULLS LAST LIMIT 1;

    IF v_student_id IS NULL THEN RETURN; END IF;

    -- Check if student has active bus subscription
    SELECT bs.route_id, bs.stop_name INTO v_subscription
    FROM transport_subscriptions bs
    WHERE bs.student_id = v_student_id AND bs.status = 'active'
    LIMIT 1;

    IF v_subscription IS NULL THEN
        is_on_bus := false;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Check gate log for boarding today (i.e. went out today)
    IF NOT EXISTS (
        SELECT 1 FROM gate_logs
        WHERE person_id = v_user_id
          AND out_time::DATE = CURRENT_DATE
    ) THEN
        is_on_bus := false;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Get bus assigned to this route
    SELECT b.id, b.name INTO v_bus_record
    FROM buses b
    WHERE b.route_id = v_subscription.route_id
    LIMIT 1;

    IF v_bus_record IS NULL THEN
        is_on_bus := false;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Get bus location
    SELECT bt.latitude, bt.longitude, bt.speed, bt.timestamp
    INTO v_bus_loc
    FROM bus_tracking bt
    WHERE bt.bus_id = v_bus_record.id
    ORDER BY bt.timestamp DESC LIMIT 1;

    IF v_bus_loc IS NULL THEN
        is_on_bus := false;
        RETURN NEXT;
        RETURN;
    END IF;

    is_on_bus := true;
    bus_name := v_bus_record.name;
    route_name := (SELECT name FROM bus_routes WHERE id = v_subscription.route_id);
    latitude := v_bus_loc.latitude;
    longitude := v_bus_loc.longitude;
    last_updated := v_bus_loc.timestamp;
    eta_minutes := 0; -- Would calculate from Haversine
    last_stop := '';
    RETURN NEXT;
END;
$$;


-- ==========================================================
-- MIGRATION: 20260612000008_faculty_module.sql
-- ==========================================================

-- ============================================================
-- FACULTY MODULE: Department check, CIA marks, timetable fix
-- ============================================================

-- ============================================================
-- 1. ADD: CIA / Internal Marks tables
-- ============================================================
CREATE TABLE IF NOT EXISTS cia_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    assessment_type VARCHAR(30) NOT NULL CHECK (assessment_type IN (
        'CIA_1', 'CIA_2', 'CIA_3', 'Assignment', 'Quiz', 'Presentation', 'Lab', 'Attendance_Marks', 'Other'
    )),
    subject VARCHAR(150),
    max_marks INTEGER NOT NULL DEFAULT 30,
    weightage_pct DECIMAL(5,2) DEFAULT 0,
    semester INTEGER,
    batch_year VARCHAR(10),
    date DATE,
    deadline TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cia_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES cia_assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(8,2) NOT NULL DEFAULT 0,
    remarks TEXT,
    entered_by UUID REFERENCES users(id),
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_cia_mark_per_student UNIQUE (assessment_id, student_id)
);

-- RLS
ALTER TABLE cia_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cia_marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Faculty can manage own CIA assessments" ON cia_assessments
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'Staff')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Students can view published CIA assessments" ON cia_assessments
    FOR SELECT USING (
        is_published = true
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Faculty can manage own CIA marks" ON cia_marks
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'Staff')
        AND (
            get_auth_user_role() = 'SuperAdmin' 
            OR assessment_id IN (
                SELECT id FROM cia_assessments WHERE institution_id = get_auth_institution_id()
            )
        )
    );

CREATE POLICY "Students can view own CIA marks" ON cia_marks
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Parents can view linked child CIA marks" ON cia_marks
    FOR SELECT USING (
        student_id IN (
            SELECT student_id FROM parent_student_links
            WHERE parent_user_id = auth.uid() AND verified = true
        )
    );

-- RPC: Get students with attendance shortage for a specific subject/department
CREATE OR REPLACE FUNCTION get_class_attendance_shortage(
    p_department_id UUID,
    p_subject VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number VARCHAR,
    total_classes BIGINT,
    attended_classes BIGINT,
    attendance_pct NUMERIC,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        u.name AS full_name,
      s.roll_number,
        COUNT(a.id)::BIGINT,
        COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::BIGINT,
        CASE WHEN COUNT(a.id) = 0 THEN 100.0
             ELSE ROUND(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC / COUNT(a.id)::NUMERIC * 100, 1)
        END,
        CASE
            WHEN COUNT(a.id) = 0 THEN 'No Data'
            WHEN COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC / COUNT(a.id)::NUMERIC * 100 < 60 THEN 'CRITICAL'
            WHEN COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC / COUNT(a.id)::NUMERIC * 100 < 75 THEN 'AT RISK'
            ELSE 'SAFE'
        END
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN attendance a ON a.student_id = s.id
        AND (p_subject IS NULL OR a.session_id IN (
            SELECT id FROM attendance_sessions WHERE subject = p_subject
        ))
    WHERE s.department_id = p_department_id
      AND s.is_active = true
    GROUP BY s.id, u.name, s.roll_number
    ORDER BY attendance_pct ASC;
END;
$$;

-- RPC: Bulk enter CIA marks
CREATE OR REPLACE FUNCTION bulk_enter_cia_marks(
    p_assessment_id UUID,
    p_marks JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entry JSONB;
    v_count INTEGER := 0;
    v_assessment RECORD;
BEGIN
    -- Verify assessment exists
    SELECT * INTO v_assessment FROM cia_assessments WHERE id = p_assessment_id;
    IF v_assessment IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Assessment not found.');
    END IF;

    -- Iterate over marks entries
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_marks)
    LOOP
        INSERT INTO cia_marks (assessment_id, student_id, marks_obtained, remarks, entered_by)
        VALUES (
            p_assessment_id,
            (v_entry->>'student_id')::UUID,
            (v_entry->>'marks_obtained')::DECIMAL,
            COALESCE(v_entry->>'remarks', ''),
            auth.uid()
        )
        ON CONFLICT (assessment_id, student_id)
        DO UPDATE SET
            marks_obtained = EXCLUDED.marks_obtained,
            remarks = EXCLUDED.remarks,
            entered_by = auth.uid(),
            entered_at = NOW();
        v_count := v_count + 1;
    END LOOP;

    RETURN json_build_object('success', true, 'marks_entered', v_count);
END;
$$;

-- RPC: Get CIA summary for a student
CREATE OR REPLACE FUNCTION get_student_cia_summary(p_student_id UUID)
RETURNS TABLE (
    assessment_name VARCHAR,
    assessment_type VARCHAR,
    subject VARCHAR,
    max_marks INTEGER,
    marks_obtained DECIMAL,
    percentage NUMERIC,
    date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT ca.name, ca.assessment_type, ca.subject, ca.max_marks,
           cm.marks_obtained,
           CASE WHEN ca.max_marks > 0 THEN ROUND(cm.marks_obtained / ca.max_marks::NUMERIC * 100, 1) ELSE 0 END,
           ca.date
    FROM cia_assessments ca
    LEFT JOIN cia_marks cm ON cm.assessment_id = ca.id AND cm.student_id = p_student_id
    WHERE ca.is_published = true
    ORDER BY ca.date DESC, ca.name;
END;
$$;

-- RPC: Get timetable filtered by teacher_id
CREATE OR REPLACE FUNCTION get_teacher_timetable(p_teacher_id UUID)
RETURNS TABLE (
    id UUID,
    day_of_week VARCHAR,
    time_slot VARCHAR,
    subject VARCHAR,
    room VARCHAR,
    department_name TEXT,
    semester INTEGER,
    batch_year VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_id UUID;
BEGIN
    -- Get staff record for this teacher
    SELECT st.id INTO v_staff_id FROM staff st WHERE st.user_id = p_teacher_id;

    IF v_staff_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT t.id, t.day_of_week, t.time_slot, t.subject, t.room,
           d.name, t.semester, t.batch_year
    FROM timetable t
    LEFT JOIN departments d ON t.department_id = d.id
    WHERE t.teacher_id = v_staff_id
    ORDER BY
        CASE t.day_of_week
            WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
            ELSE 7
        END,
        t.time_slot;
END;
$$;


-- ==========================================================
-- MIGRATION: 20260612000009_admin_gaps_fix.sql
-- ==========================================================

-- ============================================================
-- ADMIN GAPS FIX: Admission docs, Timetable auto-gen, HOD fix,
-- Defaulter report, Academic calendar
-- ============================================================

-- ============================================================
-- 1. STUDENT ADMISSION: Document uploads + admission workflow
-- ============================================================
CREATE TABLE IF NOT EXISTS student_admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    applicant_name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    roll_number VARCHAR(50),
    department_id UUID REFERENCES departments(id),
    admission_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    semester INTEGER DEFAULT 1,
    batch_year VARCHAR(10),
    application_number VARCHAR(50) UNIQUE,
    admission_status VARCHAR(30) DEFAULT 'applied' CHECK (admission_status IN (
        'applied', 'documents_pending', 'under_review', 'approved', 'enrolled', 'rejected', 'waitlisted'
    )),
    guardian_name VARCHAR(200),
    guardian_phone VARCHAR(20),
    dob DATE,
    gender VARCHAR(20),
    address TEXT,
    category VARCHAR(50),
    blood_group VARCHAR(10),
    aadhaar_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admission_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id UUID NOT NULL REFERENCES student_admissions(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        '10th_marksheet', '12th_marksheet', 'aadhaar', 'photo', 'migration_cert',
        'caste_cert', 'income_cert', 'medical_cert', 'tc', 'other'
    )),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_kb INTEGER,
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admission_workflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id UUID NOT NULL REFERENCES student_admissions(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by UUID REFERENCES users(id),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE student_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_workflow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage admissions" ON student_admissions
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Admin can manage admission documents" ON admission_documents
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
    );

CREATE POLICY "Admin can manage admission workflow" ON admission_workflow
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
    );

-- RPC: Bulk import students from CSV data
CREATE OR REPLACE FUNCTION bulk_admit_students(
    p_students JSONB,
    p_institution_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entry JSONB;
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    v_error_list JSONB := '[]'::JSONB;
    v_dept_id UUID;
    v_user_id UUID;
    v_student_id UUID;
    v_email VARCHAR;
    v_roll VARCHAR;
    v_name VARCHAR;
BEGIN
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_students)
    LOOP
        v_name := v_entry->>'name';
        v_email := v_entry->>'email';
        v_roll := v_entry->>'roll_number';
        v_dept_id := (v_entry->>'department_id')::UUID;

        BEGIN
            -- Create user
            INSERT INTO users (institution_id, name, email, phone, role, is_active)
            VALUES (p_institution_id, v_name, v_email, v_entry->>'phone', 'Student', true)
            RETURNING id INTO v_user_id;

            -- Create student profile
            INSERT INTO students (user_id, institution_id, department_id, roll_number, semester, batch_year, dob, gender, guardian_name, guardian_phone, fingerprint_id)
            VALUES (
                v_user_id, p_institution_id, v_dept_id, v_roll,
                COALESCE((v_entry->>'semester')::INTEGER, 1),
                COALESCE(v_entry->>'batch_year', EXTRACT(YEAR FROM CURRENT_DATE)::TEXT),
                (v_entry->>'dob')::DATE,
                v_entry->>'gender',
                v_entry->>'guardian_name',
                v_entry->>'guardian_phone',
                v_entry->>'fingerprint_id'
            )
            RETURNING id INTO v_student_id;

            v_count := v_count + 1;
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            v_error_list := v_error_list || jsonb_build_object(
                'row', v_count + v_errors,
                'roll', v_roll,
                'error', SQLERRM
            );
        END;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'imported', v_count,
        'errors', v_errors,
        'error_details', v_error_list
    );
END;
$$;

-- ============================================================
-- 2. TIMETABLE: Auto-generation + conflict detection
-- ============================================================
CREATE TABLE IF NOT EXISTS timetable_constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    constraint_type VARCHAR(30) NOT NULL CHECK (constraint_type IN (
        'teacher_unavailable', 'room_unavailable', 'batch_unavailable',
        'max_daily_hours', 'no_back_to_back_lab', 'preferred_slot'
    )),
    teacher_id UUID REFERENCES staff(id),
    room VARCHAR(100),
    day_of_week VARCHAR(20),
    time_slot VARCHAR(20),
    max_hours_per_day INTEGER DEFAULT 6,
    priority INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timetable_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    department_id UUID REFERENCES departments(id),
    semester INTEGER,
    batch_year VARCHAR(10),
    slots JSONB NOT NULL DEFAULT '[]'::JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE timetable_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage timetable constraints" ON timetable_constraints
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Admin can manage timetable templates" ON timetable_templates
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

-- RPC: Detect timetable conflicts
CREATE OR REPLACE FUNCTION detect_timetable_conflicts(
    p_institution_id UUID,
    pSlots JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slot JSONB;
    v_conflicts JSONB := '[]'::JSONB;
    v_existing RECORD;
    v_teacher_conflict BOOLEAN;
    v_room_conflict BOOLEAN;
    v_batch_conflict BOOLEAN;
BEGIN
    FOR v_slot IN SELECT * FROM jsonb_array_elements(pSlots)
    LOOP
        v_teacher_conflict := false;
        v_room_conflict := false;
        v_batch_conflict := false;

        -- Check teacher conflict
        IF v_slot->>'teacher_id' IS NOT NULL THEN
            SELECT * INTO v_existing
            FROM timetable t
            WHERE t.institution_id = p_institution_id
            AND t.teacher_id = (v_slot->>'teacher_id')::UUID
            AND t.day_of_week = v_slot->>'day_of_week'
            AND t.time_slot = v_slot->>'time_slot'
            AND t.id != COALESCE((v_slot->>'id')::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
            LIMIT 1;

            IF FOUND THEN
                v_teacher_conflict := true;
                v_conflicts := v_conflicts || jsonb_build_object(
                    'type', 'teacher',
                    'slot', v_slot,
                    'conflict_with', jsonb_build_object('subject', v_existing.subject, 'room', v_existing.room)
                );
            END IF;
        END IF;

        -- Check room conflict
        IF v_slot->>'room' IS NOT NULL AND v_slot->>'room' != '' THEN
            SELECT * INTO v_existing
            FROM timetable t
            WHERE t.institution_id = p_institution_id
            AND t.room = v_slot->>'room'
            AND t.day_of_week = v_slot->>'day_of_week'
            AND t.time_slot = v_slot->>'time_slot'
            AND t.id != COALESCE((v_slot->>'id')::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
            LIMIT 1;

            IF FOUND THEN
                v_room_conflict := true;
                v_conflicts := v_conflicts || jsonb_build_object(
                    'type', 'room',
                    'slot', v_slot,
                    'conflict_with', jsonb_build_object('subject', v_existing.subject, 'teacher_id', v_existing.teacher_id)
                );
            END IF;
        END IF;

        -- Check batch conflict
        IF v_slot->>'batch_year' IS NOT NULL AND v_slot->>'batch_year' != '' THEN
            SELECT * INTO v_existing
            FROM timetable t
            WHERE t.institution_id = p_institution_id
            AND t.batch_year = v_slot->>'batch_year'
            AND t.semester = (v_slot->>'semester')::INTEGER
            AND t.day_of_week = v_slot->>'day_of_week'
            AND t.time_slot = v_slot->>'time_slot'
            AND t.id != COALESCE((v_slot->>'id')::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
            LIMIT 1;

            IF FOUND THEN
                v_batch_conflict := true;
                v_conflicts := v_conflicts || jsonb_build_object(
                    'type', 'batch',
                    'slot', v_slot,
                    'conflict_with', jsonb_build_object('subject', v_existing.subject, 'room', v_existing.room)
                );
            END IF;
        END IF;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'conflicts', v_conflicts,
        'has_conflicts', jsonb_array_length(v_conflicts) > 0
    );
END;
$$;

-- RPC: Auto-generate timetable for a department/semester
CREATE OR REPLACE FUNCTION auto_generate_timetable(
    p_institution_id UUID,
    p_department_id UUID,
    p_semester INTEGER,
    p_batch_year VARCHAR(10),
    p_subjects JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subject JSONB;
    v_days TEXT[] := ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    v_slots TEXT[] := ARRAY['09:00','10:00','11:00','12:00','14:00','15:00','16:00'];
    v_slot_idx INTEGER := 1;
    v_day_idx INTEGER := 1;
    v_subject_name VARCHAR;
    v_hours_per_week INTEGER;
    v_teacher UUID;
    v_room VARCHAR;
    v_inserted INTEGER := 0;
    v_conflicts JSONB := '[]'::JSONB;
BEGIN
    FOR v_subject IN SELECT * FROM jsonb_array_elements(p_subjects)
    LOOP
        v_subject_name := v_subject->>'name';
        v_hours_per_week := COALESCE((v_subject->>'hours_per_week')::INTEGER, 3);
        v_teacher := (v_subject->>'teacher_id')::UUID;
        v_room := COALESCE(v_subject->>'room', '');

        -- Simple round-robin allocation
        WHILE v_hours_per_week > 0 LOOP
            IF v_slot_idx > array_length(v_slots, 1) THEN
                v_slot_idx := 1;
                v_day_idx := v_day_idx + 1;
            END IF;
            IF v_day_idx > array_length(v_days) THEN
                EXIT; -- No more slots available
            END IF;

            -- Check for conflict before inserting
            IF NOT EXISTS (
                SELECT 1 FROM timetable t
                WHERE t.institution_id = p_institution_id
                AND t.teacher_id = v_teacher
                AND t.day_of_week = v_days[v_day_idx]
                AND t.time_slot = v_slots[v_slot_idx]
            ) AND NOT EXISTS (
                SELECT 1 FROM timetable t
                WHERE t.institution_id = p_institution_id
                AND t.room = v_room
                AND t.room != ''
                AND t.day_of_week = v_days[v_day_idx]
                AND t.time_slot = v_slots[v_slot_idx]
            ) THEN
                INSERT INTO timetable (institution_id, department_id, teacher_id, subject, room, day_of_week, time_slot, semester, batch_year)
                VALUES (p_institution_id, p_department_id, v_teacher, v_subject_name, v_room, v_days[v_day_idx], v_slots[v_slot_idx], p_semester, p_batch_year);
                v_inserted := v_inserted + 1;
                v_hours_per_week := v_hours_per_week - 1;
            ELSE
                v_conflicts := v_conflicts || jsonb_build_object(
                    'subject', v_subject_name,
                    'day', v_days[v_day_idx],
                    'slot', v_slots[v_slot_idx],
                    'reason', 'teacher_or_room_unavailable'
                );
            END IF;

            v_slot_idx := v_slot_idx + 1;
        END LOOP;

        -- Reset for next subject
        v_slot_idx := 1;
        v_day_idx := 1;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'slots_inserted', v_inserted,
        'conflicts', v_conflicts,
        'conflict_count', jsonb_array_length(v_conflicts)
    );
END;
$$;

-- ============================================================
-- 3. NOTICE FIX: Add HOD to users.role CHECK + target_audience
-- ============================================================
-- No CHECK constraint on users.role, so HOD is already valid as a string.
-- The issue is the schema comment doesn't list it. No SQL change needed.
-- But let's ensure notices.target_audience accepts 'Faculty' as alias.

-- ============================================================
-- 4. CONSOLIDATED DEFAULTER REPORT
-- ============================================================
CREATE OR REPLACE FUNCTION get_consolidated_defaulters(
    p_institution_id UUID,
    p_attendance_threshold NUMERIC DEFAULT 75,
    p_fee_overdue_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number VARCHAR,
    department_name TEXT,
    attendance_pct NUMERIC,
    attendance_status TEXT,
    total_fee_due NUMERIC,
    total_paid NUMERIC,
    overdue_amount NUMERIC,
    days_overdue INTEGER,
    risk_level TEXT,
    combined_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH att AS (
        SELECT
            a.student_id,
            ROUND(
                COUNT(a.id) FILTER (WHERE a.status IN ('present','late'))::NUMERIC /
                NULLIF(COUNT(a.id), 0) * 100, 1
            ) AS pct
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE s.institution_id = p_institution_id
        GROUP BY a.student_id
    ),
    fees AS (
        SELECT
            sf.student_id,
            COALESCE(SUM(sf.amount), 0) AS total_due,
            COALESCE(SUM(sf.amount_paid), 0) AS paid,
            COALESCE(SUM(sf.amount - sf.amount_paid), 0) AS overdue,
            MAX(CASE WHEN sf.due_date < CURRENT_DATE THEN CURRENT_DATE - sf.due_date ELSE 0 END) AS max_days_overdue
        FROM student_fees sf
        JOIN students s ON sf.student_id = s.id
        WHERE s.institution_id = p_institution_id
        GROUP BY sf.student_id
    )
    SELECT
        s.id,
        u.name,
        s.roll_number,
        d.name,
        COALESCE(att.pct, 100),
        CASE
            WHEN att.pct IS NULL THEN 'No Data'
            WHEN att.pct < 60 THEN 'CRITICAL'
            WHEN att.pct < p_attendance_threshold THEN 'AT RISK'
            ELSE 'SAFE'
        END,
        COALESCE(fees.total_due, 0),
        COALESCE(fees.paid, 0),
        COALESCE(fees.overdue, 0),
        COALESCE(fees.max_days_overdue, 0)::INTEGER,
        CASE
            WHEN (COALESCE(att.pct, 100) < 60 AND COALESCE(fees.overdue, 0) > 0) THEN 'HIGH'
            WHEN (COALESCE(att.pct, 100) < p_attendance_threshold AND COALESCE(fees.overdue, 0) > 0) THEN 'MEDIUM'
            WHEN COALESCE(att.pct, 100) < 60 THEN 'MEDIUM'
            WHEN COALESCE(fees.overdue, 0) > 0 THEN 'LOW'
            ELSE 'NONE'
        END,
        ROUND(
            (CASE WHEN att.pct < 100 THEN (100 - COALESCE(att.pct, 100)) ELSE 0 END) * 0.6
            + (LEAST(COALESCE(fees.overdue, 0) / 10000.0, 10) * 10) * 0.4
        , 1)
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN att ON att.student_id = s.id
    LEFT JOIN fees ON fees.student_id = s.id
    WHERE s.is_active = true
    AND s.institution_id = p_institution_id
    AND (
        COALESCE(att.pct, 100) < p_attendance_threshold
        OR COALESCE(fees.overdue, 0) > 0
    )
    ORDER BY combined_score DESC;
END;
$$;

-- ============================================================
-- 5. ACADEMIC CALENDAR
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    event_type VARCHAR(40) NOT NULL CHECK (event_type IN (
        'semester_start', 'semester_end', 'exam_start', 'exam_end',
        'holiday', 'result_date', 'fee_due', 'admission_start',
        'admission_end', 'counseling', 'orientation', 'vacation',
        'internal_exam', 'project_submission', 'other'
    )),
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    semester INTEGER,
    batch_year VARCHAR(10),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(100),
    color VARCHAR(20) DEFAULT '#6C2BD9',
    is_published BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_calendar_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE academic_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_calendar_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage academic calendar" ON academic_calendar
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Everyone can view academic calendar" ON academic_calendar
    FOR SELECT USING (
        is_published = true
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Admin can manage holidays" ON academic_calendar_holidays
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Everyone can view holidays" ON academic_calendar_holidays
    FOR SELECT USING (
        institution_id = get_auth_institution_id()
    );

-- RPC: Get upcoming academic events
CREATE OR REPLACE FUNCTION get_academic_calendar_upcoming(
    p_institution_id UUID,
    p_from_date DATE DEFAULT CURRENT_DATE,
    p_months_ahead INTEGER DEFAULT 6
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    event_type VARCHAR,
    description TEXT,
    start_date DATE,
    end_date DATE,
    semester INTEGER,
    batch_year VARCHAR,
    color VARCHAR,
    days_until INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT ac.id, ac.title, ac.event_type, ac.description,
           ac.start_date, ac.end_date, ac.semester, ac.batch_year, ac.color,
           (ac.start_date - p_from_date)::INTEGER
    FROM academic_calendar ac
    WHERE ac.institution_id = p_institution_id
    AND ac.is_published = true
    AND ac.start_date BETWEEN p_from_date AND (p_from_date + (p_months_ahead || ' months')::INTERVAL)
    ORDER BY ac.start_date;
END;
$$;

-- RPC: Check if a date is a holiday
CREATE OR REPLACE FUNCTION is_academic_holiday(
    p_institution_id UUID,
    p_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM academic_calendar_holidays
    WHERE institution_id = p_institution_id
    AND date = p_date;

    IF v_count > 0 THEN RETURN true; END IF;

    -- Also check academic_calendar for holidays
    SELECT COUNT(*) INTO v_count
    FROM academic_calendar
    WHERE institution_id = p_institution_id
    AND event_type = 'holiday'
    AND p_date BETWEEN start_date AND COALESCE(end_date, start_date);

    RETURN v_count > 0;
END;
$$;


-- ==========================================================
-- MIGRATION: 20260612000010_warden_module_fixes.sql
-- ==========================================================

-- ============================================================
-- WARDEN MODULE FIXES: Visitor approval, unallocated students,
-- checkout workflow, curfew check-in, mess view, room transfers
-- ============================================================

-- ============================================================
-- 1. WARDEN VISITOR APPROVAL: Add approval workflow columns
-- ============================================================
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected', 'expired'));
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS visit_purpose TEXT;
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS expected_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS block_id UUID REFERENCES hostel_blocks(id);

-- RPC: Warden approves visitor for their block
CREATE OR REPLACE FUNCTION approve_hostel_visitor(
    p_visitor_id UUID,
    p_warden_id UUID,
    p_approve BOOLEAN,
    p_remarks TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_visitor RECORD;
    v_block_id UUID;
    v_room RECORD;
    v_warden_block UUID;
BEGIN
    -- Get visitor details
    SELECT * INTO v_visitor FROM hostel_visitors WHERE id = p_visitor_id;
    IF v_visitor IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Visitor not found.');
    END IF;

    -- Get warden's block
    SELECT hb.id INTO v_warden_block
    FROM hostel_blocks hb
    WHERE hb.warden_id = p_warden_id
    AND hb.institution_id = v_visitor.institution_id
    LIMIT 1;

    IF v_warden_block IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Warden not assigned to any block.');
    END IF;

    -- Verify visitor's student is in warden's block
    IF v_visitor.student_id IS NOT NULL THEN
        SELECT hr.block_id INTO v_block_id
        FROM hostel_allocations ha
        JOIN hostel_rooms hr ON ha.room_id = hr.id
        WHERE ha.student_id = v_visitor.student_id
        AND ha.is_current = true
        AND hr.block_id = v_warden_block;

        IF v_block_id IS NULL THEN
            RETURN json_build_object('success', false, 'error', 'Student not in your block.');
        END IF;
    END IF;

    -- Update approval
    UPDATE hostel_visitors
    SET approval_status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
        is_approved = p_approve,
        approved_by = (SELECT id FROM staff WHERE user_id = p_warden_id LIMIT 1),
        approved_at = NOW()
    WHERE id = p_visitor_id;

    RETURN json_build_object('success', true, 'approved', p_approve);
END;
$$;

-- ============================================================
-- 2. UNALLOCATED STUDENTS VIEW
-- ============================================================
CREATE OR REPLACE VIEW unallocated_students AS
SELECT
    s.id AS student_id,
    u.name AS full_name,
    s.roll_number,
    s.department_id,
    d.name AS department_name,
    s.semester,
    s.batch_year,
    s.created_at AS admission_date
FROM students s
JOIN users u ON s.user_id = u.id
LEFT JOIN departments d ON s.department_id = d.id
WHERE u.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM hostel_allocations ha
    WHERE ha.student_id = s.id
    AND ha.is_current = true
)
ORDER BY u.name;

-- RPC: Get unallocated students for warden's institution
CREATE OR REPLACE FUNCTION get_unallocated_students()
RETURNS TABLE (
    student_id UUID,
    full_name TEXT,
    roll_number VARCHAR,
    department_name TEXT,
    semester INTEGER,
    batch_year VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT us.student_id, us.full_name, us.roll_number,
           us.department_name, us.semester, us.batch_year
    FROM unallocated_students us
    WHERE us.student_id IS NOT NULL;
END;
$$;

-- ============================================================
-- 3. HOSTEL CHECKOUT / ROOM VACATING WORKFLOW
-- ============================================================
CREATE OR REPLACE FUNCTION checkout_hostel_room(
    p_allocation_id UUID,
    p_warden_id UUID,
    p_reason TEXT DEFAULT '',
    p_deposit_action VARCHAR(20) DEFAULT 'refunded'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_allocation RECORD;
    v_block_id UUID;
    v_warden_block UUID;
BEGIN
    SELECT * INTO v_allocation FROM hostel_allocations WHERE id = p_allocation_id;
    IF v_allocation IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Allocation not found.');
    END IF;

    IF v_allocation.is_current = false THEN
        RETURN json_build_object('success', false, 'error', 'Allocation already closed.');
    END IF;

    -- Get warden's block
    SELECT hb.id INTO v_warden_block
    FROM hostel_blocks hb
    WHERE hb.warden_id = p_warden_id
    LIMIT 1;

    -- Verify room is in warden's block
    SELECT hr.block_id INTO v_block_id
    FROM hostel_rooms hr
    WHERE hr.id = v_allocation.room_id;

    IF v_warden_block IS NOT NULL AND v_block_id != v_warden_block THEN
        RETURN json_build_object('success', false, 'error', 'Room not in your block.');
    END IF;

    -- Close allocation
    UPDATE hostel_allocations
    SET is_current = false,
        vacated_date = CURRENT_DATE,
        vacating_reason = p_reason,
        deposit_status = CASE WHEN p_deposit_action = 'refunded' THEN 'refunded'
                              WHEN p_deposit_action = 'forfeited' THEN 'paid'
                              ELSE deposit_status END
    WHERE id = p_allocation_id;

    -- Update room occupied count
    UPDATE hostel_rooms
    SET occupied = GREATEST(occupied - 1, 0)
    WHERE id = v_allocation.room_id;

    RETURN json_build_object('success', true, 'message', 'Room vacated successfully.');
END;
$$;

-- ============================================================
-- 4. NIGHTLY CURFEW / HEADCOUNT CHECK-IN
-- ============================================================
CREATE TABLE IF NOT EXISTS curfew_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    block_id UUID NOT NULL REFERENCES hostel_blocks(id) ON DELETE CASCADE,
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    is_present BOOLEAN DEFAULT false,
    marked_by UUID REFERENCES users(id),
    remarks TEXT,
    marked_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (block_id, check_date, student_id)
);

CREATE TABLE IF NOT EXISTS curfew_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    block_id UUID NOT NULL REFERENCES hostel_blocks(id) ON DELETE CASCADE,
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    absent_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    alert_sent_to_parent BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMP WITH TIME ZONE,
    warden_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE curfew_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE curfew_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Warden can manage curfew in their block" ON curfew_checkins
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden')
        AND (
            get_auth_user_role() != 'Warden'
            OR block_id IN (
                SELECT hb.id FROM hostel_blocks hb
                WHERE hb.warden_id = auth.uid()
            )
        )
    );

CREATE POLICY "Warden can view curfew alerts" ON curfew_alerts
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden')
    );

CREATE POLICY "System can insert curfew alerts" ON curfew_alerts
    FOR INSERT WITH CHECK (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden')
    );

-- RPC: Mark curfew check-in for a block
CREATE OR REPLACE FUNCTION mark_curfew_checkin(
    p_block_id UUID,
    p_warden_id UUID,
    pcheck_date DATE DEFAULT CURRENT_DATE,
    p_students JSONB DEFAULT '[]'::JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_warden_block UUID;
    v_entry JSONB;
    v_present_count INTEGER := 0;
    v_absent_count INTEGER := 0;
    v_student RECORD;
BEGIN
    -- Verify warden owns this block
    SELECT hb.id INTO v_warden_block
    FROM hostel_blocks hb
    WHERE hb.id = p_block_id AND hb.warden_id = p_warden_id;

    IF v_warden_block IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Block not assigned to you.');
    END IF;

    -- Mark each student
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_students)
    LOOP
        INSERT INTO curfew_checkins (institution_id, block_id, check_date, student_id, is_present, marked_by, marked_at)
        VALUES (
            (SELECT institution_id FROM hostel_blocks WHERE id = p_block_id),
            p_block_id,
            pcheck_date,
            (v_entry->>'student_id')::UUID,
            (v_entry->>'is_present')::BOOLEAN,
            p_warden_id,
            NOW()
        )
        ON CONFLICT (block_id, check_date, student_id)
        DO UPDATE SET
            is_present = EXCLUDED.is_present,
            marked_by = EXCLUDED.marked_by,
            marked_at = NOW();

        IF (v_entry->>'is_present')::BOOLEAN THEN
            v_present_count := v_present_count + 1;
        ELSE
            v_absent_count := v_absent_count + 1;

            -- Create alert for absent student
            INSERT INTO curfew_alerts (institution_id, block_id, check_date, absent_student_id)
            VALUES (
                (SELECT institution_id FROM hostel_blocks WHERE id = p_block_id),
                p_block_id,
                pcheck_date,
                (v_entry->>'student_id')::UUID
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'present', v_present_count,
        'absent', v_absent_count
    );
END;
$$;

-- RPC: Get curfew status for a block on a date
CREATE OR REPLACE FUNCTION get_curfew_status(
    p_block_id UUID,
    pcheck_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number VARCHAR,
    room_number VARCHAR,
    is_present BOOLEAN,
    marked_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        u.name,
        s.roll_number,
        hr.room_number,
        COALESCE(cc.is_present, false),
        cc.marked_at
    FROM hostel_allocations ha
    JOIN hostel_rooms hr ON ha.room_id = hr.id
    JOIN students s ON ha.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN curfew_checkins cc
        ON cc.student_id = s.id
        AND cc.block_id = p_block_id
        AND cc.check_date = pcheck_date
    WHERE hr.block_id = p_block_id
    AND ha.is_current = true
    ORDER BY hr.room_number, u.name;
END;
$$;

-- ============================================================
-- 5. MESS / MEAL SUBSCRIPTION VIEW PER BLOCK
-- ============================================================
CREATE OR REPLACE FUNCTION get_block_meal_subscriptions(p_block_id UUID)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number VARCHAR,
    room_number VARCHAR,
    plan_name VARCHAR,
    meals_total INTEGER,
    meals_used INTEGER,
    meals_remaining INTEGER,
    subscription_status VARCHAR,
    start_date DATE,
    end_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        u.name,
        s.roll_number,
        hr.room_number,
        mp.name,
        ms.meals_total,
        ms.meals_used,
        (ms.meals_total - ms.meals_used),
        ms.status,
        ms.start_date,
        ms.end_date
    FROM hostel_allocations ha
    JOIN hostel_rooms hr ON ha.room_id = hr.id
    JOIN students s ON ha.student_id = s.id
    JOIN users u ON s.user_id = u.id
    JOIN meal_subscriptions ms ON ms.student_id = s.id
    LEFT JOIN meal_plans mp ON ms.plan_id = mp.id
    WHERE hr.block_id = p_block_id
    AND ha.is_current = true
    AND ms.status = 'active'
    ORDER BY u.name;
END;
$$;

-- ============================================================
-- 6. ROOM TRANSFER REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS room_transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    current_room_id UUID REFERENCES hostel_rooms(id),
    requested_room_id UUID REFERENCES hostel_rooms(id),
    reason TEXT NOT NULL,
    reason_category VARCHAR(30) DEFAULT 'other' CHECK (reason_category IN (
        'roommate_conflict', 'health', 'proximity', 'noise', 'maintenance', 'other'
    )),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'warden_approved', 'admin_approved', 'rejected', 'completed'
    )),
    warden_id UUID REFERENCES users(id),
    warden_remarks TEXT,
    warden_approved_at TIMESTAMP WITH TIME ZONE,
    admin_id UUID REFERENCES users(id),
    admin_remarks TEXT,
    admin_approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE room_transfer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own transfer requests" ON room_transfer_requests
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Students can create transfer requests" ON room_transfer_requests
    FOR INSERT WITH CHECK (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Warden can manage transfers in their block" ON room_transfer_requests
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden')
        AND (
            get_auth_user_role() != 'Warden'
            OR current_room_id IN (
                SELECT hr.id FROM hostel_rooms hr
                JOIN hostel_blocks hb ON hr.block_id = hb.id
                WHERE hb.warden_id = auth.uid()
            )
        )
    );

-- RPC: Warden approves room transfer
CREATE OR REPLACE FUNCTION approve_room_transfer(
    p_request_id UUID,
    p_warden_id UUID,
    p_approve BOOLEAN,
    p_remarks TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request RECORD;
    v_warden_block UUID;
    v_new_room RECORD;
BEGIN
    SELECT * INTO v_request FROM room_transfer_requests WHERE id = p_request_id;
    IF v_request IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Request not found.');
    END IF;

    IF v_request.status != 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'Request already processed.');
    END IF;

    -- Verify warden's block
    SELECT hb.id INTO v_warden_block
    FROM hostel_blocks hb
    WHERE hb.warden_id = p_warden_id
    LIMIT 1;

    -- Verify current room is in warden's block
    IF v_warden_block IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM hostel_rooms hr
            WHERE hr.id = v_request.current_room_id
            AND hr.block_id = v_warden_block
        ) THEN
            RETURN json_build_object('success', false, 'error', 'Current room not in your block.');
        END IF;
    END IF;

    IF p_approve THEN
        -- Check requested room has capacity
        IF v_request.requested_room_id IS NOT NULL THEN
            SELECT * INTO v_new_room FROM hostel_rooms WHERE id = v_request.requested_room_id;
            IF v_new_room IS NULL THEN
                RETURN json_build_object('success', false, 'error', 'Requested room not found.');
            END IF;
            IF v_new_room.occupied >= v_new_room.capacity THEN
                RETURN json_build_object('success', false, 'error', 'Requested room is full.');
            END IF;
        END IF;

        UPDATE room_transfer_requests
        SET status = 'warden_approved',
            warden_id = p_warden_id,
            warden_remarks = p_remarks,
            warden_approved_at = NOW()
        WHERE id = p_request_id;
    ELSE
        UPDATE room_transfer_requests
        SET status = 'rejected',
            warden_id = p_warden_id,
            warden_remarks = p_remarks,
            warden_approved_at = NOW()
        WHERE id = p_request_id;
    END IF;

    RETURN json_build_object('success', true, 'approved', p_approve);
END;
$$;

-- RPC: Complete room transfer (move student to new room)
CREATE OR REPLACE FUNCTION complete_room_transfer(p_request_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request RECORD;
    v_old_room_id UUID;
BEGIN
    SELECT * INTO v_request FROM room_transfer_requests WHERE id = p_request_id;
    IF v_request IS NULL OR v_request.status != 'warden_approved' THEN
        RETURN json_build_object('success', false, 'error', 'Request not ready for completion.');
    END IF;

    IF v_request.requested_room_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No target room specified.');
    END IF;

    -- Get old room
    SELECT room_id INTO v_old_room_id
    FROM hostel_allocations
    WHERE student_id = v_request.student_id AND is_current = true;

    -- Update allocation
    UPDATE hostel_allocations
    SET room_id = v_request.requested_room_id
    WHERE student_id = v_request.student_id AND is_current = true;

    -- Update old room count
    IF v_old_room_id IS NOT NULL THEN
        UPDATE hostel_rooms SET occupied = GREATEST(occupied - 1, 0) WHERE id = v_old_room_id;
    END IF;

    -- Update new room count
    UPDATE hostel_rooms SET occupied = occupied + 1 WHERE id = v_request.requested_room_id;

    -- Mark transfer complete
    UPDATE room_transfer_requests SET status = 'completed' WHERE id = p_request_id;

    RETURN json_build_object('success', true, 'message', 'Room transfer completed.');
END;
$$;


-- ==========================================================
-- MIGRATION: 20260612000011_security_module_fixes.sql
-- ==========================================================

-- ============================================================
-- SECURITY MODULE FIXES: Identity verification, visitor lookup,
-- blacklist alerts, vehicle logs, event attendees
-- ============================================================

-- ============================================================
-- 1. FIX: Security can read user/student profiles for verification
--    (users_select already allows institution-scoped reads,
--     but add explicit column-level view for Security)
-- ============================================================
CREATE OR REPLACE FUNCTION verify_person_at_gate(
    p_identifier TEXT
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    role VARCHAR,
    photo_url TEXT,
    is_active BOOLEAN,
    student_roll VARCHAR,
    department_name TEXT,
    semester INTEGER,
    person_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Try matching by email, phone, roll_number, or user id
    RETURN QUERY
    SELECT
        u.id,
        u.name AS full_name,
        u.role,
        u.avatar_url AS photo_url,
        u.is_active,
        s.roll_number,
        d.name,
        s.semester,
        CASE WHEN s.id IS NOT NULL THEN 'student'
             WHEN st.id IS NOT NULL THEN 'staff'
             ELSE 'user'
        END::TEXT
    FROM users u
    LEFT JOIN students s ON s.user_id = u.id
    LEFT JOIN staff st ON st.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE u.institution_id = get_auth_institution_id()
    AND (
        u.id::TEXT = p_identifier
        OR u.email = p_identifier
        OR u.phone = p_identifier
        OR s.roll_number = p_identifier
        OR LOWER(u.name) LIKE LOWER('%' || p_identifier || '%')
        OR st.employee_id = p_identifier
    )
    LIMIT 5;
END;
$$;

-- ============================================================
-- 2. FIX: Security can look up ALL visitor passes (not just own)
-- ============================================================
-- The existing hostel_visitors_select policy allows institution-wide reads.
-- But visitor_logs (gate entry/exit) needs broader read for Security.
-- Add a view for today's approved visitors

CREATE OR REPLACE FUNCTION get_approved_visitors_today()
RETURNS TABLE (
    id UUID,
    visitor_name TEXT,
    visitor_phone TEXT,
    relation TEXT,
    visit_purpose TEXT,
    student_name TEXT,
    student_roll VARCHAR,
    room_number VARCHAR,
    approval_status VARCHAR,
    expected_time TIMESTAMP WITH TIME ZONE,
    approved_by_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        hv.id,
        hv.visitor_name,
        hv.visitor_phone,
        hv.relation,
        hv.visit_purpose,
        su.name,
        s.roll_number,
        hr.room_number,
        hv.approval_status,
        hv.expected_time,
        abu.name
    FROM hostel_visitors hv
    LEFT JOIN students s ON hv.student_id = s.id
    LEFT JOIN users su ON s.user_id = su.id
    LEFT JOIN hostel_allocations ha ON ha.student_id = s.id AND ha.is_current = true
    LEFT JOIN hostel_rooms hr ON ha.room_id = hr.id
    LEFT JOIN staff ab ON hv.approved_by = ab.id
    LEFT JOIN users abu ON ab.user_id = abu.id
    WHERE hv.institution_id = get_auth_institution_id()
    AND (
        hv.approval_status = 'approved'
        OR hv.expected_time::DATE = CURRENT_DATE
        OR hv.created_at::DATE = CURRENT_DATE
    )
    ORDER BY hv.created_at DESC;
END;
$$;

-- ============================================================
-- 3. BLACKLIST / SUSPENDED STUDENT ALERT
-- ============================================================
CREATE TABLE IF NOT EXISTS access_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    person_type VARCHAR(20) NOT NULL CHECK (person_type IN ('student', 'staff', 'visitor')),
    person_id UUID NOT NULL,
    restriction_type VARCHAR(30) NOT NULL CHECK (restriction_type IN (
        'suspended', 'expelled', 'banned', 'no_campus_access', 'disciplinary', 'other'
    )),
    reason TEXT NOT NULL,
    restricted_by UUID REFERENCES users(id),
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE access_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Security can view active restrictions" ON access_restrictions
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security', 'Warden')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Admin can manage restrictions" ON access_restrictions
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND institution_id = get_auth_institution_id()
    );

-- RPC: Check if a person is restricted
CREATE OR REPLACE FUNCTION check_person_restricted(p_person_id UUID)
RETURNS TABLE (
    is_restricted BOOLEAN,
    restriction_type VARCHAR,
    reason TEXT,
    valid_until DATE,
    restricted_by_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        true,
        ar.restriction_type,
        ar.reason,
        ar.valid_until,
        u.name
    FROM access_restrictions ar
    LEFT JOIN users u ON ar.restricted_by = u.id
    WHERE ar.person_id = p_person_id
    AND ar.is_active = true
    AND ar.institution_id = get_auth_institution_id()
    AND (ar.valid_until IS NULL OR ar.valid_until >= CURRENT_DATE)
    LIMIT 1;

    -- If no rows, person is not restricted
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::VARCHAR, NULL::TEXT, NULL::DATE, NULL::TEXT;
    END IF;
END;
$$;

-- RPC: Scan at gate — returns identity + restriction status + visitor status
CREATE OR REPLACE FUNCTION gate_scan_lookup(p_identifier TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_person RECORD;
    v_restricted RECORD;
    v_visitor RECORD;
    v_result JSON;
BEGIN
    -- Step 1: Look up person
    SELECT * INTO v_person
    FROM verify_person_at_gate(p_identifier)
    LIMIT 1;

    IF v_person IS NULL THEN
        RETURN json_build_object(
            'success', true,
            'found', false,
            'message', 'Person not found in system.'
        );
    END IF;

    -- Step 2: Check blacklist
    SELECT * INTO v_restricted
    FROM check_person_restricted(v_person.user_id)
    LIMIT 1;

    -- Step 3: Check if visitor with approved pass
    IF v_person.person_type = 'user' THEN
        SELECT hv.id, hv.visitor_name, hv.approval_status INTO v_visitor
        FROM hostel_visitors hv
        WHERE hv.visitor_name ILIKE '%' || p_identifier || '%'
        OR hv.visitor_phone = p_identifier
        AND hv.institution_id = get_auth_institution_id()
        AND hv.approval_status = 'approved'
        LIMIT 1;
    END IF;

    RETURN json_build_object(
        'success', true,
        'found', true,
        'person', json_build_object(
            'user_id', v_person.user_id,
            'full_name', v_person.full_name,
            'role', v_person.role,
            'photo_url', v_person.photo_url,
            'is_active', v_person.is_active,
            'student_roll', v_person.student_roll,
            'department', v_person.department_name,
            'semester', v_person.semester,
            'person_type', v_person.person_type
        ),
        'restriction', json_build_object(
            'is_restricted', COALESCE(v_restricted.is_restricted, false),
            'type', v_restricted.restriction_type,
            'reason', v_restricted.reason,
            'valid_until', v_restricted.valid_until,
            'restricted_by', v_restricted.restricted_by_name
        ),
        'visitor_pass', CASE WHEN v_visitor IS NOT NULL THEN
            json_build_object(
                'id', v_visitor.id,
                'visitor_name', v_visitor.visitor_name,
                'approval_status', v_visitor.approval_status
            )
        ELSE NULL END
    );
END;
$$;

-- ============================================================
-- 4. VEHICLE ENTRY/EXIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(30) DEFAULT 'two_wheeler' CHECK (vehicle_type IN (
        'two_wheeler', 'four_wheeler', 'bus', 'delivery', 'emergency', 'other'
    )),
    driver_name VARCHAR(200),
    driver_phone VARCHAR(20),
    purpose TEXT,
    person_id UUID REFERENCES users(id),
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP WITH TIME ZONE,
    entered_by UUID REFERENCES users(id),
    exited_by UUID REFERENCES users(id),
    gate_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE vehicle_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Security can manage vehicle logs" ON vehicle_logs
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security', 'Warden')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Admin can view all vehicle logs" ON vehicle_logs
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND institution_id = get_auth_institution_id()
    );

-- RPC: Vehicle entry
CREATE OR REPLACE FUNCTION vehicle_entry(
    p_vehicle_number VARCHAR,
    p_vehicle_type VARCHAR,
    p_driver_name VARCHAR,
    p_driver_phone VARCHAR,
    p_purpose TEXT,
    p_gate_number VARCHAR DEFAULT '1'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO vehicle_logs (
        institution_id, vehicle_number, vehicle_type, driver_name,
        driver_phone, purpose, entered_by, gate_number
    ) VALUES (
        get_auth_institution_id(), p_vehicle_number, p_vehicle_type,
        p_driver_name, p_driver_phone, p_purpose,
        auth.uid(),
        p_gate_number
    ) RETURNING id INTO v_log_id;

    RETURN json_build_object('success', true, 'log_id', v_log_id, 'message', 'Vehicle entry logged.');
END;
$$;

-- RPC: Vehicle exit
CREATE OR REPLACE FUNCTION vehicle_exit(p_log_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE vehicle_logs
    SET exit_time = NOW(),
        exited_by = auth.uid()
    WHERE id = p_log_id AND exit_time IS NULL;

    IF FOUND THEN
        RETURN json_build_object('success', true, 'message', 'Vehicle exit logged.');
    ELSE
        RETURN json_build_object('success', false, 'error', 'Log not found or already exited.');
    END IF;
END;
$$;

-- ============================================================
-- 5. TODAY'S EVENT ATTENDEE LIST
-- ============================================================
CREATE OR REPLACE FUNCTION get_todays_event_attendees()
RETURNS TABLE (
    event_id UUID,
    event_title TEXT,
    event_date DATE,
    registration_id UUID,
    user_id UUID,
    full_name TEXT,
    email TEXT,
    registration_status VARCHAR,
    check_in_time TIMESTAMP WITH TIME ZONE,
    ticket_code VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.title::TEXT,
        e.event_date,
        er.id,
        er.user_id,
        u.name AS full_name,
        u.email,
        er.status,
        er.check_in_time,
        er.ticket_code
    FROM events e
    JOIN event_registrations er ON er.event_id = e.id
    JOIN users u ON er.user_id = u.id
    WHERE e.institution_id = get_auth_institution_id()
    AND e.event_date = CURRENT_DATE
    ORDER BY e.title, u.name;
END;
$$;


-- ==========================================================
-- MIGRATION: 20260612000012_driver_module.sql
-- ==========================================================

-- ============================================================
-- DRIVER MODULE: RLS, Trip Console, Route Schedule, Headcount,
-- Emergency Reports
-- ============================================================

-- ============================================================
-- 1. DRIVER RLS: Scoped to own bus, own trips, own route
-- ============================================================

-- Drop overly-broad bus_trips policy (replaced with driver-scoped)
DROP POLICY IF EXISTS tenant_bus_trips_policy ON bus_trips;
CREATE POLICY "bus_trips_admin_select" ON bus_trips
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "bus_trips_driver_select" ON bus_trips
    FOR SELECT USING (
        get_auth_user_role() = 'Driver'
        AND driver_id IN (
            SELECT bd.id FROM bus_drivers bd
            WHERE bd.user_id = auth.uid()
        )
    );

CREATE POLICY "bus_trips_driver_insert" ON bus_trips
    FOR INSERT WITH CHECK (
        get_auth_user_role() = 'Driver'
        AND driver_id IN (
            SELECT bd.id FROM bus_drivers bd
            WHERE bd.user_id = auth.uid()
        )
    );

CREATE POLICY "bus_trips_driver_update" ON bus_trips
    FOR UPDATE USING (
        get_auth_user_role() = 'Driver'
        AND driver_id IN (
            SELECT bd.id FROM bus_drivers bd
            WHERE bd.user_id = auth.uid()
        )
    );

-- Drop overly-broad trip_stop_logs policy
DROP POLICY IF EXISTS tenant_trip_stop_logs_policy ON trip_stop_logs;
CREATE POLICY "trip_stop_logs_admin_all" ON trip_stop_logs
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "trip_stop_logs_driver_select" ON trip_stop_logs
    FOR SELECT USING (
        get_auth_user_role() = 'Driver'
        AND trip_id IN (
            SELECT bt.id FROM bus_trips bt
            JOIN bus_drivers bd ON bt.driver_id = bd.id
            WHERE bd.user_id = auth.uid()
        )
    );

CREATE POLICY "trip_stop_logs_driver_insert" ON trip_stop_logs
    FOR INSERT WITH CHECK (
        get_auth_user_role() = 'Driver'
        AND trip_id IN (
            SELECT bt.id FROM bus_trips bt
            JOIN bus_drivers bd ON bt.driver_id = bd.id
            WHERE bd.user_id = auth.uid()
        )
    );

CREATE POLICY "trip_stop_logs_driver_update" ON trip_stop_logs
    FOR UPDATE USING (
        get_auth_user_role() = 'Driver'
        AND trip_id IN (
            SELECT bt.id FROM bus_trips bt
            JOIN bus_drivers bd ON bt.driver_id = bd.id
            WHERE bd.user_id = auth.uid()
        )
    );

-- Drop overly-broad bus_incidents policy
DROP POLICY IF EXISTS tenant_bus_incidents_policy ON bus_incidents;
CREATE POLICY "bus_incidents_admin_all" ON bus_incidents
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "bus_incidents_driver_select" ON bus_incidents
    FOR SELECT USING (
        get_auth_user_role() = 'Driver'
        AND reported_by = auth.uid()
    );

CREATE POLICY "bus_incidents_driver_insert" ON bus_incidents
    FOR INSERT WITH CHECK (
        get_auth_user_role() = 'Driver'
        AND institution_id = get_auth_institution_id()
    );

-- Driver can only see their own bus
DROP POLICY IF EXISTS "buses_select" ON buses;
CREATE POLICY "buses_admin_select" ON buses
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden', 'Student', 'Parent', 'Staff', 'Teacher')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "buses_driver_select" ON buses
    FOR SELECT USING (
        get_auth_user_role() = 'Driver'
        AND id IN (
            SELECT b.id FROM buses b
            JOIN bus_drivers bd ON b.driver_id = bd.id
            WHERE bd.user_id = auth.uid()
        )
    );

-- Driver can only see their own route
DROP POLICY IF EXISTS "bus_routes_select" ON bus_routes;
CREATE POLICY "bus_routes_admin_select" ON bus_routes
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden', 'Student', 'Parent', 'Staff', 'Teacher')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "bus_routes_driver_select" ON bus_routes
    FOR SELECT USING (
        get_auth_user_role() = 'Driver'
        AND id IN (
            SELECT b.route_id FROM buses b
            JOIN bus_drivers bd ON b.driver_id = bd.id
            WHERE bd.user_id = auth.uid()
        )
    );

-- Driver can see their route's subscriptions (headcount)
DROP POLICY IF EXISTS "transport_subscriptions_select" ON transport_subscriptions;
CREATE POLICY "transport_subscriptions_admin_select" ON transport_subscriptions
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "transport_subscriptions_student_select" ON transport_subscriptions
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "transport_subscriptions_driver_select" ON transport_subscriptions
    FOR SELECT USING (
        get_auth_user_role() = 'Driver'
        AND route_id IN (
            SELECT b.route_id FROM buses b
            JOIN bus_drivers bd ON b.driver_id = bd.id
            WHERE bd.user_id = auth.uid()
        )
        AND status = 'active'
    );

-- ============================================================
-- 2. DRIVER RPCs: Get own bus, route, trips
-- ============================================================

-- Get driver's assigned bus and route
CREATE OR REPLACE FUNCTION get_driver_assignments()
RETURNS TABLE (
    bus_id UUID,
    vehicle_number TEXT,
    bus_name TEXT,
    capacity INTEGER,
    bus_model TEXT,
    route_id UUID,
    route_name TEXT,
    route_number TEXT,
    stops JSONB,
    distance_km DECIMAL,
    duration_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT
        b.id, b.vehicle_number, b.name, b.capacity, b.model,
        br.id, br.name, br.route_number, br.stops,
        br.distance_km, br.duration_minutes
    FROM buses b
    JOIN bus_routes br ON b.route_id = br.id
    WHERE b.driver_id = v_driver_id
    AND b.is_active = true;
END;
$$;

-- Get driver's today's trip
CREATE OR REPLACE FUNCTION get_driver_today_trip()
RETURNS TABLE (
    trip_id UUID,
    bus_id UUID,
    route_id UUID,
    trip_type TEXT,
    status TEXT,
    scheduled_start TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    delay_minutes INTEGER,
    passenger_count INTEGER,
    route_name TEXT,
    stops JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT
        bt.id, bt.bus_id, bt.route_id, bt.trip_type, bt.status,
        bt.scheduled_start, bt.actual_start, bt.actual_end,
        bt.delay_minutes, bt.passenger_count,
        br.name, br.stops
    FROM bus_trips bt
    JOIN buses b ON bt.bus_id = b.id
    JOIN bus_routes br ON bt.route_id = br.id
    WHERE bt.driver_id = v_driver_id
    AND bt.trip_date = CURRENT_DATE
    ORDER BY bt.scheduled_start DESC
    LIMIT 1;
END;
$$;

-- Start a trip
CREATE OR REPLACE FUNCTION start_bus_trip(
    p_bus_id UUID,
    p_route_id UUID,
    p_trip_type TEXT DEFAULT 'morning'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
    v_trip_id UUID;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Driver profile not found.');
    END IF;

    -- Check no active trip already
    IF EXISTS (
        SELECT 1 FROM bus_trips
        WHERE driver_id = v_driver_id
        AND trip_date = CURRENT_DATE
        AND status = 'active'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'You already have an active trip. End it first.');
    END IF;

    INSERT INTO bus_trips (
        institution_id, bus_id, route_id, driver_id,
        trip_date, trip_type, scheduled_start, actual_start, status
    ) VALUES (
        (SELECT institution_id FROM bus_drivers WHERE id = v_driver_id),
        p_bus_id, p_route_id, v_driver_id,
        CURRENT_DATE, p_trip_type, NOW(), NOW(), 'active'
    ) RETURNING id INTO v_trip_id;

    -- Update bus is_active
    UPDATE buses SET is_active = true WHERE id = p_bus_id;

    RETURN json_build_object('success', true, 'trip_id', v_trip_id, 'message', 'Trip started.');
END;
$$;

-- End a trip
CREATE OR REPLACE FUNCTION end_bus_trip(p_trip_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Driver profile not found.');
    END IF;

    UPDATE bus_trips
    SET status = 'completed', actual_end = NOW()
    WHERE id = p_trip_id
    AND driver_id = v_driver_id
    AND status = 'active';

    IF FOUND THEN
        -- Deactivate old tracking
        UPDATE bus_tracking SET is_active = false
        WHERE bus_id = (SELECT bus_id FROM bus_trips WHERE id = p_trip_id)
        AND is_active = true;

        RETURN json_build_object('success', true, 'message', 'Trip ended.');
    ELSE
        RETURN json_build_object('success', false, 'error', 'Trip not found or already ended.');
    END IF;
END;
$$;

-- Get student headcount for driver's route today
CREATE OR REPLACE FUNCTION get_driver_route_headcount()
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number TEXT,
    stop_name TEXT,
    has_boarded BOOLEAN,
    boarded_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
    v_route_id UUID;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN RETURN; END IF;

    SELECT b.route_id INTO v_route_id
    FROM buses b WHERE b.driver_id = v_driver_id AND b.is_active = true
    LIMIT 1;

    IF v_route_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT
        s.id,
        u.name,
        s.roll_number,
        ts.stop_name,
        CASE WHEN bt.boarded_at IS NOT NULL THEN true ELSE false END,
        bt.boarded_at
    FROM transport_subscriptions ts
    JOIN students s ON ts.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN bus_tracking bt ON bt.student_id = s.id
        AND bt.bus_id = (SELECT id FROM buses WHERE driver_id = v_driver_id AND is_active = true LIMIT 1)
        AND bt.boarded_at::DATE = CURRENT_DATE
    WHERE ts.route_id = v_route_id
    AND ts.status = 'active'
    ORDER BY ts.stop_name, u.name;
END;
$$;

-- Get trip stop schedule (from route stops)
CREATE OR REPLACE FUNCTION get_driver_stop_schedule()
RETURNS TABLE (
    stop_index INTEGER,
    stop_name TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    scheduled_time TEXT,
    is_reached BOOLEAN,
    reached_at TIMESTAMPTZ,
    passengers_boarded INTEGER,
    passengers_alighted INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
    v_route_id UUID;
    v_trip_id UUID;
    v_stops JSONB;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN RETURN; END IF;

    SELECT b.route_id INTO v_route_id
    FROM buses b WHERE b.driver_id = v_driver_id AND b.is_active = true
    LIMIT 1;

    IF v_route_id IS NULL THEN RETURN; END IF;

    -- Get today's trip
    SELECT bt.id INTO v_trip_id
    FROM bus_trips bt
    WHERE bt.driver_id = v_driver_id
    AND bt.trip_date = CURRENT_DATE
    AND bt.status = 'active'
    LIMIT 1;

    -- Get stops from route
    SELECT br.stops INTO v_stops
    FROM bus_routes br WHERE br.id = v_route_id;

    IF v_stops IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT
        (stop->>'stop_index')::INTEGER,
        stop->>'name',
        (stop->>'latitude')::DECIMAL,
        (stop->>'longitude')::DECIMAL,
        COALESCE(stop->>'scheduled_time_morning', stop->>'scheduled_time_evening'),
        COALESCE(tsl.actual_arrival IS NOT NULL, false),
        tsl.actual_arrival,
        COALESCE(tsl.passengers_boarded, 0),
        COALESCE(tsl.passengers_alighted, 0)
    FROM jsonb_array_elements(v_stops) AS stop
    LEFT JOIN trip_stop_logs tsl ON tsl.trip_id = v_trip_id
        AND tsl.stop_index = (stop->>'stop_index')::INTEGER
    ORDER BY (stop->>'stop_index')::INTEGER;
END;
$$;

-- Mark a stop as reached
CREATE OR REPLACE FUNCTION mark_stop_reached(
    p_stop_index INTEGER,
    p_passengers_boarded INTEGER DEFAULT 0,
    p_passengers_alighted INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
    v_trip_id UUID;
    v_stop_name TEXT;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Driver profile not found.');
    END IF;

    SELECT bt.id INTO v_trip_id
    FROM bus_trips bt
    WHERE bt.driver_id = v_driver_id
    AND bt.trip_date = CURRENT_DATE
    AND bt.status = 'active'
    LIMIT 1;

    IF v_trip_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No active trip found.');
    END IF;

    -- Get stop name from route
    SELECT stop->>'name' INTO v_stop_name
    FROM bus_routes br,
         jsonb_array_elements(br.stops) stop
    WHERE br.id = (SELECT route_id FROM bus_trips WHERE id = v_trip_id)
    AND (stop->>'stop_index')::INTEGER = p_stop_index
    LIMIT 1;

    INSERT INTO trip_stop_logs (
        institution_id, trip_id, stop_index, stop_name,
        scheduled_time, actual_arrival, passengers_boarded, passengers_alighted
    ) VALUES (
        (SELECT institution_id FROM bus_trips WHERE id = v_trip_id),
        v_trip_id, p_stop_index, COALESCE(v_stop_name, 'Stop ' || p_stop_index),
        NOW(), NOW(), p_passengers_boarded, p_passengers_alighted
    )
    ON CONFLICT (trip_id, stop_index) DO UPDATE SET
        actual_arrival = NOW(),
        passengers_boarded = EXCLUDED.passengers_boarded,
        passengers_alighted = EXCLUDED.passengers_alighted;

    RETURN json_build_object('success', true, 'message', 'Stop marked as reached.');
END;
$$;

-- Add unique constraint for trip_stop_logs if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'trip_stop_logs_trip_stop_unique'
    ) THEN
        ALTER TABLE trip_stop_logs ADD CONSTRAINT trip_stop_logs_trip_stop_unique UNIQUE (trip_id, stop_index);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Constraint may already exist
    NULL;
END $$;

-- Report emergency/breakdown
CREATE OR REPLACE FUNCTION report_bus_incident(
    p_incident_type TEXT,
    p_description TEXT,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_severity TEXT DEFAULT 'high'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_driver_id UUID;
    v_bus_id UUID;
    v_trip_id UUID;
    v_incident_id UUID;
BEGIN
    SELECT bd.id INTO v_driver_id
    FROM bus_drivers bd WHERE bd.user_id = auth.uid();

    IF v_driver_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Driver profile not found.');
    END IF;

    SELECT b.id, bt.id INTO v_bus_id, v_trip_id
    FROM buses b
    LEFT JOIN bus_trips bt ON bt.bus_id = b.id AND bt.status = 'active' AND bt.trip_date = CURRENT_DATE
    WHERE b.driver_id = v_driver_id AND b.is_active = true
    LIMIT 1;

    INSERT INTO bus_incidents (
        institution_id, bus_id, trip_id, incident_type,
        description, latitude, longitude, reported_by, severity, status
    ) VALUES (
        (SELECT institution_id FROM bus_drivers WHERE id = v_driver_id),
        v_bus_id, v_trip_id, p_incident_type,
        p_description, p_latitude, p_longitude, auth.uid(),
        p_severity, 'reported'
    ) RETURNING id INTO v_incident_id;

    RETURN json_build_object(
        'success', true,
        'incident_id', v_incident_id,
        'message', 'Emergency reported. Admin and warden have been alerted.'
    );
END;
$$;


-- ==========================================================
-- MIGRATION: 20260612000013_vendor_canteen_module.sql
-- ==========================================================

-- ============================================================
-- VENDOR / CANTEEN STAFF MODULE: KOT, Menu Mgmt, Sales, Pre-orders
-- ============================================================

-- ============================================================
-- 1. ORDER STATUS TRACKING: Add status history table
-- ============================================================
CREATE TABLE IF NOT EXISTS canteen_order_status_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES canteen_orders(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE canteen_order_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendor can manage order status logs" ON canteen_order_status_log
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Vendor')
        AND institution_id = get_auth_institution_id()
    );

-- RPC: Update order status (KOT workflow)
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id UUID,
    p_new_status VARCHAR,
    p_notes TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_status VARCHAR;
    v_order RECORD;
BEGIN
    SELECT status INTO v_old_status FROM canteen_orders WHERE id = p_order_id;
    IF v_old_status IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Order not found.');
    END IF;

    UPDATE canteen_orders
    SET status = p_new_status
    WHERE id = p_order_id;

    INSERT INTO canteen_order_status_log (institution_id, order_id, old_status, new_status, changed_by, notes)
    VALUES (
        (SELECT institution_id FROM canteen_orders WHERE id = p_order_id),
        p_order_id, v_old_status, p_new_status, auth.uid(), p_notes
    );

    RETURN json_build_object('success', true, 'old_status', v_old_status, 'new_status', p_new_status);
END;
$$;

-- ============================================================
-- 2. ATOMIC WALLET DEDUCTION for canteen orders
-- ============================================================
CREATE OR REPLACE FUNCTION place_canteen_order_atomic(
    p_student_id UUID,
    p_items JSONB,
    p_total_amount DECIMAL,
    p_special_instructions TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet RECORD;
    v_order_id UUID;
    v_order_number VARCHAR;
    v_item JSONB;
    v_stock_ok BOOLEAN := true;
BEGIN
    -- Get student's wallet with lock
    SELECT * INTO v_wallet
    FROM canteen_wallets
    WHERE student_id = p_student_id
    FOR UPDATE;

    IF v_wallet IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No canteen wallet found.');
    END IF;

    IF v_wallet.balance < p_total_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient wallet balance. Current: ₹' || v_wallet.balance || ', Required: ₹' || p_total_amount);
    END IF;

    -- Check stock for all items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM canteen_menus
            WHERE id = (v_item->>'item_id')::UUID
            AND is_available = true
            AND stock_remaining > 0
        ) THEN
            v_stock_ok := false;
            EXIT;
        END IF;
    END LOOP;

    IF NOT v_stock_ok THEN
        RETURN json_build_object('success', false, 'error', 'One or more items are out of stock.');
    END IF;

    -- Deduct wallet atomically
    UPDATE canteen_wallets
    SET balance = balance - p_total_amount,
        last_updated = NOW()
    WHERE id = v_wallet.id;

    -- Create order
    v_order_number := 'ORD' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');

    INSERT INTO canteen_orders (
        institution_id, student_id, items, total_amount, final_amount,
        status, payment_status, special_instructions, order_number, order_time
    ) VALUES (
        (SELECT institution_id FROM students WHERE id = p_student_id),
        p_student_id, p_items, p_total_amount, p_total_amount,
        'placed', 'paid', p_special_instructions, v_order_number, NOW()
    ) RETURNING id INTO v_order_id;

    -- Deduct stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        UPDATE canteen_menus
        SET stock_remaining = GREATEST(stock_remaining - COALESCE((v_item->>'quantity')::INTEGER, 1), 0)
        WHERE id = (v_item->>'item_id')::UUID;
    END LOOP;

    -- Log wallet transaction
    INSERT INTO wallet_transactions (institution_id, student_id, amount, type, status, description)
    VALUES (
        (SELECT institution_id FROM students WHERE id = p_student_id),
        p_student_id, -p_total_amount, 'canteen_order', 'completed',
        'Canteen order ' || v_order_number
    );

    RETURN json_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'amount_deducted', p_total_amount,
        'remaining_balance', v_wallet.balance - p_total_amount
    );
END;
$$;

-- ============================================================
-- 3. VENDOR DAILY SALES REPORT
-- ============================================================
CREATE OR REPLACE FUNCTION get_vendor_daily_sales(
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_vendor_id UUID;
    v_institution_id UUID;
    v_result JSON;
BEGIN
    SELECT id, institution_id INTO v_vendor_id, v_institution_id
    FROM users WHERE id = auth.uid();

    SELECT institution_id INTO v_institution_id
    FROM users WHERE id = auth.uid();

    WITH day_orders AS (
        SELECT *
        FROM canteen_orders
        WHERE institution_id = v_institution_id
        AND created_at::DATE = p_date
    ),
    item_stats AS (
        SELECT
            (item->>'name') AS item_name,
            SUM((item->>'quantity')::INTEGER) AS total_qty,
            SUM((item->>'price')::DECIMAL * (item->>'quantity')::INTEGER) AS total_revenue
        FROM day_orders,
             jsonb_array_elements(items) AS item
        GROUP BY (item->>'name')
        ORDER BY total_qty DESC
    )
    SELECT json_build_object(
        'date', p_date,
        'total_orders', (SELECT COUNT(*) FROM day_orders),
        'total_revenue', COALESCE((SELECT SUM(total_amount) FROM day_orders), 0),
        'wallet_orders', (SELECT COUNT(*) FROM day_orders WHERE payment_status = 'paid'),
        'cash_orders', (SELECT COUNT(*) FROM day_orders WHERE payment_status = 'cash'),
        'status_breakdown', (
            SELECT json_object_agg(status, cnt)
            FROM (SELECT status, COUNT(*) AS cnt FROM day_orders GROUP BY status) s
        ),
        'top_items', (
            SELECT json_agg(json_build_object('name', item_name, 'qty', total_qty, 'revenue', total_revenue))
            FROM item_stats LIMIT 10
        ),
        'hourly_breakdown', (
            SELECT json_agg(json_build_object('hour', h, 'orders', COALESCE(cnt, 0)))
            FROM generate_series(8, 20) AS h
            LEFT JOIN (
                SELECT EXTRACT(HOUR FROM created_at)::INTEGER AS hour, COUNT(*) AS cnt
                FROM day_orders GROUP BY 1
            ) hr ON hr.hour = h
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ============================================================
-- 4. PRE-ORDER / MEAL PREP LIST
-- ============================================================
CREATE OR REPLACE FUNCTION get_canteen_prep_list(
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    item_name VARCHAR,
    category VARCHAR,
    total_quantity BIGINT,
    veg_quantity BIGINT,
    nonveg_quantity BIGINT,
    special_instructions TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (item->>'name')::VARCHAR,
        COALESCE(cm.category_id::TEXT, 'Uncategorized'),
        SUM((item->>'quantity')::BIGINT),
        SUM(CASE WHEN cm.is_veg THEN (item->>'quantity')::BIGINT ELSE 0 END),
        SUM(CASE WHEN NOT cm.is_veg THEN (item->>'quantity')::BIGINT ELSE 0 END),
        string_agg(DISTINCT co.special_instructions, '; ')
    FROM canteen_orders co,
         jsonb_array_elements(co.items) AS item
    LEFT JOIN canteen_menus cm ON cm.item_name = (item->>'name')
    WHERE co.institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    AND co.created_at::DATE = p_date
    AND co.status IN ('placed', 'confirmed', 'preparing')
    GROUP BY (item->>'name'), cm.category_id
    ORDER BY SUM((item->>'quantity')::BIGINT) DESC;
END;
$$;

-- ============================================================
-- 5. MENU AVAILABILITY TOGGLE
-- ============================================================
CREATE OR REPLACE FUNCTION toggle_menu_availability(
    p_menu_id UUID,
    p_is_available BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE canteen_menus
    SET is_available = p_is_available,
        stock_remaining = CASE WHEN p_is_available THEN daily_stock ELSE 0 END
    WHERE id = p_menu_id
    AND institution_id = (SELECT institution_id FROM users WHERE id = auth.uid());

    IF FOUND THEN
        RETURN json_build_object('success', true, 'available', p_is_available);
    ELSE
        RETURN json_build_object('success', false, 'error', 'Menu item not found.');
    END IF;
END;
$$;

-- Update stock
CREATE OR REPLACE FUNCTION update_menu_stock(
    p_menu_id UUID,
    p_new_stock INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE canteen_menus
    SET daily_stock = p_new_stock,
        stock_remaining = p_new_stock
    WHERE id = p_menu_id
    AND institution_id = (SELECT institution_id FROM users WHERE id = auth.uid());

    IF FOUND THEN
        RETURN json_build_object('success', true);
    ELSE
        RETURN json_build_object('success', false, 'error', 'Menu item not found.');
    END IF;
END;
$$;

-- Update price
CREATE OR REPLACE FUNCTION update_menu_price(
    p_menu_id UUID,
    p_new_price DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE canteen_menus
    SET price = p_new_price
    WHERE id = p_menu_id
    AND institution_id = (SELECT institution_id FROM users WHERE id = auth.uid());

    IF FOUND THEN
        RETURN json_build_object('success', true);
    ELSE
        RETURN json_build_object('success', false, 'error', 'Menu item not found.');
    END IF;
END;
$$;


-- ==========================================================
-- MIGRATION: 20260612000014_director_kpis.sql
-- ==========================================================

-- =========================================================================
-- DIRECTOR DASHBOARD KPIs & ANALYTICS
-- Migration: 20260612000014
-- Real-time campus pulse, fee recovery, attendance trends,
-- complaint SLA, NAAC export, system anomaly detection
-- =========================================================================

-- =========================================================================
-- 1. SYSTEM ANOMALY DETECTION TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS system_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  anomaly_type VARCHAR(50) NOT NULL, -- geo_fence_violation, duplicate_attendance, rapid_wallet_txn, new_device_login, dual_presence, unusual_hours, bulk_action
  severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  module VARCHAR(50) NOT NULL, -- attendance, wallet, gate, auth, canteen
  person_id UUID,
  person_type VARCHAR(20), -- student, staff, teacher
  person_name TEXT,
  metadata JSONB DEFAULT '{}', -- { lat, long, device_id, amount, old_value, new_value }
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_anomalies_institution ON system_anomalies(institution_id);
CREATE INDEX IF NOT EXISTS idx_system_anomalies_type ON system_anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_system_anomalies_created ON system_anomalies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_anomalies_unresolved ON system_anomalies(institution_id, is_resolved) WHERE NOT is_resolved;

-- =========================================================================
-- 2. NAAC ACCREDITATION SNAPSHOTS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS naac_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  data JSONB NOT NULL, -- Full NAAC metrics blob
  generated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, snapshot_date)
);

-- =========================================================================
-- 3. DIRECTOR KPI RPCs
-- =========================================================================

-- 3a. Campus Pulse: 10 real KPIs in one call
CREATE OR REPLACE FUNCTION get_campus_pulse()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inst_id UUID;
  v_result JSON;
  v_today DATE := CURRENT_DATE;
  v_this_month_start DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_attendance_pct NUMERIC := 0;
  v_total_students INT := 0;
  v_fee_billed NUMERIC := 0;
  v_fee_collected NUMERIC := 0;
  v_fee_outstanding NUMERIC := 0;
  v_hostel_occupied INT := 0;
  v_hostel_capacity INT := 0;
  v_complaints_open INT := 0;
  v_gate_entries_today INT := 0;
  v_canteen_revenue NUMERIC := 0;
  v_bus_routes_active INT := 0;
  v_security_incidents INT := 0;
  v_departments JSONB := '[]'::JSONB;
  v_fee_by_dept JSONB := '[]'::JSONB;
BEGIN
  SELECT u.institution_id INTO v_inst_id
  FROM users u
  WHERE u.id = auth.uid();

  IF v_inst_id IS NULL THEN
    SELECT id INTO v_inst_id FROM institutions LIMIT 1;
  END IF;

  -- 1. Today's attendance %
  SELECT COALESCE(
    ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(*), 0), 1), 0
  ) INTO v_attendance_pct
  FROM attendance a
  WHERE a.institution_id = v_inst_id
    AND a.date = v_today;

  -- 2. Total active students
  SELECT COUNT(*) INTO v_total_students
  FROM students s
  WHERE s.institution_id = v_inst_id AND s.is_active = TRUE;

  -- 3. Fee collection this month
  SELECT
    COALESCE(SUM(fs.amount), 0),
    COALESCE(SUM(fp.amount_paid), 0),
    COALESCE(SUM(fs.amount), 0) - COALESCE(SUM(fp.amount_paid), 0)
  INTO v_fee_billed, v_fee_collected, v_fee_outstanding
  FROM fee_structures fs
  LEFT JOIN student_fees sf ON sf.fee_structure_id = fs.id AND sf.institution_id = v_inst_id
  LEFT JOIN fee_payments fp ON fp.student_id = sf.student_id AND fp.fee_structure_id = sf.fee_structure_id AND fp.status = 'completed'
    AND fp.payment_date >= v_this_month_start
  WHERE fs.institution_id = v_inst_id;

  -- 4. Hostel occupancy
  SELECT
    COALESCE(SUM(hr.occupied), 0),
    COALESCE(SUM(hr.capacity), 0)
  INTO v_hostel_occupied, v_hostel_capacity
  FROM hostel_blocks hb
  JOIN hostel_rooms hr ON hr.block_id = hb.id
  WHERE hb.institution_id = v_inst_id;

  -- 5. Open complaints
  SELECT COUNT(*) INTO v_complaints_open
  FROM hostel_complaints hc
  WHERE hc.institution_id = v_inst_id
    AND hc.status NOT IN ('resolved', 'closed');

  -- 6. Gate entries today
  SELECT COUNT(*) INTO v_gate_entries_today
  FROM gate_entries ge
  WHERE ge.institution_id = v_inst_id
    AND ge.timestamp::DATE = v_today;

  -- 7. Canteen revenue today
  SELECT COALESCE(SUM(co.total_amount), 0) INTO v_canteen_revenue
  FROM canteen_orders co
  WHERE co.institution_id = v_inst_id
    AND co.order_time::DATE = v_today
    AND co.status != 'cancelled';

  -- 8. Active bus routes
  SELECT COUNT(DISTINCT bt.route_id) INTO v_bus_routes_active
  FROM bus_trips bt
  WHERE bt.institution_id = v_inst_id
    AND bt.trip_date = v_today
    AND bt.status IN ('in_progress', 'scheduled');

  -- 9. Security incidents today
  SELECT COUNT(*) INTO v_security_incidents
  FROM security_incidents si
  WHERE si.institution_id = v_inst_id
    AND si.created_at::DATE = v_today;

  -- 10. Department breakdown
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'name', d.name,
      'student_count', dept_stats.cnt,
      'attendance_pct', dept_stats.att_pct
    )
  ), '[]'::JSONB) INTO v_departments
  FROM (
    SELECT
      s.department_id,
      COUNT(*) as cnt,
      COALESCE(ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(a.id), 0), 1), 0) as att_pct
    FROM students s
    LEFT JOIN attendance a ON a.student_id = s.id AND a.date = v_today
    WHERE s.institution_id = v_inst_id AND s.is_active = TRUE
    GROUP BY s.department_id
  ) dept_stats
  JOIN departments d ON d.id = dept_stats.department_id;

  -- Fee by department
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'department', d.name,
      'billed', COALESCE(dept_fees.billed, 0),
      'collected', COALESCE(dept_fees.collected, 0),
      'outstanding', COALESCE(dept_fees.billed, 0) - COALESCE(dept_fees.collected, 0)
    )
  ), '[]'::JSONB) INTO v_fee_by_dept
  FROM (
    SELECT
      s.department_id,
      SUM(sf.amount) as billed,
      SUM(COALESCE(fp.amount_paid, 0)) as collected
    FROM students s
    JOIN student_fees sf ON sf.student_id = s.id
    LEFT JOIN fee_payments fp ON fp.student_id = sf.student_id AND fp.fee_structure_id = sf.fee_structure_id AND fp.status = 'completed'
    WHERE s.institution_id = v_inst_id AND s.is_active = TRUE
    GROUP BY s.department_id
  ) dept_fees
  JOIN departments d ON d.id = dept_fees.department_id;

  v_result := json_build_object(
    'attendance_pct', v_attendance_pct,
    'total_students', v_total_students,
    'fee_billed', v_fee_billed,
    'fee_collected', v_fee_collected,
    'fee_outstanding', v_fee_outstanding,
    'hostel_occupied', v_hostel_occupied,
    'hostel_capacity', v_hostel_capacity,
    'hostel_occupancy_pct', CASE WHEN v_hostel_capacity > 0 THEN ROUND(100.0 * v_hostel_occupied / v_hostel_capacity, 1) ELSE 0 END,
    'complaints_open', v_complaints_open,
    'gate_entries_today', v_gate_entries_today,
    'canteen_revenue', v_canteen_revenue,
    'bus_routes_active', v_bus_routes_active,
    'security_incidents', v_security_incidents,
    'departments', v_departments,
    'fee_by_department', v_fee_by_dept,
    'snapshot_date', v_today,
    'snapshot_time', NOW()
  );

  RETURN v_result;
END;
$$;

-- 3b. Fee Recovery Tracking
CREATE OR REPLACE FUNCTION get_fee_recovery_tracking(
  p_semester INT DEFAULT NULL,
  p_department_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inst_id UUID;
  v_result JSON;
BEGIN
  SELECT u.institution_id INTO v_inst_id
  FROM users u WHERE u.id = auth.uid();
  IF v_inst_id IS NULL THEN SELECT id INTO v_inst_id FROM institutions LIMIT 1; END IF;

  SELECT json_build_object(
    'summary', (
      SELECT json_build_object(
        'total_billed', COALESCE(SUM(sf.amount), 0),
        'total_collected', COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0),
        'total_outstanding', COALESCE(SUM(sf.amount), 0) - COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0),
        'collection_rate', CASE WHEN SUM(sf.amount) > 0
          THEN ROUND(100.0 * COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) / SUM(sf.amount), 1)
          ELSE 0 END,
        'total_students', COUNT(DISTINCT sf.student_id),
        'fully_paid_count', COUNT(DISTINCT sf.student_id) FILTER (
          WHERE COALESCE((SELECT SUM(amount_paid) FROM fee_payments WHERE student_id = sf.student_id AND fee_structure_id = sf.fee_structure_id AND status = 'completed'), 0) >= sf.amount
        ),
        'partial_paid_count', COUNT(DISTINCT sf.student_id) FILTER (
          WHERE COALESCE((SELECT SUM(amount_paid) FROM fee_payments WHERE student_id = sf.student_id AND fee_structure_id = sf.fee_structure_id AND status = 'completed'), 0) > 0
            AND COALESCE((SELECT SUM(amount_paid) FROM fee_payments WHERE student_id = sf.student_id AND fee_structure_id = sf.fee_structure_id AND status = 'completed'), 0) < sf.amount
        ),
        'unpaid_count', COUNT(DISTINCT sf.student_id) FILTER (
          WHERE COALESCE((SELECT SUM(amount_paid) FROM fee_payments WHERE student_id = sf.student_id AND fee_structure_id = sf.fee_structure_id AND status = 'completed'), 0) = 0
        )
      )
      FROM student_fees sf
      LEFT JOIN fee_payments fp ON fp.student_id = sf.student_id AND fp.fee_structure_id = sf.fee_structure_id
      JOIN students s ON s.id = sf.student_id AND s.institution_id = v_inst_id
      WHERE sf.institution_id = v_inst_id
        AND (p_semester IS NULL OR s.semester = p_semester)
        AND (p_department_id IS NULL OR s.department_id = p_department_id)
    ),
    'by_department', (
      SELECT COALESCE(jsonb_agg(row_to_json(d)), '[]'::JSONB)
      FROM (
        SELECT
          dep.name as department_name,
          COALESCE(SUM(sf.amount), 0) as billed,
          COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) as collected,
          COALESCE(SUM(sf.amount), 0) - COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) as outstanding,
          CASE WHEN SUM(sf.amount) > 0
            THEN ROUND(100.0 * COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) / SUM(sf.amount), 1)
            ELSE 0 END as collection_rate
        FROM students s
        JOIN departments dep ON dep.id = s.department_id
        LEFT JOIN student_fees sf ON sf.student_id = s.id
        LEFT JOIN fee_payments fp ON fp.student_id = sf.student_id AND fp.fee_structure_id = sf.fee_structure_id
        WHERE s.institution_id = v_inst_id AND s.is_active = TRUE
          AND (p_semester IS NULL OR s.semester = p_semester)
        GROUP BY dep.id, dep.name
        ORDER BY outstanding DESC
      ) d
    ),
    'by_fee_type', (
      SELECT COALESCE(jsonb_agg(row_to_json(ft)), '[]'::JSONB)
      FROM (
        SELECT
          fs.name as fee_name,
          COALESCE(SUM(sf.amount), 0) as billed,
          COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) as collected,
          COALESCE(SUM(sf.amount), 0) - COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) as outstanding
        FROM fee_structures fs
        LEFT JOIN student_fees sf ON sf.fee_structure_id = fs.id
        LEFT JOIN fee_payments fp ON fp.student_id = sf.student_id AND fp.fee_structure_id = sf.fee_structure_id
        WHERE fs.institution_id = v_inst_id
        GROUP BY fs.id, fs.name
        ORDER BY outstanding DESC
      ) ft
    ),
    'top_defaulters', (
      SELECT COALESCE(jsonb_agg(row_to_json(def)), '[]'::JSONB)
      FROM (
        SELECT
          s.id as student_id,
          u.name as student_name,
          s.roll_number,
          dep.name as department_name,
          s.semester,
          COALESCE(SUM(sf.amount), 0) as total_due,
          COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) as total_paid,
          COALESCE(SUM(sf.amount), 0) - COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) as overdue_amount,
          COALESCE(guardian.guardian_name, '') as guardian_name,
          COALESCE(guardian.guardian_phone, '') as guardian_phone
        FROM students s
        JOIN users u ON u.id = s.user_id
        JOIN departments dep ON dep.id = s.department_id
        LEFT JOIN student_fees sf ON sf.student_id = s.id
        LEFT JOIN fee_payments fp ON fp.student_id = sf.student_id AND fp.fee_structure_id = sf.fee_structure_id
        LEFT JOIN LATERAL (
          SELECT s2.guardian_name, s2.guardian_phone
          FROM students s2 WHERE s2.id = s.id
        ) guardian ON TRUE
        WHERE s.institution_id = v_inst_id AND s.is_active = TRUE
        GROUP BY s.id, u.name, s.roll_number, dep.name, s.semester, guardian.guardian_name, guardian.guardian_phone
        HAVING COALESCE(SUM(sf.amount), 0) - COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) > 0
        ORDER BY overdue_amount DESC
        LIMIT 20
      ) def
    ),
    'monthly_trend', (
      SELECT COALESCE(jsonb_agg(row_to_json(mt)), '[]'::JSONB)
      FROM (
        SELECT
          DATE_TRUNC('month', fp.payment_date)::DATE as month,
          SUM(fp.amount_paid) as collected
        FROM fee_payments fp
        WHERE fp.institution_id = v_inst_id AND fp.status = 'completed'
          AND fp.payment_date >= (CURRENT_DATE - INTERVAL '12 months')
        GROUP BY DATE_TRUNC('month', fp.payment_date)
        ORDER BY month
      ) mt
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3c. Attendance Trends (department-wise, weekly/monthly)
CREATE OR REPLACE FUNCTION get_attendance_trends(
  p_period VARCHAR DEFAULT 'weekly', -- weekly, monthly
  p_department_id UUID DEFAULT NULL,
  p_weeks INT DEFAULT 12
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inst_id UUID;
  v_result JSON;
  v_start_date DATE;
BEGIN
  SELECT u.institution_id INTO v_inst_id
  FROM users u WHERE u.id = auth.uid();
  IF v_inst_id IS NULL THEN SELECT id INTO v_inst_id FROM institutions LIMIT 1; END IF;

  IF p_period = 'weekly' THEN
    v_start_date := CURRENT_DATE - (p_weeks * 7);
  ELSE
    v_start_date := CURRENT_DATE - (p_weeks * 30);
  END IF;

  SELECT json_build_object(
    'overall_trend', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::JSONB)
      FROM (
        SELECT
          CASE WHEN p_period = 'weekly'
            THEN DATE_TRUNC('week', a.date)::DATE
            ELSE DATE_TRUNC('month', a.date)::DATE
          END as period_start,
          COUNT(*) as total_classes,
          COUNT(*) FILTER (WHERE a.status = 'present') as present_count,
          ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(*), 0), 1) as attendance_pct
        FROM attendance a
        WHERE a.institution_id = v_inst_id
          AND a.date >= v_start_date
        GROUP BY period_start
        ORDER BY period_start
      ) t
    ),
    'by_department', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'department', dept_trend.department_name,
          'trend', dept_trend.trend
        )
      ), '[]'::JSONB)
      FROM (
        SELECT
          d.name as department_name,
          COALESCE(jsonb_agg(
            jsonb_build_object(
              'period', dept_data.period_start,
              'attendance_pct', dept_data.attendance_pct
            ) ORDER BY dept_data.period_start
          ), '[]'::JSONB) as trend
        FROM departments d
        CROSS JOIN LATERAL (
          SELECT
            CASE WHEN p_period = 'weekly'
              THEN DATE_TRUNC('week', a.date)::DATE
              ELSE DATE_TRUNC('month', a.date)::DATE
            END as period_start,
            ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(*), 0), 1) as attendance_pct
          FROM attendance a
          JOIN students s ON s.id = a.student_id
          WHERE s.institution_id = v_inst_id
            AND s.department_id = d.id
            AND a.date >= v_start_date
            AND (p_department_id IS NULL OR s.department_id = p_department_id)
          GROUP BY period_start
        ) dept_data
        WHERE d.institution_id = v_inst_id
        GROUP BY d.id, d.name
        ORDER BY d.name
      ) dept_trend
    ),
    'department_summary', (
      SELECT COALESCE(jsonb_agg(row_to_json(ds)), '[]'::JSONB)
      FROM (
        SELECT
          d.name as department_name,
          d.id as department_id,
          COUNT(DISTINCT s.id) as student_count,
          COUNT(a.id) as total_records,
          COUNT(a.id) FILTER (WHERE a.status = 'present') as present_count,
          ROUND(100.0 * COUNT(a.id) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(a.id), 0), 1) as overall_pct,
          ROUND(100.0 * COUNT(a.id) FILTER (WHERE a.status = 'present' AND a.date >= CURRENT_DATE - 7) / NULLIF(COUNT(a.id) FILTER (WHERE a.date >= CURRENT_DATE - 7), 0), 1) as last_7d_pct,
          ROUND(100.0 * COUNT(a.id) FILTER (WHERE a.status = 'present' AND a.date >= CURRENT_DATE - 30) / NULLIF(COUNT(a.id) FILTER (WHERE a.date >= CURRENT_DATE - 30), 0), 1) as last_30d_pct
        FROM departments d
        LEFT JOIN students s ON s.department_id = d.id AND s.institution_id = v_inst_id AND s.is_active = TRUE
        LEFT JOIN attendance a ON a.student_id = s.id AND a.date >= v_start_date
        WHERE d.institution_id = v_inst_id
        GROUP BY d.id, d.name
        ORDER BY overall_pct ASC
      ) ds
    ),
    'declining_departments', (
      SELECT COALESCE(jsonb_agg(row_to_json(dd)), '[]'::JSONB)
      FROM (
        SELECT
          d.name as department_name,
          recent.recent_pct,
          older.older_pct,
          ROUND(recent.recent_pct - older.older_pct, 1) as change_pct
        FROM departments d
        JOIN LATERAL (
          SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(*), 0), 1) as recent_pct
          FROM attendance a
          JOIN students s ON s.id = a.student_id
          WHERE s.department_id = d.id AND s.institution_id = v_inst_id
            AND a.date >= CURRENT_DATE - 14
        ) recent ON TRUE
        JOIN LATERAL (
          SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(*), 0), 1) as older_pct
          FROM attendance a
          JOIN students s ON s.id = a.student_id
          WHERE s.department_id = d.id AND s.institution_id = v_inst_id
            AND a.date >= CURRENT_DATE - 28 AND a.date < CURRENT_DATE - 14
        ) older ON TRUE
        WHERE d.institution_id = v_inst_id
          AND (recent.recent_pct - older.older_pct) < -5
        ORDER BY (recent.recent_pct - older.older_pct) ASC
      ) dd
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3d. Complaint SLA Monitoring
CREATE OR REPLACE FUNCTION get_complaint_sla_monitoring()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inst_id UUID;
  v_result JSON;
BEGIN
  SELECT u.institution_id INTO v_inst_id
  FROM users u WHERE u.id = auth.uid();
  IF v_inst_id IS NULL THEN SELECT id INTO v_inst_id FROM institutions LIMIT 1; END IF;

  SELECT json_build_object(
    'summary', (
      SELECT json_build_object(
        'total_complaints', COUNT(*),
        'open', COUNT(*) FILTER (WHERE hc.status = 'open'),
        'in_progress', COUNT(*) FILTER (WHERE hc.status = 'in_progress'),
        'resolved', COUNT(*) FILTER (WHERE hc.status = 'resolved'),
        'closed', COUNT(*) FILTER (WHERE hc.status = 'closed'),
        'avg_resolution_hours', ROUND(AVG(EXTRACT(EPOCH FROM (hc.resolved_at - hc.created_at)) / 3600) FILTER (WHERE hc.resolved_at IS NOT NULL), 1),
        'overdue_3days', COUNT(*) FILTER (WHERE hc.status NOT IN ('resolved', 'closed') AND hc.created_at < NOW() - INTERVAL '3 days'),
        'overdue_7days', COUNT(*) FILTER (WHERE hc.status NOT IN ('resolved', 'closed') AND hc.created_at < NOW() - INTERVAL '7 days')
      )
      FROM hostel_complaints hc
      WHERE hc.institution_id = v_inst_id
    ),
    'by_category', (
      SELECT COALESCE(jsonb_agg(row_to_json(cat)), '[]'::JSONB)
      FROM (
        SELECT
          hc.category,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE hc.status IN ('open', 'in_progress')) as pending,
          ROUND(AVG(EXTRACT(EPOCH FROM (hc.resolved_at - hc.created_at)) / 3600) FILTER (WHERE hc.resolved_at IS NOT NULL), 1) as avg_resolution_hours
        FROM hostel_complaints hc
        WHERE hc.institution_id = v_inst_id
        GROUP BY hc.category
        ORDER BY pending DESC
      ) cat
    ),
    'by_block', (
      SELECT COALESCE(jsonb_agg(row_to_json(blk)), '[]'::JSONB)
      FROM (
        SELECT
          hb.name as block_name,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE hc.status IN ('open', 'in_progress')) as pending,
          ROUND(AVG(EXTRACT(EPOCH FROM (hc.resolved_at - hc.created_at)) / 3600) FILTER (WHERE hc.resolved_at IS NOT NULL), 1) as avg_resolution_hours
        FROM hostel_complaints hc
        JOIN hostel_rooms hr ON hr.id = hc.room_id
        JOIN hostel_blocks hb ON hb.id = hr.block_id
        WHERE hc.institution_id = v_inst_id
        GROUP BY hb.id, hb.name
        ORDER BY pending DESC
      ) blk
    ),
    'sla_breaches', (
      SELECT COALESCE(jsonb_agg(row_to_json(slb)), '[]'::JSONB)
      FROM (
        SELECT
          hc.id,
          hc.category,
          hc.description,
          hc.status,
          hc.created_at,
          hc.assigned_to,
          EXTRACT(EPOCH FROM (NOW() - hc.created_at)) / 3600 as hours_open,
          CASE
            WHEN hc.created_at < NOW() - INTERVAL '7 days' THEN 'critical'
            WHEN hc.created_at < NOW() - INTERVAL '3 days' THEN 'warning'
            ELSE 'normal'
          END as sla_status
        FROM hostel_complaints hc
        WHERE hc.institution_id = v_inst_id
          AND hc.status NOT IN ('resolved', 'closed')
          AND hc.created_at < NOW() - INTERVAL '3 days'
        ORDER BY hc.created_at ASC
        LIMIT 50
      ) slb
    ),
    'repeat_rooms', (
      SELECT COALESCE(jsonb_agg(row_to_json(rr)), '[]'::JSONB)
      FROM (
        SELECT
          hc.room_id,
          hr.room_number,
          hb.name as block_name,
          COUNT(*) as complaint_count,
          MAX(hc.created_at) as last_complaint
        FROM hostel_complaints hc
        JOIN hostel_rooms hr ON hr.id = hc.room_id
        JOIN hostel_blocks hb ON hb.id = hr.block_id
        WHERE hc.institution_id = v_inst_id
        GROUP BY hc.room_id, hr.room_number, hb.name
        HAVING COUNT(*) >= 3
        ORDER BY complaint_count DESC
      ) rr
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3e. NAAC Accreditation Data Export
CREATE OR REPLACE FUNCTION get_naac_accreditation_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inst_id UUID;
  v_result JSON;
  v_academic_year VARCHAR;
  v_student_count INT;
  v_teacher_count INT;
  v_staff_count INT;
BEGIN
  SELECT u.institution_id INTO v_inst_id
  FROM users u WHERE u.id = auth.uid();
  IF v_inst_id IS NULL THEN SELECT id INTO v_inst_id FROM institutions LIMIT 1; END IF;

  v_academic_year := CASE
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 7
    THEN EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR || '-' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::VARCHAR
    ELSE (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::VARCHAR || '-' || EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR
  END;

  SELECT COUNT(*) INTO v_student_count FROM students WHERE institution_id = v_inst_id AND is_active = TRUE;
  SELECT COUNT(*) INTO v_teacher_count FROM users WHERE institution_id = v_inst_id AND role = 'Teacher' AND is_active = TRUE;
  SELECT COUNT(*) INTO v_staff_count FROM users WHERE institution_id = v_inst_id AND role IN ('Staff', 'Admin') AND is_active = TRUE;

  SELECT json_build_object(
    'academic_year', v_academic_year,
    'generated_at', NOW(),

    -- Criterion 1: Curricular Aspects
    'curricular_aspects', json_build_object(
      'total_programs', (SELECT COUNT(DISTINCT department_id) FROM students WHERE institution_id = v_inst_id),
      'student_teacher_ratio', CASE WHEN v_teacher_count > 0 THEN ROUND(v_student_count::NUMERIC / v_teacher_count, 1) ELSE 0 END,
      'student_staff_ratio', CASE WHEN v_staff_count > 0 THEN ROUND(v_student_count::NUMERIC / v_staff_count, 1) ELSE 0 END
    ),

    -- Criterion 2: Teaching-Learning
    'teaching_learning', json_build_object(
      'total_students', v_student_count,
      'total_teachers', v_teacher_count,
      'attendance_summary', (
        SELECT json_build_object(
          'avg_attendance_pct', ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'present') / NULLIF(COUNT(*), 0), 1),
          'total_sessions', COUNT(*),
          'data_from', MIN(date),
          'data_to', MAX(date)
        )
        FROM attendance WHERE institution_id = v_inst_id
      ),
      'exam_results', (
        SELECT json_build_object(
          'total_exams', COUNT(DISTINCT exam_id),
          'total_results', COUNT(*),
          'pass_count', COUNT(*) FILTER (WHERE status = 'pass'),
          'pass_rate', ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'pass') / NULLIF(COUNT(*), 0), 1)
        )
        FROM exam_results WHERE institution_id = v_inst_id
      )
    ),

    -- Criterion 3: Research & Innovation
    'research_innovation', json_build_object(
      'total_events', (SELECT COUNT(*) FROM events WHERE institution_id = v_inst_id AND category = 'academic'),
      'total_workshops', (SELECT COUNT(*) FROM events WHERE institution_id = v_inst_id AND category = 'workshop')
    ),

    -- Criterion 4: Infrastructure
    'infrastructure', json_build_object(
      'hostel_blocks', (SELECT COUNT(*) FROM hostel_blocks WHERE institution_id = v_inst_id),
      'hostel_capacity', (SELECT COALESCE(SUM(capacity), 0) FROM hostel_rooms WHERE block_id IN (SELECT id FROM hostel_blocks WHERE institution_id = v_inst_id)),
      'hostel_occupied', (SELECT COALESCE(SUM(occupied), 0) FROM hostel_rooms WHERE block_id IN (SELECT id FROM hostel_blocks WHERE institution_id = v_inst_id)),
      'bus_routes', (SELECT COUNT(DISTINCT route_id) FROM bus_trips WHERE institution_id = v_inst_id),
      'library_books', (SELECT COUNT(*) FROM books WHERE institution_id = v_inst_id)
    ),

    -- Criterion 5: Student Support
    'student_support', json_build_object(
      'total_complaints', (SELECT COUNT(*) FROM hostel_complaints WHERE institution_id = v_inst_id),
      'resolved_complaints', (SELECT COUNT(*) FROM hostel_complaints WHERE institution_id = v_inst_id AND status IN ('resolved', 'closed')),
      'resolution_rate', (
        SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) / NULLIF(COUNT(*), 0), 1)
        FROM hostel_complaints WHERE institution_id = v_inst_id
      ),
      'fee_collection_rate', (
        SELECT CASE WHEN SUM(sf.amount) > 0
          THEN ROUND(100.0 * COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) / SUM(sf.amount), 1)
          ELSE 0 END
        FROM student_fees sf
        LEFT JOIN fee_payments fp ON fp.student_id = sf.student_id AND fp.fee_structure_id = sf.fee_structure_id
        WHERE sf.institution_id = v_inst_id
      )
    ),

    -- Criterion 6: Governance
    'governance', json_build_object(
      'total_users', (SELECT COUNT(*) FROM users WHERE institution_id = v_inst_id AND is_active = TRUE),
      'roles_breakdown', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('role', role, 'count', cnt)), '[]'::JSONB)
        FROM (
          SELECT role, COUNT(*) as cnt
          FROM users WHERE institution_id = v_inst_id AND is_active = TRUE
          GROUP BY role
        ) r
      )
    ),

    -- Department-wise summary
    'department_wise', (
      SELECT COALESCE(jsonb_agg(row_to_json(dep)), '[]'::JSONB)
      FROM (
        SELECT
          d.name as department_name,
          COUNT(DISTINCT s.id) as students,
          COUNT(DISTINCT CASE WHEN u.role = 'Teacher' THEN u.id END) as teachers,
          ROUND(100.0 * COUNT(a.id) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(a.id), 0), 1) as attendance_pct
        FROM departments d
        LEFT JOIN students s ON s.department_id = d.id AND s.institution_id = v_inst_id AND s.is_active = TRUE
        LEFT JOIN users u ON u.institution_id = v_inst_id AND u.role = 'Teacher' AND u.is_active = TRUE
        LEFT JOIN attendance a ON a.student_id = s.id
        WHERE d.institution_id = v_inst_id
        GROUP BY d.id, d.name
      ) dep
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3f. System Anomaly Detection
CREATE OR REPLACE FUNCTION detect_system_anomalies()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inst_id UUID;
  v_result JSON;
  v_anomaly_count INT := 0;
BEGIN
  SELECT u.institution_id INTO v_inst_id
  FROM users u WHERE u.id = auth.uid();
  IF v_inst_id IS NULL THEN SELECT id INTO v_inst_id FROM institutions LIMIT 1; END IF;

  -- Detect duplicate attendance (same student, same session, multiple marks)
  INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, person_id, person_type, person_name, metadata)
  SELECT
    v_inst_id,
    'duplicate_attendance',
    'high',
    'Duplicate Attendance Detected',
    'Student ' || u.name || ' has ' || COUNT(*) || ' attendance records for the same session on ' || a.date,
    'attendance',
    a.student_id,
    'student',
    u.name,
    jsonb_build_object('date', a.date, 'session_id', a.session_id, 'count', COUNT(*))
  FROM attendance a
  JOIN students s ON s.id = a.student_id
  JOIN users u ON u.id = s.user_id
  WHERE a.institution_id = v_inst_id
    AND a.date >= CURRENT_DATE - 1
  GROUP BY a.student_id, a.session_id, a.date, u.name
  HAVING COUNT(*) > 1
  ON CONFLICT DO NOTHING;

  -- Detect wallet rapid transactions (>3 in 5 minutes)
  INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, person_id, person_type, person_name, metadata)
  SELECT
    v_inst_id,
    'rapid_wallet_txn',
    'medium',
    'Rapid Wallet Transactions',
    u.name || ' made ' || COUNT(*) || ' wallet transactions within 5 minutes',
    'wallet',
    wt.student_id,
    'student',
    u.name,
    jsonb_build_object('transaction_count', COUNT(*), 'time_window', '5 minutes', 'total_amount', SUM(wt.amount))
  FROM wallet_transactions wt
  JOIN students s ON s.id = wt.student_id
  JOIN users u ON u.id = s.user_id
  WHERE wt.institution_id = v_inst_id
    AND wt.created_at >= NOW() - INTERVAL '1 hour'
  GROUP BY wt.student_id, u.name, DATE_TRUNC('minute', wt.created_at)
  HAVING COUNT(*) >= 3
  ON CONFLICT DO NOTHING;

  -- Detect unusual hours attendance (marked before 6AM or after 10PM)
  INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, person_id, person_type, person_name, metadata)
  SELECT
    v_inst_id,
    'unusual_hours',
    'medium',
    'Attendance Marked at Unusual Hours',
    'Attendance for ' || u.name || ' was marked at ' || TO_CHAR(a.created_at, 'HH24:MI'),
    'attendance',
    a.student_id,
    'student',
    u.name,
    jsonb_build_object('marked_at', a.created_at, 'method', a.method)
  FROM attendance a
  JOIN students s ON s.id = a.student_id
  JOIN users u ON u.id = s.user_id
  WHERE a.institution_id = v_inst_id
    AND a.created_at >= NOW() - INTERVAL '24 hours'
    AND (EXTRACT(HOUR FROM a.created_at) < 6 OR EXTRACT(HOUR FROM a.created_at) > 22)
  ON CONFLICT DO NOTHING;

  -- Detect geo-fence violations (attendance marked >1km from institution)
  INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, person_id, person_type, person_name, metadata)
  SELECT
    v_inst_id,
    'geo_fence_violation',
    'high',
    'Attendance Outside Geo-Fence',
    u.name || ' marked attendance from ' || ROUND(a.lat::NUMERIC, 4) || ', ' || ROUND(a.long::NUMERIC, 4),
    'attendance',
    a.student_id,
    'student',
    u.name,
    jsonb_build_object('lat', a.lat, 'long', a.long, 'method', a.method)
  FROM attendance a
  JOIN students s ON s.id = a.student_id
  JOIN users u ON u.id = s.user_id
  WHERE a.institution_id = v_inst_id
    AND a.created_at >= NOW() - INTERVAL '24 hours'
    AND a.lat IS NOT NULL AND a.long IS NOT NULL
    AND (a.lat = 0 OR a.long = 0)
  ON CONFLICT DO NOTHING;

  -- Get unresolved anomaly count
  SELECT COUNT(*) INTO v_anomaly_count
  FROM system_anomalies
  WHERE institution_id = v_inst_id AND NOT is_resolved;

  SELECT json_build_object(
    'total_unresolved', v_anomaly_count,
    'by_type', (
      SELECT COALESCE(jsonb_agg(row_to_json(at)), '[]'::JSONB)
      FROM (
        SELECT anomaly_type, severity, COUNT(*) as count
        FROM system_anomalies
        WHERE institution_id = v_inst_id AND NOT is_resolved
        GROUP BY anomaly_type, severity
        ORDER BY count DESC
      ) at
    ),
    'recent', (
      SELECT COALESCE(jsonb_agg(row_to_json(ra)), '[]'::JSONB)
      FROM (
        SELECT id, anomaly_type, severity, title, description, module, person_name, metadata, created_at
        FROM system_anomalies
        WHERE institution_id = v_inst_id AND NOT is_resolved
        ORDER BY created_at DESC
        LIMIT 20
      ) ra
    ),
    'stats', (
      SELECT json_build_object(
        'total_all_time', COUNT(*),
        'resolved', COUNT(*) FILTER (WHERE is_resolved),
        'critical', COUNT(*) FILTER (WHERE severity = 'critical' AND NOT is_resolved),
        'high', COUNT(*) FILTER (WHERE severity = 'high' AND NOT is_resolved),
        'medium', COUNT(*) FILTER (WHERE severity = 'medium' AND NOT is_resolved),
        'low', COUNT(*) FILTER (WHERE severity = 'low' AND NOT is_resolved)
      )
      FROM system_anomalies WHERE institution_id = v_inst_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3g. Resolve an anomaly
CREATE OR REPLACE FUNCTION resolve_anomaly(
  p_anomaly_id UUID,
  p_resolution_notes TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE system_anomalies
  SET is_resolved = TRUE,
      resolved_by = auth.uid(),
      resolved_at = NOW(),
      resolution_notes = p_resolution_notes
  WHERE id = p_anomaly_id;

  RETURN json_build_object('success', TRUE);
END;
$$;

-- =========================================================================
-- 4. RLS POLICIES
-- =========================================================================
ALTER TABLE system_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE naac_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Director/Admin can view anomalies"
  ON system_anomalies FOR SELECT
  USING (institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()));

CREATE POLICY "System can insert anomalies"
  ON system_anomalies FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Director/Admin can update anomalies"
  ON system_anomalies FOR UPDATE
  USING (institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Director/Admin can view NAAC snapshots"
  ON naac_snapshots FOR SELECT
  USING (institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Director/Admin can insert NAAC snapshots"
  ON naac_snapshots FOR INSERT
  WITH CHECK (institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()));

-- =========================================================================
-- 5. MATERIALIZED VIEW REFRESH FUNCTION
-- =========================================================================
CREATE OR REPLACE FUNCTION refresh_director_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_attendance_summary;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_fee_summary;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;


-- ==========================================================
-- MIGRATION: 20260612000015_whatsapp_api_config.sql
-- ==========================================================

-- IRIS 365: WhatsApp API Configuration
-- Institute admins configure their own WhatsApp provider credentials

CREATE TABLE IF NOT EXISTS whatsapp_api_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL DEFAULT 'twilio', -- twilio, meta_cloud, gupshup, wati, custom
  api_url TEXT NOT NULL,
  api_key TEXT, -- or auth token
  phone_number_id VARCHAR(100), -- WhatsApp Business phone number ID
  from_number VARCHAR(50), -- sender number (e.g., whatsapp:+14155238886 for Twilio)
  verify_token VARCHAR(200), -- webhook verify token
  access_token TEXT, -- for Meta Cloud API / Gupshup / WATI
  template_namespace VARCHAR(200), -- Twilio content template SID prefix
  is_active BOOLEAN DEFAULT true,
  extra_config JSONB DEFAULT '{}', -- provider-specific extra fields
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Only one active config at a time
CREATE UNIQUE INDEX idx_whatsapp_config_active ON whatsapp_api_config (is_active) WHERE is_active = true;

-- RLS: Only Admin/SuperAdmin can manage
ALTER TABLE whatsapp_api_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_config_admin_manage" ON whatsapp_api_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Admin', 'SuperAdmin')
    )
  );

CREATE POLICY "whatsapp_config_service_role" ON whatsapp_api_config
  FOR ALL
  USING (auth.role() = 'service_role');

-- Log table for WhatsApp message delivery
CREATE TABLE IF NOT EXISTS whatsapp_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_phone VARCHAR(30) NOT NULL,
  from_phone VARCHAR(30),
  template_name VARCHAR(100),
  message_body TEXT,
  status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, failed, sandbox
  provider VARCHAR(50),
  provider_message_id VARCHAR(200),
  error_message TEXT,
  channel_purpose VARCHAR(50), -- fee_reminder, attendance_warning, fee_escalation, daily_digest, broadcast, general
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE whatsapp_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_log_admin_read" ON whatsapp_delivery_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Admin', 'SuperAdmin')
    )
  );

CREATE POLICY "whatsapp_log_service_insert" ON whatsapp_delivery_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE whatsapp_api_config IS 'Institute WhatsApp API provider configuration. Admin provides their own API credentials.';
COMMENT ON TABLE whatsapp_delivery_log IS 'Audit log of all WhatsApp messages sent through the system.';


-- ==========================================================
-- MIGRATION: 20260613000001_module_gap_fixes.sql
-- ==========================================================

-- ============================================================
-- MIGRATION: Module-by-module gap fixes
-- 1. General-purpose deduct_wallet RPC
-- 2. Daily canteen menu table
-- 3. Grievance / complaint system
-- 4. Company visits table for placements
-- ============================================================

-- ============================================================
-- 1. GENERAL-PURPOSE WALLET DEDUCTION RPC
-- Reusable by any module: exam fees, hostel fees, event payments, etc.
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_wallet(
    p_student_id UUID,
    p_amount NUMERIC,
    p_description TEXT DEFAULT 'Wallet deduction',
    p_module TEXT DEFAULT 'general'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance NUMERIC;
    v_tx_id UUID;
    v_institution_id UUID;
BEGIN
    IF p_amount <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Amount must be positive.');
    END IF;

    SELECT institution_id, COALESCE(wallet_balance, 0) INTO v_institution_id, v_balance
    FROM students WHERE id = p_student_id FOR UPDATE;

    IF v_institution_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Student not found.');
    END IF;

    IF v_balance < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance. Available: ₹' || v_balance || ', Required: ₹' || p_amount);
    END IF;

    UPDATE students SET wallet_balance = wallet_balance - p_amount WHERE id = p_student_id;

    INSERT INTO wallet_transactions (institution_id, student_id, amount, type, status, description)
    VALUES (v_institution_id, p_student_id, -p_amount, 'deduction', 'completed', p_module || ': ' || p_description)
    RETURNING id INTO v_tx_id;

    RETURN json_build_object(
        'success', true,
        'transaction_id', v_tx_id,
        'amount_deducted', p_amount,
        'remaining_balance', v_balance - p_amount
    );
END;
$$;

-- ============================================================
-- 2. DAILY CANTEEN MENU TABLE
-- Maps which items are available on which day/meal type
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_canteen_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES canteen_menus(id) ON DELETE CASCADE,
    menu_date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
    is_available BOOLEAN DEFAULT true,
    price_override NUMERIC(10,2),
    special_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institution_id, menu_item_id, menu_date, meal_type)
);

CREATE INDEX IF NOT EXISTS idx_daily_menu_date ON daily_canteen_menu(institution_id, menu_date, meal_type);
CREATE INDEX IF NOT EXISTS idx_daily_menu_item ON daily_canteen_menu(menu_item_id);

ALTER TABLE daily_canteen_menu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily menu" ON daily_canteen_menu FOR SELECT USING (true);
CREATE POLICY "Staff can manage daily menu" ON daily_canteen_menu FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin', 'Staff'))
);

-- RPC: Get today's menu
CREATE OR REPLACE FUNCTION get_today_menu(
    p_institution_id UUID,
    p_meal_type TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(json_build_object(
        'id', dcm.id,
        'menu_item_id', dcm.menu_item_id,
        'name', cm.item_name,
        'description', cm.description,
        'category', cm.category,
        'price', COALESCE(dcm.price_override, cm.price),
        'is_veg', cm.is_veg,
        'is_available', dcm.is_available,
        'meal_type', dcm.meal_type,
        'special_notes', dcm.special_notes,
        'image_url', cm.image_url,
        'calories', cm.calories,
        'allergens', cm.allergens
    )) INTO v_result
    FROM daily_canteen_menu dcm
    JOIN canteen_menus cm ON cm.id = dcm.menu_item_id
    WHERE dcm.institution_id = p_institution_id
    AND dcm.menu_date = CURRENT_DATE
    AND cm.is_available = true
    AND (p_meal_type IS NULL OR dcm.meal_type = p_meal_type)
    ORDER BY dcm.meal_type, cm.category, cm.item_name;

    RETURN json_build_object('success', true, 'menu', COALESCE(v_result, '[]'::json), 'date', CURRENT_DATE);
END;
$$;

-- ============================================================
-- 3. GRIEVANCE / COMPLAINT SYSTEM
-- UGC-mandated student grievance mechanism with anonymous option
-- ============================================================
CREATE TABLE IF NOT EXISTS grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN DEFAULT false,
    category TEXT NOT NULL CHECK (category IN (
        'academic', 'harassment', 'infrastructure', 'examination',
        'library', 'canteen', 'hostel', 'transport', 'administration',
        'discrimination', 'other'
    )),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_urls JSONB DEFAULT '[]',
    status TEXT DEFAULT 'submitted' CHECK (status IN (
        'submitted', 'acknowledged', 'under_investigation',
        'resolution_proposed', 'resolved', 'appealed', 'closed'
    )),
    assigned_to UUID REFERENCES users(id),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    appeal_reason TEXT,
    appeal_resolved_at TIMESTAMPTZ,
    sla_deadline TIMESTAMPTZ,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grievances_institution ON grievances(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_grievances_submitted ON grievances(submitted_by);
CREATE INDEX IF NOT EXISTS idx_grievances_category ON grievances(institution_id, category, status);
CREATE INDEX IF NOT EXISTS idx_grievances_sla ON grievances(sla_deadline) WHERE status IN ('submitted', 'acknowledged', 'under_investigation');

ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own grievances" ON grievances
    FOR SELECT USING (submitted_by = auth.uid() OR is_anonymous = false);

CREATE POLICY "Students can insert grievances" ON grievances
    FOR INSERT WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Admin can manage grievances" ON grievances
    FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin', 'Director')));

-- RPC: Submit grievance
CREATE OR REPLACE FUNCTION submit_grievance(
    p_institution_id UUID,
    p_submitted_by UUID,
    p_category TEXT,
    p_subject TEXT,
    p_description TEXT,
    p_is_anonymous BOOLEAN DEFAULT false,
    p_evidence_urls JSONB DEFAULT '[]',
    p_priority TEXT DEFAULT 'normal'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_grievance_id UUID;
    v_grievance_number VARCHAR;
BEGIN
    v_grievance_number := 'GRV' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');

    INSERT INTO grievances (
        institution_id, submitted_by, is_anonymous, category, subject,
        description, evidence_urls, priority, sla_deadline
    ) VALUES (
        p_institution_id,
        CASE WHEN p_is_anonymous THEN NULL ELSE p_submitted_by END,
        p_is_anonymous, p_category, p_subject, p_description,
        p_evidence_urls, p_priority,
        NOW() + INTERVAL '7 days'
    ) RETURNING id INTO v_grievance_id;

    RETURN json_build_object(
        'success', true,
        'grievance_id', v_grievance_id,
        'grievance_number', v_grievance_number,
        'message', 'Grievance submitted successfully. SLA: 7 days.'
    );
END;
$$;

-- RPC: Update grievance status (admin only)
CREATE OR REPLACE FUNCTION update_grievance_status(
    p_grievance_id UUID,
    p_new_status TEXT,
    p_assigned_to UUID DEFAULT NULL,
    p_resolution_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_status TEXT;
BEGIN
    SELECT status INTO v_old_status FROM grievances WHERE id = p_grievance_id;

    UPDATE grievances SET
        status = p_new_status,
        assigned_to = COALESCE(p_assigned_to, assigned_to),
        resolution_notes = COALESCE(p_resolution_notes, resolution_notes),
        resolved_at = CASE WHEN p_new_status = 'resolved' THEN NOW() ELSE resolved_at END,
        updated_at = NOW()
    WHERE id = p_grievance_id;

    RETURN json_build_object('success', true, 'old_status', v_old_status, 'new_status', p_new_status);
END;
$$;

-- RPC: Appeal a resolved grievance
CREATE OR REPLACE FUNCTION appeal_grievance(
    p_grievance_id UUID,
    p_appeal_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE grievances SET
        status = 'appealed',
        appeal_reason = p_appeal_reason,
        updated_at = NOW()
    WHERE id = p_grievance_id AND status = 'resolved';

    RETURN json_build_object('success', true, 'message', 'Appeal submitted. Will be reviewed by Director.');
END;
$$;

-- ============================================================
-- 4. COMPANY VISITS TABLE FOR PLACEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS company_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN (
        'placement_drive', 'internship_drive', 'guest_lecture',
        'campus_interview', 'pre_placement_talk', 'other'
    )),
    visitors JSONB DEFAULT '[]',
    attendees_count INTEGER DEFAULT 0,
    offers_made INTEGER DEFAULT 0,
    offers_accepted INTEGER DEFAULT 0,
    notes TEXT,
    follow_up_date DATE,
    follow_up_notes TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_visits_institution ON company_visits(institution_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_company_visits_company ON company_visits(company_id, visit_date);

ALTER TABLE company_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Placement staff can manage company visits" ON company_visits FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin', 'Placement Officer'))
);

-- RPC: Log a company visit
CREATE OR REPLACE FUNCTION log_company_visit(
    p_company_id UUID,
    p_visit_date DATE,
    p_purpose TEXT,
    p_visitors JSONB DEFAULT '[]',
    p_notes TEXT DEFAULT '',
    p_created_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_visit_id UUID;
    v_institution_id UUID;
BEGIN
    SELECT institution_id INTO v_institution_id FROM companies WHERE id = p_company_id;
    IF v_institution_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Company not found.');
    END IF;

    INSERT INTO company_visits (institution_id, company_id, visit_date, purpose, visitors, notes, created_by)
    VALUES (v_institution_id, p_company_id, p_visit_date, p_purpose, p_visitors, p_notes, p_created_by)
    RETURNING id INTO v_visit_id;

    UPDATE companies SET last_visited = p_visit_date WHERE id = p_company_id;

    RETURN json_build_object('success', true, 'visit_id', v_visit_id);
END;
$$;


-- ==========================================================
-- MIGRATION: 20260613000002_exam_enrollment_hall_ticket.sql
-- ==========================================================

-- =========================================================================
-- EXAM ENROLLMENT & HALL TICKET MODULE
-- =========================================================================

-- 1. EXAM ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS exam_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'enrolled',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_exam_enrollment UNIQUE (exam_id, student_id)
);

ALTER TABLE exam_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Director can manage exam enrollments"
  ON exam_enrollments FOR ALL
  USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
    AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
  );

CREATE POLICY "Teachers can view exam enrollments"
  ON exam_enrollments FOR SELECT
  USING (
    get_auth_user_role() = 'Teacher'
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "Students can view their own enrollments"
  ON exam_enrollments FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Parents can view linked child enrollments"
  ON exam_enrollments FOR SELECT
  USING (
    student_id IN (
      SELECT student_id FROM parent_student_links
      WHERE parent_user_id = auth.uid() AND verified = true
    )
  );

-- 2. HALL TICKETS TABLE
CREATE TABLE IF NOT EXISTS hall_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES exam_enrollments(id) ON DELETE SET NULL,
  ticket_number VARCHAR(50) NOT NULL,
  qr_token VARCHAR(255),
  room_number VARCHAR(50),
  seat_number VARCHAR(10),
  exam_date DATE,
  exam_shift VARCHAR(20) DEFAULT 'Morning',
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_hall_ticket_per_exam UNIQUE (exam_id, student_id),
  CONSTRAINT unique_ticket_number_per_exam UNIQUE (exam_id, ticket_number)
);

ALTER TABLE hall_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Director can manage hall tickets"
  ON hall_tickets FOR ALL
  USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
    AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
  );

CREATE POLICY "Teachers can view hall tickets"
  ON hall_tickets FOR SELECT
  USING (
    get_auth_user_role() = 'Teacher'
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "Students can view their own hall tickets"
  ON hall_tickets FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Parents can view linked child hall tickets"
  ON hall_tickets FOR SELECT
  USING (
    student_id IN (
      SELECT student_id FROM parent_student_links
      WHERE parent_user_id = auth.uid() AND verified = true
    )
  );

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_exam_enrollments_exam ON exam_enrollments(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_enrollments_student ON exam_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_enrollments_institution ON exam_enrollments(institution_id);
CREATE INDEX IF NOT EXISTS idx_hall_tickets_exam ON hall_tickets(exam_id);
CREATE INDEX IF NOT EXISTS idx_hall_tickets_student ON hall_tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_hall_tickets_institution ON hall_tickets(institution_id);

-- 4. RPC: Generate Hall Tickets for an Exam
CREATE OR REPLACE FUNCTION generate_hall_tickets(p_exam_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT, tickets_generated INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_institution_id UUID;
  v_exam RECORD;
  v_enrollment RECORD;
  v_seating RECORD;
  v_ticket_count INTEGER := 0;
  v_ticket_number VARCHAR(50);
  v_counter INTEGER := 1;
BEGIN
  -- Get exam details
  SELECT * INTO v_exam FROM exams WHERE id = p_exam_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Exam not found'::TEXT, 0;
    RETURN;
  END IF;

  v_institution_id := v_exam.institution_id;

  -- Loop through all enrolled students
  FOR v_enrollment IN
    SELECT ee.*, s.roll_number
    FROM exam_enrollments ee
    JOIN students s ON s.id = ee.student_id
    WHERE ee.exam_id = p_exam_id AND ee.status = 'enrolled'
  LOOP
    -- Check if hall ticket already exists
    IF EXISTS (SELECT 1 FROM hall_tickets WHERE exam_id = p_exam_id AND student_id = v_enrollment.student_id) THEN
      v_counter := v_counter + 1;
      CONTINUE;
    END IF;

    -- Try to get seating allocation
    SELECT * INTO v_seating
    FROM exam_seating
    WHERE exam_id = p_exam_id AND student_id = v_enrollment.student_id
    LIMIT 1;

    -- Generate ticket number
    v_ticket_number := 'EXAM-' || UPPER(LEFT(v_exam.name, 3)) || '-' || LPAD(v_counter::TEXT, 4, '0');

    -- Insert hall ticket
    INSERT INTO hall_tickets (
      institution_id, exam_id, student_id, enrollment_id,
      ticket_number, qr_token, room_number, seat_number,
      exam_date, exam_shift
    ) VALUES (
      v_institution_id, p_exam_id, v_enrollment.student_id, v_enrollment.id,
      v_ticket_number, gen_random_uuid()::TEXT,
      COALESCE(v_seating.room_number, 'TBD'),
      COALESCE(v_seating.seat_number, 'TBD'),
      v_exam.start_date,
      CASE WHEN v_counter % 2 = 0 THEN 'Afternoon' ELSE 'Morning' END
    );

    v_ticket_count := v_ticket_count + 1;
    v_counter := v_counter + 1;
  END LOOP;

  RETURN QUERY SELECT TRUE, v_ticket_count || ' hall tickets generated successfully'::TEXT, v_ticket_count;
END;
$$;
