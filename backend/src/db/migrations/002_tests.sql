-- Tests table
CREATE TABLE IF NOT EXISTS tests (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- invitation code
  title TEXT NOT NULL,
  source_filename TEXT,
  source_text TEXT NOT NULL,
  model TEXT NOT NULL,
  params_json TEXT NOT NULL, -- JSON of generation parameters
  questions_json TEXT NOT NULL, -- JSON array of questions
  expires_at TEXT NOT NULL,
  time_limit_seconds INTEGER NOT NULL, -- allowed duration for attempt
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tests_code ON tests(code);

-- Test attempts (anonymous or user linked)
CREATE TABLE IF NOT EXISTS test_attempts (
  id TEXT PRIMARY KEY,
  test_id TEXT NOT NULL,
  user_id TEXT, -- nullable for anonymous
  participant_name TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT,
  answers_json TEXT, -- JSON of answers
  score REAL,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_attempts_test ON test_attempts(test_id);
