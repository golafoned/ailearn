-- Gamification: badges, achievements, streaks
CREATE TABLE user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  progress INTEGER DEFAULT 0,
  progress_total INTEGER,
  earned_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, achievement_type, achievement_name)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned ON user_achievements(user_id, earned_at DESC);
CREATE INDEX idx_user_achievements_type ON user_achievements(achievement_type);
