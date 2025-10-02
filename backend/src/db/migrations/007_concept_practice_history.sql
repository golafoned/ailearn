-- Historical performance tracking for analytics
CREATE TABLE concept_practice_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept_name TEXT NOT NULL,
  session_id TEXT,
  question_difficulty TEXT CHECK(question_difficulty IN ('easy', 'medium', 'hard')),
  was_correct INTEGER NOT NULL CHECK(was_correct IN (0, 1)),
  mastery_before INTEGER,
  mastery_after INTEGER,
  time_spent_seconds INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_concept_history_user_concept ON concept_practice_history(user_id, concept_name);
CREATE INDEX idx_concept_history_session ON concept_practice_history(session_id);
CREATE INDEX idx_concept_history_date ON concept_practice_history(user_id, created_at);
CREATE INDEX idx_concept_history_concept ON concept_practice_history(concept_name);
