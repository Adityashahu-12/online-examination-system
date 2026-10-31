-- =============================================================================
-- EXAMHUB - ONLINE EXAMINATION MANAGEMENT SYSTEM
-- Complete PostgreSQL 16 Normalized Relational Database Schema
-- Includes Core 6 Entities + 8 Extended Production Entities + Constraints
-- =============================================================================

-- Enable required extension for range exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- -----------------------------------------------------------------------------
-- 1. USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'Student' CHECK (role IN ('Admin', 'Faculty', 'Student')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- -----------------------------------------------------------------------------
-- 2. DEPARTMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    department_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    department_name VARCHAR(150) NOT NULL UNIQUE,
    department_code VARCHAR(20) UNIQUE,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. EXAM_CENTERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_centers (
    center_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    center_name VARCHAR(150) NOT NULL UNIQUE,
    center_type VARCHAR(50) NOT NULL CHECK (center_type IN (
        'Campus Lab', 'Virtual Hall', 'Proctored Center', 
        'Department Lab', 'Cloud Server', 'Regional Center'
    )),
    capacity INTEGER NOT NULL DEFAULT 60 CHECK (capacity > 0),
    description TEXT NOT NULL,
    active_status BOOLEAN NOT NULL DEFAULT TRUE
);

-- -----------------------------------------------------------------------------
-- 4. SUBJECTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
    subject_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL UNIQUE,
    subject_code VARCHAR(30) UNIQUE,
    description TEXT NOT NULL
);

-- -----------------------------------------------------------------------------
-- 5. STUDENT_PROFILES (Extended Entity 7)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_profiles (
    profile_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL UNIQUE, -- e.g. Roll No / UID: 24010024
    department_id INTEGER NOT NULL REFERENCES departments(department_id) ON DELETE RESTRICT,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-27',
    phone VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_dept ON student_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_sem ON student_profiles(semester);

-- -----------------------------------------------------------------------------
-- 6. EXAMS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exams (
    exam_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    department_id INTEGER NOT NULL REFERENCES departments(department_id) ON DELETE RESTRICT,
    subject_id INTEGER NOT NULL REFERENCES subjects(subject_id) ON DELETE RESTRICT,
    semester INTEGER NOT NULL DEFAULT 5 CHECK (semester BETWEEN 1 AND 8),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    total_questions INTEGER NOT NULL DEFAULT 0 CHECK (total_questions >= 0),
    total_marks NUMERIC(6,2) NOT NULL DEFAULT 100.00 CHECK (total_marks > 0),
    passing_marks NUMERIC(6,2) NOT NULL DEFAULT 40.00 CHECK (passing_marks >= 0),
    negative_marking NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (negative_marking >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Archived', 'Cancelled')),
    created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exams_department ON exams(department_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);

-- -----------------------------------------------------------------------------
-- 7. SCHEDULES (With Corrected Actual Timestamp Exclusion Constraint)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedules (
    schedule_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
    center_id INTEGER NOT NULL REFERENCES exam_centers(center_id) ON DELETE RESTRICT,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    start_timestamp TIMESTAMP GENERATED ALWAYS AS (exam_date + start_time) STORED,
    end_timestamp TIMESTAMP GENERATED ALWAYS AS (exam_date + end_time) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Live')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_time_order CHECK (end_time > start_time),
    -- PROPER EXCLUSION CONSTRAINT:
    -- Allows multiple non-overlapping exams in the same center on the same date!
    -- Blocks overlapping time slots in the same center!
    CONSTRAINT no_overlap EXCLUDE USING gist (
        center_id WITH =,
        tsrange(start_timestamp, end_timestamp, '[)') WITH &&
    ) WHERE (status <> 'Cancelled')
);

CREATE INDEX IF NOT EXISTS idx_schedules_exam ON schedules(exam_id);
CREATE INDEX IF NOT EXISTS idx_schedules_center ON schedules(center_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(exam_date);

-- -----------------------------------------------------------------------------
-- 8. QUESTIONS (Extended Entity 8)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    question_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    marks NUMERIC(5,2) NOT NULL DEFAULT 1.00 CHECK (marks > 0),
    negative_marks NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (negative_marks >= 0),
    question_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);

-- -----------------------------------------------------------------------------
-- 9. QUESTION_OPTIONS (Extended Entity 9)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_options (
    option_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    option_order INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_options_question ON question_options(question_id);

-- -----------------------------------------------------------------------------
-- 10. EXAM_ASSIGNMENTS (Extended Entity 10)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_assignments (
    assignment_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_exam_student UNIQUE (exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_student ON exam_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_exam ON exam_assignments(exam_id);

-- -----------------------------------------------------------------------------
-- 11. EXAM_ATTEMPTS (Extended Entity 11)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_attempts (
    attempt_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES schedules(schedule_id) ON DELETE SET NULL,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Submitted', 'Timed Out', 'Abandoned')),
    score NUMERIC(6,2) DEFAULT 0.00,
    percentage NUMERIC(5,2) DEFAULT 0.00,
    is_passed BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP,
    CONSTRAINT unique_student_attempt UNIQUE (exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attempts_student ON exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam ON exam_attempts(exam_id);

-- -----------------------------------------------------------------------------
-- 12. STUDENT_ANSWERS (Extended Entity 12)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_answers (
    answer_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES exam_attempts(attempt_id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    selected_option_id INTEGER REFERENCES question_options(option_id) ON DELETE SET NULL,
    is_marked_for_review BOOLEAN NOT NULL DEFAULT FALSE,
    is_correct BOOLEAN DEFAULT NULL,
    marks_awarded NUMERIC(5,2) DEFAULT 0.00,
    answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_student_answers_attempt ON student_answers(attempt_id);

-- -----------------------------------------------------------------------------
-- 13. RESULTS (Extended Entity 13)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS results (
    result_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    attempt_id INTEGER NOT NULL UNIQUE REFERENCES exam_attempts(attempt_id) ON DELETE CASCADE,
    exam_id INTEGER NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    total_marks NUMERIC(6,2) NOT NULL,
    obtained_marks NUMERIC(6,2) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    is_passed BOOLEAN NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_exam ON results(exam_id);

-- -----------------------------------------------------------------------------
-- 14. AUDIT_LOGS (Extended Entity 14)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- VIEWS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW exam_schedule_view AS
SELECT
    s.schedule_id,
    e.exam_id,
    e.title AS exam_title,
    sub.subject_name,
    sub.subject_code,
    d.department_name,
    c.center_name,
    c.center_type,
    s.exam_date,
    s.start_time,
    s.end_time,
    s.status,
    e.duration_minutes,
    e.total_questions,
    e.total_marks
FROM schedules s
JOIN exams e ON s.exam_id = e.exam_id
JOIN exam_centers c ON s.center_id = c.center_id
JOIN departments d ON e.department_id = d.department_id
JOIN subjects sub ON e.subject_id = sub.subject_id;
