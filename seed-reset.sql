-- ============================================================
-- SEED RESET SCRIPT — PostgreSQL
-- Creates tables and inserts fresh IT department data
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
  must_change_password BOOLEAN DEFAULT TRUE
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
  teaching INT NOT NULL,
  communication INT NOT NULL,
  behaviour INT NOT NULL,
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

-- Insert Admin
INSERT INTO admin (username, password, must_change_password)
VALUES ('7020559953', 'pass@123', TRUE);

-- Insert HOD for Information Technology
INSERT INTO hod (hod_id, name, email, password, department, must_change_password)
VALUES ('9766979364', 'HOD Information Technology', 'hod.it@college.edu', 'pass@123', 'Information Technology', TRUE);

-- Insert dummy teacher
INSERT INTO faculty (faculty_id, name, email, password, department, subject, must_change_password)
VALUES ('IT-TCH-001', 'Prof. Anita Sharma', 'anita.sharma@college.edu', 'pass@123', 'Information Technology', 'Data Structures and Algorithms(DSA)', TRUE);

-- Insert 75 students (IT-2201 to IT-2275)
INSERT INTO students (student_id, name, email, password, department, year, division, must_change_password) VALUES
('IT-2201','Student 2201','student2201@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2202','Student 2202','student2202@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2203','Student 2203','student2203@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2204','Student 2204','student2204@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2205','Student 2205','student2205@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2206','Student 2206','student2206@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2207','Student 2207','student2207@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2208','Student 2208','student2208@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2209','Student 2209','student2209@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2210','Student 2210','student2210@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2211','Student 2211','student2211@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2212','Student 2212','student2212@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2213','Student 2213','student2213@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2214','Student 2214','student2214@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2215','Student 2215','student2215@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2216','Student 2216','student2216@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2217','Student 2217','student2217@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2218','Student 2218','student2218@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2219','Student 2219','student2219@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2220','Student 2220','student2220@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2221','Student 2221','student2221@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2222','Student 2222','student2222@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2223','Student 2223','student2223@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2224','Student 2224','student2224@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2225','Student 2225','student2225@college.edu','pass@123','Information Technology',2,'A',TRUE),
('IT-2226','Student 2226','student2226@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2227','Student 2227','student2227@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2228','Student 2228','student2228@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2229','Student 2229','student2229@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2230','Student 2230','student2230@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2231','Student 2231','student2231@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2232','Student 2232','student2232@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2233','Student 2233','student2233@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2234','Student 2234','student2234@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2235','Student 2235','student2235@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2236','Student 2236','student2236@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2237','Student 2237','student2237@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2238','Student 2238','student2238@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2239','Student 2239','student2239@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2240','Student 2240','student2240@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2241','Student 2241','student2241@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2242','Student 2242','student2242@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2243','Student 2243','student2243@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2244','Student 2244','student2244@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2245','Student 2245','student2245@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2246','Student 2246','student2246@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2247','Student 2247','student2247@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2248','Student 2248','student2248@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2249','Student 2249','student2249@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2250','Student 2250','student2250@college.edu','pass@123','Information Technology',2,'B',TRUE),
('IT-2251','Student 2251','student2251@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2252','Student 2252','student2252@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2253','Student 2253','student2253@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2254','Student 2254','student2254@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2255','Student 2255','student2255@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2256','Student 2256','student2256@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2257','Student 2257','student2257@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2258','Student 2258','student2258@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2259','Student 2259','student2259@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2260','Student 2260','student2260@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2261','Student 2261','student2261@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2262','Student 2262','student2262@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2263','Student 2263','student2263@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2264','Student 2264','student2264@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2265','Student 2265','student2265@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2266','Student 2266','student2266@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2267','Student 2267','student2267@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2268','Student 2268','student2268@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2269','Student 2269','student2269@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2270','Student 2270','student2270@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2271','Student 2271','student2271@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2272','Student 2272','student2272@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2273','Student 2273','student2273@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2274','Student 2274','student2274@college.edu','pass@123','Information Technology',2,'C',TRUE),
('IT-2275','Student 2275','student2275@college.edu','pass@123','Information Technology',2,'C',TRUE);

-- Insert test feedback cycle
INSERT INTO feedback_cycles (name, start_date, end_date, status)
VALUES ('Semester I — 2026-27', '2026-09-01', '2026-12-31', 'active');
