-- =============================================================
-- HOD PORTAL — Database Migration
-- Creates the hod_messages table for storing auto-reply logs
--
-- Run once against your PostgreSQL / Neon database.
-- The table is also auto-created by the server if it doesn't
-- exist, so running this script is optional but recommended
-- for clean schema management.
-- =============================================================

CREATE TABLE IF NOT EXISTS hod_messages (
    id           SERIAL          PRIMARY KEY,
    hod_id       VARCHAR(50),
    faculty_id   INT,
    faculty_name TEXT,
    message      TEXT            NOT NULL,
    rating_avg   NUMERIC(4, 2),
    type         VARCHAR(20)     NOT NULL    CHECK (type IN ('congratulate', 'improve')),
    sent_at      TIMESTAMP       NOT NULL    DEFAULT NOW()
);

-- Index for fast look-ups by HOD
CREATE INDEX IF NOT EXISTS idx_hod_messages_hod_id
    ON hod_messages (hod_id);

-- Index for fast look-ups by faculty
CREATE INDEX IF NOT EXISTS idx_hod_messages_faculty_id
    ON hod_messages (faculty_id);

-- Comment
COMMENT ON TABLE hod_messages IS
    'Stores auto-reply messages sent by HOD to faculty members based on their feedback ratings.';
