-- 005_tests_review.sql
-- Adds review test flags and metadata.
ALTER TABLE tests ADD COLUMN is_review INTEGER DEFAULT 0; -- 0/1 flag
ALTER TABLE tests ADD COLUMN review_source_test_id TEXT NULL; -- original test id basis
ALTER TABLE tests ADD COLUMN review_origin_attempt_ids TEXT NULL; -- JSON array of attempt ids used
ALTER TABLE tests ADD COLUMN review_strategy TEXT NULL; -- strategy label
