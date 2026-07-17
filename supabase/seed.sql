-- IRIS 365 Seed Data Script
-- Platform: Multi-tenant Campus Management System
-- Target: Supabase (PostgreSQL)

-- Clean up existing seed data (optional, but good for repeatable runs)
-- We truncate tables in reverse order of foreign key dependencies.
-- (This is a seed script for clean setups. We use TRUNCATE with CASCADE or just DELETE)
DELETE FROM ai_query_logs;
DELETE FROM ai_conversations;
DELETE FROM notification_logs;
DELETE FROM notifications;
DELETE FROM security_incidents;
DELETE FROM visitor_logs;
DELETE FROM gate_logs;
DELETE FROM transport_subscriptions;
DELETE FROM bus_tracking;
DELETE FROM buses;
DELETE FROM bus_routes;
DELETE FROM equipment_logs;
DELETE FROM gym_memberships;
DELETE FROM gym_bookings;
DELETE FROM gym_slots;
DELETE FROM event_sponsors;
DELETE FROM event_volunteers;
DELETE FROM event_registrations;
DELETE FROM events;
DELETE FROM study_room_bookings;
DELETE FROM book_issues;
DELETE FROM books;
DELETE FROM hostel_complaints;
DELETE FROM hostel_allocations;
DELETE FROM hostel_rooms;
DELETE FROM hostel_blocks;
DELETE FROM meal_subscriptions;
DELETE FROM canteen_orders;
DELETE FROM canteen_wallets;
DELETE FROM canteen_menus;
DELETE FROM exam_results;
DELETE FROM exams;
DELETE FROM notices;
DELETE FROM fee_reminders;
DELETE FROM fee_payments;
DELETE FROM fee_structures;
DELETE FROM timetable;
DELETE FROM attendance;
DELETE FROM attendance_sessions;
DELETE FROM staff;
DELETE FROM students;
DELETE FROM departments;
DELETE FROM users;
DELETE FROM institutions;

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

-- 2. USERS (9 roles represented)
-- SuperAdmin
INSERT INTO users (id, institution_id, role, name, email, phone, employee_id, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'SuperAdmin',
    'Siddharth Singh',
    'siddharth@sin.education',
    '+919876543210',
    'SIN-SA-001',
    TRUE
);

-- Admin (Director)
INSERT INTO users (id, institution_id, role, name, email, phone, employee_id, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Admin',
    'Dr. K. R. Sharma',
    'director@siet.edu.in',
    '+919876543211',
    'SIET-DIR-002',
    TRUE
);

-- Staff (Professor CSE)
INSERT INTO users (id, institution_id, role, name, email, phone, employee_id, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Staff',
    'Prof. Alok Vyas',
    'alok.vyas@siet.edu.in',
    '+919876543212',
    'SIET-CSE-003',
    TRUE
);

-- Staff (Professor ECE)
INSERT INTO users (id, institution_id, role, name, email, phone, employee_id, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Staff',
    'Dr. Preeti Choudhary',
    'preeti.c@siet.edu.in',
    '+919876543213',
    'SIET-ECE-004',
    TRUE
);

-- Staff (Physical Trainer / Gym)
INSERT INTO users (id, institution_id, role, name, email, phone, employee_id, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'Staff',
    'Coach Amit Rathi',
    'amit.rathi@siet.edu.in',
    '+919876543214',
    'SIET-GYM-005',
    TRUE
);

-- Student 1 (Khushal - Primary Student for dashboard view)
INSERT INTO users (id, institution_id, role, name, email, phone, avatar_url, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    'Student',
    'Khushal Gehlot',
    'khushal@gmail.com',
    '+919999988888',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop',
    TRUE
);

-- Student 2
INSERT INTO users (id, institution_id, role, name, email, phone, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000001',
    'Student',
    'Aarav Mehta',
    'aarav.mehta@siet.edu.in',
    '+919999988887',
    TRUE
);

-- Student 3
INSERT INTO users (id, institution_id, role, name, email, phone, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000001',
    'Student',
    'Aditi Bhati',
    'aditi.b@siet.edu.in',
    '+919999988886',
    TRUE
);

-- Student 4
INSERT INTO users (id, institution_id, role, name, email, phone, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000001',
    'Student',
    'Rahul Sen',
    'rahul.sen@siet.edu.in',
    '+919999988885',
    TRUE
);

-- Student 5
INSERT INTO users (id, institution_id, role, name, email, phone, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000001',
    'Student',
    'Sneha Goyal',
    'sneha.g@siet.edu.in',
    '+919999988884',
    TRUE
);

-- Parent
INSERT INTO users (id, institution_id, role, name, email, phone, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000001',
    'Parent',
    'Mr. Madanlal Gehlot',
    'madanlal@gmail.com',
    '+919829012345',
    TRUE
);

-- Warden
INSERT INTO users (id, institution_id, role, name, email, phone, employee_id, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000001',
    'Warden',
    'Jaswant Singh',
    'warden@siet.edu.in',
    '+919829012346',
    'SIET-WDN-012',
    TRUE
);

-- Driver
INSERT INTO users (id, institution_id, role, name, email, phone, employee_id, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000013',
    'a0000000-0000-0000-0000-000000000001',
    'Driver',
    'Rajesh Kumar',
    'rajesh.driver@siet.edu.in',
    '+919829012347',
    'SIET-DVR-013',
    TRUE
);

-- Vendor
INSERT INTO users (id, institution_id, role, name, email, phone, employee_id, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000014',
    'a0000000-0000-0000-0000-000000000001',
    'Vendor',
    'Ramesh Canteen Wale',
    'canteen@siet.edu.in',
    '+919829012348',
    'SIET-VND-014',
    TRUE
);

-- Security
INSERT INTO users (id, institution_id, role, name, email, phone, employee_id, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000015',
    'a0000000-0000-0000-0000-000000000001',
    'Security',
    'Guard Sher Singh',
    'security@siet.edu.in',
    '+919829012349',
    'SIET-SEC-015',
    TRUE
);

-- Sandbox Applicant
INSERT INTO users (id, institution_id, role, name, email, phone, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000029',
    'a0000000-0000-0000-0000-000000000001',
    'Applicant',
    'Applicant User',
    'applicant@sin.education',
    '+919876543210',
    TRUE
);


-- 3. DEPARTMENTS
INSERT INTO departments (id, institution_id, name, head_id)
VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Computer Science & Engineering',
    'b0000000-0000-0000-0000-000000000003'
);

INSERT INTO departments (id, institution_id, name, head_id)
VALUES (
    'd0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Electronics & Communication Engineering',
    'b0000000-0000-0000-0000-000000000004'
);

INSERT INTO departments (id, institution_id, name, head_id)
VALUES (
    'd0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Mechanical Engineering',
    NULL
);

-- 4. STUDENTS
INSERT INTO students (id, user_id, institution_id, roll_number, department_id, semester, batch_year, dob, gender, blood_group, guardian_name, guardian_phone, address)
VALUES (
    'c0000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    '23CSE051',
    'd0000000-0000-0000-0000-000000000001',
    4,
    '2022-2026',
    '2004-05-15',
    'Male',
    'O+',
    'Mr. Madanlal Gehlot',
    '+919829012345',
    'Sardarpura 4th Road, Jodhpur'
);

INSERT INTO students (id, user_id, institution_id, roll_number, department_id, semester, batch_year, dob, gender, blood_group, guardian_name, guardian_phone, address)
VALUES (
    'c0000000-0000-0000-0000-000000000007',
    'b0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000001',
    '23CSE052',
    'd0000000-0000-0000-0000-000000000001',
    4,
    '2022-2026',
    '2004-09-20',
    'Male',
    'A+',
    'Suresh Mehta',
    '+919990001112',
    'Shastri Nagar, Jodhpur'
);

INSERT INTO students (id, user_id, institution_id, roll_number, department_id, semester, batch_year, dob, gender, blood_group, guardian_name, guardian_phone, address)
VALUES (
    'c0000000-0000-0000-0000-000000000008',
    'b0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000001',
    '23ECE012',
    'd0000000-0000-0000-0000-000000000002',
    4,
    '2022-2026',
    '2005-01-08',
    'Female',
    'B+',
    'Prakash Bhati',
    '+919990001113',
    'Mandore Road, Jodhpur'
);

INSERT INTO students (id, user_id, institution_id, roll_number, department_id, semester, batch_year, dob, gender, blood_group, guardian_name, guardian_phone, address)
VALUES (
    'c0000000-0000-0000-0000-000000000009',
    'b0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000001',
    '23ME005',
    'd0000000-0000-0000-0000-000000000003',
    4,
    '2022-2026',
    '2004-12-11',
    'Male',
    'AB+',
    'Rajendra Sen',
    '+919990001114',
    'Basni, Jodhpur'
);

INSERT INTO students (id, user_id, institution_id, roll_number, department_id, semester, batch_year, dob, gender, blood_group, guardian_name, guardian_phone, address)
VALUES (
    'c0000000-0000-0000-0000-000000000010',
    'b0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000001',
    '23CSE015',
    'd0000000-0000-0000-0000-000000000001',
    4,
    '2022-2026',
    '2005-03-30',
    'Female',
    'O-',
    'Kishore Goyal',
    '+919990001115',
    'Paota, Jodhpur'
);

-- 5. STAFF
INSERT INTO staff (id, user_id, institution_id, department_id, designation, joining_date, salary, qualification)
VALUES (
    'd0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Professor & HOD',
    '2015-07-01',
    120000.00,
    'Ph.D. in Computer Science & Engineering'
);

INSERT INTO staff (id, user_id, institution_id, department_id, designation, joining_date, salary, qualification)
VALUES (
    'd0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    'Associate Professor & HOD',
    '2018-01-10',
    95000.00,
    'Ph.D. in VLSI Systems'
);

INSERT INTO staff (id, user_id, institution_id, department_id, designation, joining_date, salary, qualification)
VALUES (
    'd0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    NULL,
    'Fitness Trainer & Gym Incharge',
    '2021-08-20',
    45000.00,
    'Master of Physical Education (M.P.Ed)'
);

-- 6. ATTENDANCE SESSIONS
INSERT INTO attendance_sessions (id, institution_id, department_id, subject, date, time_slot, marked_by)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Database Management Systems',
    CURRENT_DATE,
    '09:00 - 10:00',
    'b0000000-0000-0000-0000-000000000003'
);

INSERT INTO attendance_sessions (id, institution_id, department_id, subject, date, time_slot, marked_by)
VALUES (
    'e0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Compiler Design',
    CURRENT_DATE,
    '10:15 - 11:15',
    'b0000000-0000-0000-0000-000000000003'
);

-- 7. ATTENDANCE LOGS
-- Session 1 (DBMS) - Present students
INSERT INTO attendance (institution_id, student_id, session_id, date, status, marked_by, method)
VALUES ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000001', CURRENT_DATE, 'Present', 'b0000000-0000-0000-0000-000000000003', 'QR');
INSERT INTO attendance (institution_id, student_id, session_id, date, status, marked_by, method)
VALUES ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000001', CURRENT_DATE, 'Present', 'b0000000-0000-0000-0000-000000000003', 'QR');
INSERT INTO attendance (institution_id, student_id, session_id, date, status, marked_by, method)
VALUES ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000001', CURRENT_DATE, 'Absent', 'b0000000-0000-0000-0000-000000000003', 'Manual');

-- Session 2 (Compiler)
INSERT INTO attendance (institution_id, student_id, session_id, date, status, marked_by, method)
VALUES ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000002', CURRENT_DATE, 'Present', 'b0000000-0000-0000-0000-000000000003', 'QR');
INSERT INTO attendance (institution_id, student_id, session_id, date, status, marked_by, method)
VALUES ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000002', CURRENT_DATE, 'Present', 'b0000000-0000-0000-0000-000000000003', 'QR');
INSERT INTO attendance (institution_id, student_id, session_id, date, status, marked_by, method)
VALUES ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000002', CURRENT_DATE, 'Present', 'b0000000-0000-0000-0000-000000000003', 'QR');

-- 8. TIMETABLE
-- Monday slots
INSERT INTO timetable (institution_id, department_id, day_of_week, time_slot, subject, teacher_id, room)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Monday',
    '09:00 - 10:00',
    'Database Management Systems',
    'd0000000-0000-0000-0000-000000000003',
    'L-301'
);
INSERT INTO timetable (institution_id, department_id, day_of_week, time_slot, subject, teacher_id, room)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Monday',
    '10:15 - 11:15',
    'Compiler Design',
    'd0000000-0000-0000-0000-000000000003',
    'L-301'
);
INSERT INTO timetable (institution_id, department_id, day_of_week, time_slot, subject, teacher_id, room)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Monday',
    '11:30 - 12:30',
    'Computer Networks',
    'd0000000-0000-0000-0000-000000000004',
    'Lab-2'
);

-- 9. FEE STRUCTURES
INSERT INTO fee_structures (id, institution_id, name, amount, due_date, applicable_to)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Academic Tuition Fee - Sem 4',
    65000.00,
    CURRENT_DATE + INTERVAL '30 days',
    'All'
);

INSERT INTO fee_structures (id, institution_id, name, amount, due_date, applicable_to)
VALUES (
    'f0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Hostel Room & Mess Charges',
    45000.00,
    CURRENT_DATE - INTERVAL '5 days', -- Overdue
    'All'
);

-- 10. FEE PAYMENTS
-- Tuition paid by Khushal
INSERT INTO fee_payments (institution_id, student_id, fee_structure_id, amount_paid, payment_date, method, transaction_id, status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000006',
    'f0000000-0000-0000-0000-000000000001',
    65000.00,
    CURRENT_DATE - INTERVAL '15 days',
    'UPI',
    'TXN_UPI_987654321',
    'Completed'
);

-- Hostel fee remains Pending for Khushal (to show overdue alert in Director dashboard/Student Fees tab)

-- 12. NOTICES
INSERT INTO notices (institution_id, title, content, category, target_audience, published_by)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Internal Assessment Schedules',
    'The first internal test series for Semester 4 will commence from Monday next week. Attendance is mandatory.',
    'Academic',
    'Students',
    'b0000000-0000-0000-0000-000000000002'
);

-- 15. CANTEEN MENUS
INSERT INTO canteen_menus (id, institution_id, item_name, category, price, is_available, allergens, calories)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Paneer Butter Masala Combo',
    'Meals',
    120.00,
    TRUE,
    'Dairy, Gluten',
    580
);

INSERT INTO canteen_menus (id, institution_id, item_name, category, price, is_available, allergens, calories)
VALUES (
    '10000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Veg Hakka Noodles',
    'Meals',
    80.00,
    TRUE,
    'Soya, Gluten',
    420
);

INSERT INTO canteen_menus (id, institution_id, item_name, category, price, is_available, allergens, calories)
VALUES (
    '10000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Cold Coffee Brew',
    'Beverages',
    50.00,
    TRUE,
    'Dairy',
    220
);

-- 16. CANTEEN WALLETS
INSERT INTO canteen_wallets (institution_id, student_id, balance)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000006',
    450.00
);
INSERT INTO canteen_wallets (institution_id, student_id, balance)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000007',
    120.00
);

-- 17. CANTEEN ORDERS
INSERT INTO canteen_orders (institution_id, student_id, items, total_amount, status, payment_method)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000006',
    '[{"menu_id": "10000000-0000-0000-0000-000000000001", "qty": 1}, {"menu_id": "10000000-0000-0000-0000-000000000003", "qty": 1}]'::jsonb,
    170.00,
    'Delivered',
    'Wallet'
);

-- 19. HOSTEL BLOCKS
INSERT INTO hostel_blocks (id, institution_id, name, type, total_rooms, warden_id)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Ramanujan Hostel (Boys Block A)',
    'Boys',
    5,
    'b0000000-0000-0000-0000-000000000012'
);

-- 20. HOSTEL ROOMS
INSERT INTO hostel_rooms (id, institution_id, block_id, room_number, capacity, occupied, amenities)
VALUES (
    '50000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'A-101',
    2,
    1,
    'AC, Double Bed, Study Table, Attached Bathroom'
);

INSERT INTO hostel_rooms (id, institution_id, block_id, room_number, capacity, occupied, amenities)
VALUES (
    '50000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'A-102',
    2,
    1,
    'Non-AC, Double Bed, Study Table, Attached Balcony'
);

-- 21. HOSTEL ALLOCATIONS
INSERT INTO hostel_allocations (institution_id, room_id, student_id, allotted_date, is_current)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000006', -- Khushal in Room A-101
    '2023-07-15',
    TRUE
);

INSERT INTO hostel_allocations (institution_id, room_id, student_id, allotted_date, is_current)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000007', -- Aarav in Room A-102
    '2023-07-15',
    TRUE
);

-- 22. HOSTEL COMPLAINTS
INSERT INTO hostel_complaints (institution_id, student_id, room_id, category, description, status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000006',
    '50000000-0000-0000-0000-000000000001',
    'Electrical',
    'Ceiling fan making clicking sound on speed 4',
    'Open'
);

-- 24. BOOKS (10 books for Library module)
INSERT INTO books (id, institution_id, isbn, title, author, category, publisher, copies_total, copies_available, shelf_location)
VALUES
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
-- Khushal has issued The C Programming Language (overdue) and Clean Code (issued)
INSERT INTO book_issues (id, institution_id, book_id, student_id, issue_date, due_date, status)
VALUES (
    '40000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001', -- The C Programming
    'c0000000-0000-0000-0000-000000000006', -- Khushal
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE - INTERVAL '6 days', -- 6 days late
    'Issued'
);

INSERT INTO book_issues (id, institution_id, book_id, student_id, issue_date, due_date, status)
VALUES (
    '40000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000005', -- Clean Code
    'c0000000-0000-0000-0000-000000000006', -- Khushal
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '12 days',
    'Issued'
);

-- 27. EVENTS
INSERT INTO events (id, institution_id, title, description, category, venue, start_datetime, end_datetime, max_participants, created_by, status)
VALUES (
    '90000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'SIN Hackathon Jodhpur 2026',
    'A 36-hour regional level hackathon to solve problems in edtech, healthtech, and logistics. Hosted by SIN Education & Technology Pvt. Ltd.',
    'Tech',
    'Seminar Hall B, SIET',
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    150,
    'b0000000-0000-0000-0000-000000000002',
    'Scheduled'
);

INSERT INTO events (id, institution_id, title, description, category, venue, start_datetime, end_datetime, max_participants, created_by, status)
VALUES (
    '90000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Spandan 2026 - Cultural Festival',
    'The annual mega cultural event of Jodhpur featuring rock band shows, street plays, and classical dance competitions.',
    'Cultural',
    'Main Open Air Auditorium',
    CURRENT_TIMESTAMP + INTERVAL '10 days',
    CURRENT_TIMESTAMP + INTERVAL '12 days',
    1000,
    'b0000000-0000-0000-0000-000000000002',
    'Scheduled'
);

-- 28. EVENT REGISTRATIONS
-- Khushal registered for SIN Hackathon
INSERT INTO event_registrations (institution_id, event_id, student_id, ticket_number, payment_status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000006',
    'TKT-SIN-HACK-8891',
    'Completed'
);

-- 31. GYM SLOTS (4 slots for gym booking)
INSERT INTO gym_slots (id, institution_id, date, start_time, end_time, capacity, trainer_id, booked_count)
VALUES (
    '60000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    CURRENT_DATE + INTERVAL '1 day',
    '06:00:00',
    '07:00:00',
    20,
    'd0000000-0000-0000-0000-000000000005',
    1
);

INSERT INTO gym_slots (id, institution_id, date, start_time, end_time, capacity, trainer_id, booked_count)
VALUES (
    '60000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    CURRENT_DATE + INTERVAL '1 day',
    '07:15:00',
    '08:15:00',
    20,
    'd0000000-0000-0000-0000-000000000005',
    0
);

INSERT INTO gym_slots (id, institution_id, date, start_time, end_time, capacity, trainer_id, booked_count)
VALUES (
    '60000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    CURRENT_DATE + INTERVAL '1 day',
    '17:00:00',
    '18:00:00',
    25,
    'd0000000-0000-0000-0000-000000000005',
    2
);

INSERT INTO gym_slots (id, institution_id, date, start_time, end_time, capacity, trainer_id, booked_count)
VALUES (
    '60000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    CURRENT_DATE + INTERVAL '1 day',
    '18:15:00',
    '19:15:00',
    25,
    'd0000000-0000-0000-0000-000000000005',
    0
);

-- 33. GYM MEMBERSHIPS
-- Khushal is an active member
INSERT INTO gym_memberships (institution_id, student_id, plan, start_date, end_date, amount_paid, status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000006',
    'Quarterly',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '80 days',
    3500.00,
    'Active'
);

-- 32. GYM BOOKINGS
-- Khushal booked slot 1
INSERT INTO gym_bookings (institution_id, slot_id, student_id, booking_date, status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000006',
    CURRENT_DATE + INTERVAL '1 day',
    'Booked'
);

-- 34. EQUIPMENT LOGS
INSERT INTO equipment_logs (institution_id, equipment_name, condition, last_serviced, next_service)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Aerobic Treadmill MT-900',
    'Good',
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE + INTERVAL '40 days'
);
INSERT INTO equipment_logs (institution_id, equipment_name, condition, last_serviced, next_service)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Rowing Machine R2',
    'Repair',
    CURRENT_DATE - INTERVAL '90 days',
    CURRENT_DATE - INTERVAL '5 days' -- Overdue service
);

-- 35. BUS ROUTES (2 routes)
INSERT INTO bus_routes (id, institution_id, name, stops, schedule)
VALUES (
    '70000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Route A: Sardarpura - Chopasni - SIET Campus',
    '[
      {"name": "Sardarpura Gol Building", "time": "07:30 AM"},
      {"name": "Chopasni Housing Board", "time": "07:55 AM"},
      {"name": "Dhanasni Crossing", "time": "08:15 AM"},
      {"name": "SIET Main Gate", "time": "08:35 AM"}
    ]'::jsonb,
    'Daily: Mon to Sat'
);

INSERT INTO bus_routes (id, institution_id, name, stops, schedule)
VALUES (
    '70000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Route B: Paota - Circuit House - Ratanada - SIET Campus',
    '[
      {"name": "Paota Circle", "time": "07:40 AM"},
      {"name": "Circuit House Choraha", "time": "07:50 AM"},
      {"name": "Ratanada Shiv Temple", "time": "08:05 AM"},
      {"name": "SIET Main Gate", "time": "08:35 AM"}
    ]'::jsonb,
    'Daily: Mon to Sat'
);

-- 36. BUSES
INSERT INTO buses (id, institution_id, vehicle_number, capacity, driver_id, route_id, device_id)
VALUES (
    '80000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'RJ19-PA-1024',
    42,
    'b0000000-0000-0000-0000-000000000013', -- Driver Rajesh
    '70000000-0000-0000-0000-000000000001', -- Route A
    'GPS-RJ19-PA-1024'
);

-- 37. BUS TRACKING (Initial location)
INSERT INTO bus_tracking (institution_id, bus_id, latitude, longitude, speed)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '80000000-0000-0000-0000-000000000001',
    26.2908, -- Jodhpur lat
    73.0243, -- Jodhpur long
    45.50
);

-- 38. TRANSPORT SUBSCRIPTIONS
-- Khushal is subscribed to Route A
INSERT INTO transport_subscriptions (institution_id, student_id, route_id, start_date, end_date, amount_paid)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000006',
    '70000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '170 days',
    12000.00
);

-- 39. GATE LOGS
-- Active IN entry for Khushal (entered 1.5 hours ago, out_time is null)
INSERT INTO gate_logs (institution_id, person_id, person_type, entry_type, in_time, out_time, method, gate_number)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000006', -- Khushal
    'Student',
    'IN',
    CURRENT_TIMESTAMP - INTERVAL '90 minutes',
    NULL,
    'RFID',
    'Gate 1'
);

-- 42. NOTIFICATIONS (For Student dashboard inbox)
INSERT INTO notifications (institution_id, user_id, title, body, type, is_read)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000006', -- Khushal
    'Hostel Gate Pass Approved',
    'Your gate pass for visiting local market on Saturday has been approved by the Warden.',
    'Info',
    FALSE
);

INSERT INTO notifications (institution_id, user_id, title, body, type, is_read)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000006', -- Khushal
    'Library Fine Pending',
    'You have an overdue library book "The C Programming Language" which has accrued standard fines of 5 INR/day.',
    'Alert',
    FALSE
);
