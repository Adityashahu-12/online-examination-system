-- =============================================================================
-- Online Examination Management System (ExamHub)
-- PostgreSQL 16 DDL & Verified Seed Data with btree_gist Exclusion Constraint
-- =============================================================================

-- Enable required extension for temporal exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'User',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(150) UNIQUE NOT NULL,
    contact_person VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT
);

-- 4. EXAM CENTERS TABLE
CREATE TABLE IF NOT EXISTS exam_centers (
    center_id SERIAL PRIMARY KEY,
    center_name VARCHAR(150) UNIQUE NOT NULL,
    center_type VARCHAR(50) NOT NULL DEFAULT 'Campus Lab',
    description TEXT,
    active_status BOOLEAN NOT NULL DEFAULT TRUE
);

-- 5. EXAMS TABLE
CREATE TABLE IF NOT EXISTS exams (
    exam_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    department_id INTEGER NOT NULL REFERENCES departments(department_id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. SCHEDULES TABLE WITH POSTGRESQL EXCLUSION CONSTRAINT
CREATE TABLE IF NOT EXISTS schedules (
    schedule_id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
    center_id INTEGER NOT NULL REFERENCES exam_centers(center_id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_time_order CHECK (start_time < end_time),
    CONSTRAINT no_overlap EXCLUDE USING gist (
        center_id WITH =,
        daterange(exam_date, exam_date, '[]') WITH &&
    ) WHERE (status <> 'Cancelled')
);

-- =============================================================================
-- SEED DATA (Populated if tables are empty)
-- =============================================================================

INSERT INTO users (full_name, email, password_hash, role)
SELECT 'Aryan Kajne', 'admin@examhub.local', 'scrypt:32768:8:1$demo$defaultpasswordhash', 'Admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@examhub.local');

INSERT INTO departments (department_name, contact_person, email, phone, address)
SELECT * FROM (VALUES
    ('Department of Information Technology', 'Dr. Rajesh Kapoor', 'it@college.ac.in', '9876543210', 'Block A, Room 201'),
    ('Department of Computer Science', 'Dr. Sunita Agarwal', 'cse@college.ac.in', '9876543211', 'Block A, Room 301'),
    ('Department of AI and Data Science', 'Dr. K. Rajendran', 'aids@college.ac.in', '9876543212', 'Block B, Room 102'),
    ('Department of Electronics & TC', 'Dr. Prannoy Roy', 'etc@college.ac.in', '9876543213', 'Block C, Room 205'),
    ('Department of Mechanical Engg', 'Dr. Nikhil Advani', 'mech@college.ac.in', '9876543214', 'Workshop Complex W1')
) AS v(dept_name, contact, email, phone, addr)
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name = v.dept_name);

INSERT INTO subjects (subject_name, description)
SELECT * FROM (VALUES
    ('Database Management Systems', 'Relational models, SQL, Normalization, ACID and indexing'),
    ('Data Structures & Algorithms', 'Stacks, Queues, Trees, Graphs, Sorting and Dynamic Programming'),
    ('Operating Systems', 'Process synchronization, memory management, threads and file systems'),
    ('Computer Networks', 'OSI model, TCP/IP, routing algorithms and socket programming'),
    ('Cyber Security', 'Cryptography, Network Security, Ethical Hacking and Protocols'),
    ('Artificial Intelligence', 'Heuristic search, logic programming, planning and game theory'),
    ('Compiler Design', 'Lexical analysis, syntax trees, parsing techniques and code generation'),
    ('Discrete Mathematics', 'Set theory, graph theory, combinatorics and predicate logic'),
    ('IoT & Embedded Systems', 'Sensors, microcontrollers, embedded C and wireless mesh')
) AS v(subj_name, descr)
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE subject_name = v.subj_name);

INSERT INTO exam_centers (center_name, center_type, description, active_status)
SELECT * FROM (VALUES
    ('Turing Computer Center Lab 101', 'Campus Lab', 'High-performance lab with 60 workstations', TRUE),
    ('Babbage Computing Lab 202', 'Campus Lab', 'Equipped with dual-monitor developer stations', TRUE),
    ('Virtual Hall Alpha', 'Virtual Hall', 'Secure remote proctoring cluster with AI monitoring', TRUE),
    ('Aryabhata Lab 104', 'Campus Lab', 'General engineering computer laboratory', TRUE),
    ('Shannon Lab 301', 'Campus Lab', 'Advanced AI and multimedia laboratory', TRUE),
    ('Von Neumann Center 201', 'Campus Lab', 'Advanced networking and database lab', TRUE)
) AS v(ctr_name, ctr_type, descr, act)
WHERE NOT EXISTS (SELECT 1 FROM exam_centers WHERE center_name = v.ctr_name);

INSERT INTO exams (title, description, department_id, subject_id, duration_minutes, created_by)
SELECT * FROM (VALUES
    ('DBMS Mid-Semester Examination', 'Mid-term evaluation covering relational schema, SQL and 3NF', 1, 1, 90, 1),
    ('Data Structures Practical Exam', 'Live algorithmic implementation and time complexity defense', 2, 2, 90, 1),
    ('Operating Systems Term Test', 'Written exam on scheduling and paging algorithms', 1, 3, 90, 1),
    ('Computer Networks Final Viva', 'Assessment on OSI layers, subnetting and routing protocols', 4, 4, 60, 1),
    ('Cyber Security Quiz', 'Packet inspection, vulnerability scans and key generation', 1, 5, 90, 1),
    ('AI Mid-Term Examination', 'Heuristic search, Minimax and gradient descent', 2, 6, 90, 1)
) AS v(title, descr, did, sid, dur, uid)
WHERE NOT EXISTS (SELECT 1 FROM exams WHERE title = v.title);

INSERT INTO schedules (exam_id, center_id, exam_date, start_time, end_time, status)
SELECT * FROM (VALUES
    (1, 1, '2026-10-20'::DATE, '09:00'::TIME, '10:30'::TIME, 'Scheduled'),
    (2, 2, '2026-10-20'::DATE, '11:00'::TIME, '12:30'::TIME, 'Scheduled'),
    (3, 3, '2026-10-20'::DATE, '14:00'::TIME, '15:30'::TIME, 'Scheduled'),
    (4, 4, '2026-10-20'::DATE, '16:00'::TIME, '17:00'::TIME, 'Scheduled'),
    (5, 4, '2026-10-21'::DATE, '10:00'::TIME, '11:30'::TIME, 'Scheduled'),
    (6, 5, '2026-10-21'::DATE, '14:30'::TIME, '16:00'::TIME, 'Scheduled')
) AS v(eid, cid, edate, stime, etime, stat)
WHERE NOT EXISTS (SELECT 1 FROM schedules WHERE exam_id = v.eid AND center_id = v.cid AND exam_date = v.edate);

