-- Adaptmind Backend Database Schema
-- PostgreSQL Migration Script

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS idempotency_keys CASCADE;
DROP TABLE IF EXISTS risk_alerts CASCADE;
DROP TABLE IF EXISTS learning_metrics CASCADE;
DROP TABLE IF EXISTS mission_attempts CASCADE;
DROP TABLE IF EXISTS missions CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS trigger_new_student_metrics ON students;
DROP FUNCTION IF EXISTS create_student_metrics();

-- 1. Students Table: Core user profile
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    age INTEGER CHECK (age > 0),
    parent_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Missions Table: The library of tasks
CREATE TABLE missions (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    energy_cost INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Mission Attempts: The transaction log
CREATE TABLE mission_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    mission_id VARCHAR(50) REFERENCES missions(id) ON DELETE CASCADE,
    score INTEGER CHECK (score BETWEEN 0 AND 100),
    time_taken INTEGER,
    energy_used INTEGER DEFAULT 0,
    decisions JSONB,
    device_platform VARCHAR(50),
    device_app_version VARCHAR(20),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Learning Metrics: The cognitive profile
CREATE TABLE learning_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    sustainability_understanding INTEGER DEFAULT 50 CHECK (sustainability_understanding BETWEEN 0 AND 100),
    energy_efficiency_score INTEGER DEFAULT 50 CHECK (energy_efficiency_score BETWEEN 0 AND 100),
    decision_confidence INTEGER DEFAULT 50 CHECK (decision_confidence BETWEEN 0 AND 100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Risk Alerts: For n8n automation history
CREATE TABLE risk_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    mission_id VARCHAR(50) REFERENCES missions(id),
    score INTEGER,
    alert_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Idempotency Keys: To prevent duplicate processing
CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
-- Fast lookup for a student's history
CREATE INDEX idx_mission_attempts_student ON mission_attempts(student_id);

-- Performance for time-based reporting/dashboards
CREATE INDEX idx_mission_attempts_date ON mission_attempts(completed_at);

-- Ensure we can quickly check if a request_id was already used
CREATE INDEX idx_idempotency_lookup ON idempotency_keys(id);

-- Automatic Metrics Creation Trigger
-- This ensures that when a student signs up, their baseline scores are created automatically
CREATE OR REPLACE FUNCTION create_student_metrics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO learning_metrics (student_id, sustainability_understanding, energy_efficiency_score, decision_confidence)
    VALUES (NEW.id, 50, 50, 50);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_student_metrics
AFTER INSERT ON students
FOR EACH ROW
EXECUTE FUNCTION create_student_metrics();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE 'Tables: students, missions, mission_attempts, learning_metrics, risk_alerts, idempotency_keys';
    RAISE NOTICE 'Indexes: Created for performance optimization';
    RAISE NOTICE 'Trigger: Automatic learning_metrics creation for new students';
END $$;
