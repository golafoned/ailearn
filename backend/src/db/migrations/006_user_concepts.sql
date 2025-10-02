-- User concept mastery tracking
CREATE TABLE user_concepts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept_name TEXT NOT NULL,
  mastery_level INTEGER DEFAULT 0 CHECK(mastery_level >= 0 AND mastery_level <= 100),
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  last_practiced_at TEXT,
  next_review_due TEXT,
  difficulty_level TEXT DEFAULT 'easy' CHECK(difficulty_level IN ('easy', 'medium', 'hard')),
  consecutive_correct INTEGER DEFAULT 0,
  consecutive_wrong INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, concept_name)
);

CREATE INDEX idx_user_concepts_user ON user_concepts(user_id);
CREATE INDEX idx_user_concepts_due ON user_concepts(next_review_due);
CREATE INDEX idx_user_concepts_mastery ON user_concepts(user_id, mastery_level);
CREATE INDEX idx_user_concepts_name ON user_concepts(concept_name);
