-- ============================================
-- Seeding Script for user1@example.com
-- User ID: da447d2d-bfed-4e3a-a493-4f55762b91f5
-- ============================================

-- Clean up existing data for this user
DELETE FROM concept_practice_history WHERE user_id = 'da447d2d-bfed-4e3a-a493-4f55762b91f5';
DELETE FROM user_concepts WHERE user_id = 'da447d2d-bfed-4e3a-a493-4f55762b91f5';
DELETE FROM practice_sessions WHERE user_id = 'da447d2d-bfed-4e3a-a493-4f55762b91f5';
DELETE FROM user_achievements WHERE user_id = 'da447d2d-bfed-4e3a-a493-4f55762b91f5';
DELETE FROM concept_relationships;

-- ============================================
-- 1. CREATE USER CONCEPTS (10 concepts with varying mastery)
-- ============================================

-- Photosynthesis (75% mastery)
INSERT INTO user_concepts (id, user_id, concept_name, mastery_level, total_attempts, correct_attempts, difficulty_level, consecutive_correct, consecutive_wrong, last_practiced_at, next_review_due, created_at)
VALUES ('concept-001', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Photosynthesis', 75, 15, 12, 'medium', 3, 0, datetime('now', '-2 days'), datetime('now', '+7 days'), datetime('now', '-7 days'));

-- Cellular Respiration (45% mastery)
INSERT INTO user_concepts (id, user_id, concept_name, mastery_level, total_attempts, correct_attempts, difficulty_level, consecutive_correct, consecutive_wrong, last_practiced_at, next_review_due, created_at)
VALUES ('concept-002', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Cellular Respiration', 45, 12, 5, 'easy', 0, 0, datetime('now', '-2 days'), datetime('now', '+3 days'), datetime('now', '-7 days'));

-- DNA Replication (85% mastery)
INSERT INTO user_concepts (id, user_id, concept_name, mastery_level, total_attempts, correct_attempts, difficulty_level, consecutive_correct, consecutive_wrong, last_practiced_at, next_review_due, created_at)
VALUES ('concept-003', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'DNA Replication', 85, 20, 18, 'hard', 3, 0, datetime('now', '-2 days'), datetime('now', '+30 days'), datetime('now', '-7 days'));

-- Mitosis (30% mastery) - WEAK
INSERT INTO user_concepts (id, user_id, concept_name, mastery_level, total_attempts, correct_attempts, difficulty_level, consecutive_correct, consecutive_wrong, last_practiced_at, next_review_due, created_at)
VALUES ('concept-004', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Mitosis', 30, 10, 3, 'easy', 0, 2, datetime('now', '-2 days'), datetime('now', '+1 day'), datetime('now', '-7 days'));

-- Meiosis (60% mastery)
INSERT INTO user_concepts (id, user_id, concept_name, mastery_level, total_attempts, correct_attempts, difficulty_level, consecutive_correct, consecutive_wrong, last_practiced_at, next_review_due, created_at)
VALUES ('concept-005', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Meiosis', 60, 18, 11, 'medium', 0, 0, datetime('now', '-2 days'), datetime('now', '+7 days'), datetime('now', '-7 days'));

-- Cell Membrane Transport (20% mastery) - VERY WEAK
INSERT INTO user_concepts (id, user_id, concept_name, mastery_level, total_attempts, correct_attempts, difficulty_level, consecutive_correct, consecutive_wrong, last_practiced_at, next_review_due, created_at)
VALUES ('concept-006', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Cell Membrane Transport', 20, 8, 2, 'easy', 0, 2, datetime('now', '-2 days'), datetime('now', '+1 day'), datetime('now', '-7 days'));

-- Protein Synthesis (55% mastery)
INSERT INTO user_concepts (id, user_id, concept_name, mastery_level, total_attempts, correct_attempts, difficulty_level, consecutive_correct, consecutive_wrong, last_practiced_at, next_review_due, created_at)
VALUES ('concept-007', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Protein Synthesis', 55, 14, 8, 'medium', 0, 0, datetime('now', '-2 days'), datetime('now', '+3 days'), datetime('now', '-7 days'));

-- Enzyme Function (90% mastery) - STRONG
INSERT INTO user_concepts (id, user_id, concept_name, mastery_level, total_attempts, correct_attempts, difficulty_level, consecutive_correct, consecutive_wrong, last_practiced_at, next_review_due, created_at)
VALUES ('concept-008', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Enzyme Function', 90, 25, 23, 'hard', 3, 0, datetime('now', '-2 days'), datetime('now', '+30 days'), datetime('now', '-7 days'));

-- Genetics and Heredity (70% mastery)
INSERT INTO user_concepts (id, user_id, concept_name, mastery_level, total_attempts, correct_attempts, difficulty_level, consecutive_correct, consecutive_wrong, last_practiced_at, next_review_due, created_at)
VALUES ('concept-009', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Genetics and Heredity', 70, 16, 12, 'medium', 3, 0, datetime('now', '-2 days'), datetime('now', '+7 days'), datetime('now', '-7 days'));

-- Evolution and Natural Selection (40% mastery)
INSERT INTO user_concepts (id, user_id, concept_name, mastery_level, total_attempts, correct_attempts, difficulty_level, consecutive_correct, consecutive_wrong, last_practiced_at, next_review_due, created_at)
VALUES ('concept-010', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Evolution and Natural Selection', 40, 9, 4, 'easy', 0, 0, datetime('now', '-2 days'), datetime('now', '+3 days'), datetime('now', '-7 days'));

-- ============================================
-- 2. CREATE PRACTICE HISTORY (50 records)
-- ============================================

-- Photosynthesis practice history
INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-001', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Photosynthesis', NULL, 'medium', 1, 70, 75, 45, datetime('now', '-12 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-002', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Photosynthesis', NULL, 'easy', 1, 65, 70, 32, datetime('now', '-10 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-003', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Photosynthesis', NULL, 'hard', 0, 70, 65, 58, datetime('now', '-8 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-004', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Photosynthesis', NULL, 'medium', 1, 65, 70, 41, datetime('now', '-5 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-005', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Photosynthesis', NULL, 'medium', 1, 70, 75, 38, datetime('now', '-2 days'));

-- Cellular Respiration practice history
INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-006', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Cellular Respiration', NULL, 'easy', 0, 50, 45, 35, datetime('now', '-11 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-007', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Cellular Respiration', NULL, 'easy', 1, 40, 45, 29, datetime('now', '-9 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-008', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Cellular Respiration', NULL, 'medium', 0, 45, 40, 43, datetime('now', '-6 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-009', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Cellular Respiration', NULL, 'easy', 1, 40, 45, 31, datetime('now', '-3 days'));

-- DNA Replication practice history
INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-010', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'DNA Replication', NULL, 'hard', 1, 80, 85, 67, datetime('now', '-13 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-011', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'DNA Replication', NULL, 'hard', 1, 75, 80, 71, datetime('now', '-10 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-012', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'DNA Replication', NULL, 'medium', 1, 70, 75, 52, datetime('now', '-7 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-013', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'DNA Replication', NULL, 'hard', 1, 80, 85, 69, datetime('now', '-4 days'));

-- Mitosis practice history (weak concept)
INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-014', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Mitosis', NULL, 'easy', 0, 35, 30, 27, datetime('now', '-12 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-015', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Mitosis', NULL, 'easy', 1, 25, 30, 33, datetime('now', '-9 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-016', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Mitosis', NULL, 'easy', 0, 30, 25, 29, datetime('now', '-5 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-017', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Mitosis', NULL, 'easy', 1, 25, 30, 35, datetime('now', '-2 days'));

-- Meiosis practice history
INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-018', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Meiosis', NULL, 'medium', 1, 55, 60, 46, datetime('now', '-11 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-019', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Meiosis', NULL, 'medium', 1, 50, 55, 44, datetime('now', '-8 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-020', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Meiosis', NULL, 'easy', 1, 55, 60, 37, datetime('now', '-4 days'));

-- Cell Membrane Transport practice history (very weak)
INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-021', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Cell Membrane Transport', NULL, 'easy', 0, 25, 20, 31, datetime('now', '-10 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-022', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Cell Membrane Transport', NULL, 'easy', 0, 20, 15, 28, datetime('now', '-7 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-023', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Cell Membrane Transport', NULL, 'easy', 1, 15, 20, 42, datetime('now', '-3 days'));

-- Protein Synthesis practice history
INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-024', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Protein Synthesis', NULL, 'medium', 1, 50, 55, 48, datetime('now', '-12 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-025', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Protein Synthesis', NULL, 'easy', 1, 50, 55, 39, datetime('now', '-8 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-026', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Protein Synthesis', NULL, 'medium', 0, 55, 50, 51, datetime('now', '-5 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-027', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Protein Synthesis', NULL, 'medium', 1, 50, 55, 45, datetime('now', '-2 days'));

-- Enzyme Function practice history (strong)
INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-028', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Enzyme Function', NULL, 'hard', 1, 85, 90, 73, datetime('now', '-13 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-029', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Enzyme Function', NULL, 'hard', 1, 80, 85, 68, datetime('now', '-10 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-030', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Enzyme Function', NULL, 'medium', 1, 85, 90, 56, datetime('now', '-6 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-031', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Enzyme Function', NULL, 'hard', 1, 85, 90, 71, datetime('now', '-3 days'));

-- Genetics and Heredity practice history
INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-032', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Genetics and Heredity', NULL, 'medium', 1, 65, 70, 49, datetime('now', '-11 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-033', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Genetics and Heredity', NULL, 'medium', 1, 60, 65, 47, datetime('now', '-8 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-034', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Genetics and Heredity', NULL, 'hard', 0, 65, 60, 64, datetime('now', '-5 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-035', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Genetics and Heredity', NULL, 'medium', 1, 65, 70, 50, datetime('now', '-2 days'));

-- Evolution and Natural Selection practice history
INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-036', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Evolution and Natural Selection', NULL, 'easy', 1, 35, 40, 36, datetime('now', '-10 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-037', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Evolution and Natural Selection', NULL, 'easy', 0, 40, 35, 33, datetime('now', '-7 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-038', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Evolution and Natural Selection', NULL, 'medium', 1, 35, 40, 41, datetime('now', '-4 days'));

-- Additional random practice records (to reach 50 total)
INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-039', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Photosynthesis', NULL, 'medium', 1, 72, 75, 44, datetime('now', '-6 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-040', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'DNA Replication', NULL, 'hard', 1, 83, 85, 66, datetime('now', '-9 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-041', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Enzyme Function', NULL, 'hard', 1, 88, 90, 72, datetime('now', '-11 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-042', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Meiosis', NULL, 'medium', 1, 58, 60, 43, datetime('now', '-7 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-043', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Protein Synthesis', NULL, 'medium', 1, 52, 55, 47, datetime('now', '-10 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-044', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Genetics and Heredity', NULL, 'medium', 1, 68, 70, 48, datetime('now', '-9 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-045', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Cellular Respiration', NULL, 'easy', 1, 42, 45, 34, datetime('now', '-12 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-046', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Mitosis', NULL, 'easy', 0, 28, 25, 30, datetime('now', '-8 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-047', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Cell Membrane Transport', NULL, 'easy', 0, 22, 20, 26, datetime('now', '-13 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-048', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Evolution and Natural Selection', NULL, 'easy', 1, 38, 40, 37, datetime('now', '-11 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-049', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'Photosynthesis', NULL, 'hard', 1, 73, 75, 62, datetime('now', '-4 days'));

INSERT INTO concept_practice_history (id, user_id, concept_name, session_id, question_difficulty, was_correct, mastery_before, mastery_after, time_spent_seconds, created_at)
VALUES ('history-050', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'DNA Replication', NULL, 'hard', 1, 84, 85, 70, datetime('now', '-1 days'));

-- ============================================
-- 3. CREATE PRACTICE SESSIONS (5 sessions)
-- ============================================

INSERT INTO practice_sessions (id, user_id, session_type, concepts_json, target_difficulty, questions_total, questions_correct, score_percentage, test_id, started_at, completed_at, duration_seconds)
VALUES ('session-001', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'quick', '["Photosynthesis", "Cellular Respiration", "DNA Replication"]', 'adaptive', 10, 7, 70, NULL, datetime('now', '-5 days'), datetime('now', '-5 days', '+15 minutes'), 742);

INSERT INTO practice_sessions (id, user_id, session_type, concepts_json, target_difficulty, questions_total, questions_correct, score_percentage, test_id, started_at, completed_at, duration_seconds)
VALUES ('session-002', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'focused', '["Photosynthesis", "Cellular Respiration", "DNA Replication"]', 'adaptive', 10, 8, 80, NULL, datetime('now', '-4 days'), datetime('now', '-4 days', '+15 minutes'), 823);

INSERT INTO practice_sessions (id, user_id, session_type, concepts_json, target_difficulty, questions_total, questions_correct, score_percentage, test_id, started_at, completed_at, duration_seconds)
VALUES ('session-003', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'mastery', '["Photosynthesis", "Cellular Respiration", "DNA Replication"]', 'adaptive', 10, 6, 60, NULL, datetime('now', '-3 days'), datetime('now', '-3 days', '+15 minutes'), 691);

INSERT INTO practice_sessions (id, user_id, session_type, concepts_json, target_difficulty, questions_total, questions_correct, score_percentage, test_id, started_at, completed_at, duration_seconds)
VALUES ('session-004', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'weak', '["Photosynthesis", "Cellular Respiration", "DNA Replication"]', 'adaptive', 10, 9, 90, NULL, datetime('now', '-2 days'), datetime('now', '-2 days', '+15 minutes'), 878);

INSERT INTO practice_sessions (id, user_id, session_type, concepts_json, target_difficulty, questions_total, questions_correct, score_percentage, test_id, started_at, completed_at, duration_seconds)
VALUES ('session-005', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'quick', '["Photosynthesis", "Cellular Respiration", "DNA Replication"]', 'adaptive', 10, 7, 70, NULL, datetime('now', '-1 days'), datetime('now', '-1 days', '+15 minutes'), 756);

-- ============================================
-- 4. CREATE USER ACHIEVEMENTS (7 achievements)
-- ============================================

INSERT INTO user_achievements (id, user_id, achievement_type, achievement_name, description, progress, progress_total, earned_at, created_at)
VALUES ('achievement-001', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'streak_7', 'Streak 7', 'Achievement for streak_7', 5, 7, NULL, datetime('now'));

INSERT INTO user_achievements (id, user_id, achievement_type, achievement_name, description, progress, progress_total, earned_at, created_at)
VALUES ('achievement-002', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'streak_30', 'Streak 30', 'Achievement for streak_30', 5, 30, NULL, datetime('now'));

INSERT INTO user_achievements (id, user_id, achievement_type, achievement_name, description, progress, progress_total, earned_at, created_at)
VALUES ('achievement-003', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'concepts_10', 'Concepts 10', 'Achievement for concepts_10', 10, 10, datetime('now'), datetime('now'));

INSERT INTO user_achievements (id, user_id, achievement_type, achievement_name, description, progress, progress_total, earned_at, created_at)
VALUES ('achievement-004', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'concepts_50', 'Concepts 50', 'Achievement for concepts_50', 10, 50, NULL, datetime('now'));

INSERT INTO user_achievements (id, user_id, achievement_type, achievement_name, description, progress, progress_total, earned_at, created_at)
VALUES ('achievement-005', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'concepts_100', 'Concepts 100', 'Achievement for concepts_100', 10, 100, NULL, datetime('now'));

INSERT INTO user_achievements (id, user_id, achievement_type, achievement_name, description, progress, progress_total, earned_at, created_at)
VALUES ('achievement-006', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'perfect_10', 'Perfect 10', 'Achievement for perfect_10', 3, 10, NULL, datetime('now'));

INSERT INTO user_achievements (id, user_id, achievement_type, achievement_name, description, progress, progress_total, earned_at, created_at)
VALUES ('achievement-007', 'da447d2d-bfed-4e3a-a493-4f55762b91f5', 'sessions_50', 'Sessions 50', 'Achievement for sessions_50', 5, 50, NULL, datetime('now'));

-- ============================================
-- 5. CREATE CONCEPT RELATIONSHIPS (4 relationships)
-- ============================================

INSERT INTO concept_relationships (id, concept_name, prerequisite_name, relationship_type, strength, created_at)
VALUES ('relationship-001', 'Meiosis', 'Mitosis', 'prerequisite', 1.0, datetime('now'));

INSERT INTO concept_relationships (id, concept_name, prerequisite_name, relationship_type, strength, created_at)
VALUES ('relationship-002', 'Protein Synthesis', 'DNA Replication', 'prerequisite', 1.0, datetime('now'));

INSERT INTO concept_relationships (id, concept_name, prerequisite_name, relationship_type, strength, created_at)
VALUES ('relationship-003', 'Evolution and Natural Selection', 'Genetics and Heredity', 'prerequisite', 1.0, datetime('now'));

INSERT INTO concept_relationships (id, concept_name, prerequisite_name, relationship_type, strength, created_at)
VALUES ('relationship-004', 'Cellular Respiration', 'Cell Membrane Transport', 'related', 1.0, datetime('now'));

-- ============================================
-- SEEDING COMPLETE!
-- ============================================
-- 
-- Summary:
-- ✅ 10 Concepts (mastery 20%-90%)
-- ✅ 50 Practice History Records
-- ✅ 5 Practice Sessions
-- ✅ 7 Achievements (1 earned: concepts_10)
-- ✅ 4 Concept Relationships
--
-- Weak Concepts (for testing):
-- - Cell Membrane Transport (20%)
-- - Mitosis (30%)
--
-- Strong Concepts (for testing):
-- - Enzyme Function (90%)
-- - DNA Replication (85%)
--
-- User: user1@example.com
-- ID: da447d2d-bfed-4e3a-a493-4f55762b91f5
-- ============================================
