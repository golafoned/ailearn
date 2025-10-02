-- Practice sessions for streaks and history
CREATE TABLE practice_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK(session_type IN ('quick', 'focused', 'mastery', 'weak')),
  concepts_json TEXT,
  target_difficulty TEXT CHECK(target_difficulty IN ('adaptive', 'easy', 'medium', 'hard', 'progressive')),
  questions_total INTEGER,
  questions_correct INTEGER,
  score_percentage INTEGER,
  test_id TEXT REFERENCES tests(id),
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  duration_seconds INTEGER
);

CREATE INDEX idx_practice_sessions_user ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_completed ON practice_sessions(user_id, completed_at);
CREATE INDEX idx_practice_sessions_test ON practice_sessions(test_id);
