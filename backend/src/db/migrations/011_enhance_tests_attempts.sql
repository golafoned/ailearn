-- Enhance existing tables for adaptive learning
ALTER TABLE tests ADD COLUMN concepts_json TEXT;
ALTER TABLE tests ADD COLUMN adaptive_mode INTEGER DEFAULT 0;
ALTER TABLE tests ADD COLUMN difficulty_distribution TEXT;

ALTER TABLE test_attempts ADD COLUMN session_id TEXT;
ALTER TABLE test_attempts ADD COLUMN adaptive_adjustments_json TEXT;
