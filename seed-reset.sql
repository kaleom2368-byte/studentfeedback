-- ============================================================
-- CLEAN RESET SCRIPT — PostgreSQL
-- Drops all old data and creates fresh, empty tables
-- ============================================================

DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS feedback_submissions CASCADE;
DROP TABLE IF EXISTS hod CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS hod_messages CASCADE;
DROP TABLE IF EXISTS feedback_cycles CASCADE;

CREATE TABLE admin (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  must_change_password BOOLEAN DEFAULT FALSE
);

CREATE TABLE faculty (
  id SERIAL PRIMARY KEY,
  faculty_id VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  subject VARCHAR(200) DEFAULT '',
  must_change_password BOOLEAN DEFAULT TRUE
);

CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  faculty_id VARCHAR(20) NOT NULL,
  department VARCHAR(100) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  teaching INT,
  communication INT,
  behaviour INT,
  form_type VARCHAR(50) DEFAULT 'theory',
  responses JSONB,
  comments TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cycle_id INT
);

CREATE TABLE feedback_submissions (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  faculty_id VARCHAR(20) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  cycle_id INT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hod (
  id SERIAL PRIMARY KEY,
  hod_id VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  must_change_password BOOLEAN DEFAULT TRUE
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  division VARCHAR(10) NOT NULL,
  must_change_password BOOLEAN DEFAULT TRUE
);

CREATE TABLE hod_messages (
  id SERIAL PRIMARY KEY,
  hod_id VARCHAR(20) NOT NULL,
  faculty_id VARCHAR(20) NOT NULL,
  faculty_name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  rating_avg NUMERIC(3,2),
  type VARCHAR(50),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feedback_cycles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'inactive'
);

-- Insert ONLY your fresh Admin account (change 'admin' and 'admin123' if you want)
INSERT INTO admin (username, password, must_change_password)
VALUES ('admin', 'admin123', FALSE);