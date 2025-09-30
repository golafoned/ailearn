-- Add display_name to test_attempts for anonymous named attempts
ALTER TABLE test_attempts ADD COLUMN display_name TEXT;

-- Table to store each answer with correctness for detailed review
CREATE TABLE IF NOT EXISTS test_attempt_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT,
  user_answer TEXT,
  is_correct INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON test_attempt_answers(attempt_id);