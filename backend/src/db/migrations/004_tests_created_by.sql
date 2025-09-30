ALTER TABLE tests ADD COLUMN created_by TEXT;
CREATE INDEX IF NOT EXISTS idx_tests_created_by ON tests(created_by);