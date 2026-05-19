# AI-Learn — Product Vision & Feature Documentation

## Vision Statement

AI-Learn is an AI-powered adaptive learning platform that transforms any topic, text, or uploaded document into personalized learning experiences. The platform combines AI question generation, spaced repetition, mastery tracking, gamification, and social test-sharing into a unified system where learners continuously improve through intelligent practice.

The final product is a place where a user can paste their lecture notes, upload a PDF textbook chapter, or just type a topic — and instantly get a tailored quiz that tracks what they know, identifies gaps, and builds a long-term study plan. Teachers can create shareable tests for students. Students can review mistakes, generate flashcards, and watch their mastery grow over time.

---

## Target Users

| Role                     | Usage                                                                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Self-learner**         | Pastes notes or types a topic → practices with AI-generated quizzes → tracks mastery over time → reviews weak areas with flashcards and spaced repetition               |
| **Student**              | Joins a test by code from a teacher → takes the test → reviews wrong answers → creates flashcards from mistakes → practices weak concepts adaptively                    |
| **Teacher / Instructor** | Creates a test from a topic or source text → shares invite code with students → reviews analytics: per-student scores, answers, common mistakes → closes test when done |

---

## Core Architecture

| Layer        | Tech                                                                  | Details                                                                                                       |
| ------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Frontend** | React 19 + Vite, Tailwind CSS, React Router v6                        | SPA with context-based state management. 23 pages, 7 shared components, 5 contexts                            |
| **Backend**  | Express 5, SQLite (sql.js), Zod validation, Pino logging              | REST API. Invite-code-based test sharing. JWT auth with refresh rotation                                      |
| **AI**       | OpenRouter API → `openai/gpt-4o-mini` (default), `gpt-4o` (hard mode) | Structured JSON output (`json_schema` with strict mode). Language-aware prompts. Concept tagging per question |
| **Database** | SQLite file (sql.js), 12 migration files auto-applied                 | 10+ tables covering users, tests, attempts, concepts, sessions, achievements, flashcards                      |

---

## User Flows

### Flow 1: Quick Topic Practice (Self-Learner)

```
Home Page → type topic (e.g. "Python OOP") → click "Start Learning"
    → TopicStartPage: choose source mode:
        • AI Freestyle — AI generates from its knowledge
        • Paste Notes — paste your lecture notes / textbook excerpt
        • Upload File — drag-and-drop .txt, .md, or .pdf file
    → Adjust question count (5-20) → click "Start Practice"
    → Backend: AI generates questions from source material, matching language
    → TestTakingPage: answer questions one-by-one (MCQ / True-False / Short Answer)
    → Submit all answers
    → SessionResultsPage: see score, mastery changes per concept, achievements earned, next recommendation
    → "Practice Again" → creates new session → repeat cycle
```

### Flow 2: Teacher Creates & Shares a Test

```
Header → "Create" → CreateTestPage
    → Enter topic or upload .txt source file
    → Set: title, question count (1-50), time limit, difficulty, expiry date, extra instructions
    → "Generate Test" → AI generates questions → shows preview
    → TestGeneratedPage: get 8-character invite code + shareable link
    → Share code with students (e.g. "EFWLVZY3")
```

### Flow 3: Student Takes a Shared Test

```
Home Page → enter test code → "Join"
    → TestLandingPage: see test title, question count, time limit, leaderboard
    → Anonymous: enter name → "Start Test"
    → Authenticated: auto-starts immediately
    → TestTakingPage: answer questions under time limit, progress bar, question navigation
    → Submit → auto-graded → StudentResultsPage: score, wrong answers, emoji feedback
    → Optional: "Create Flashcards from Mistakes" → auto-generates flashcard deck
```

### Flow 4: Adaptive Learning Session (Advanced)

```
Learning Dashboard → "Practice" → PracticeSessionCreatePage
    → Choose session type:
        • Quick Practice — balanced mix
        • Focused Review — targets specific concepts
        • Mastery Building — progressive difficulty
        • Weak Concepts — focuses on lowest mastery areas
    → Choose concept selection strategy:
        • Due for Review — spaced repetition schedule
        • Weak Concepts — lowest mastery first
        • Random Mix — variety
        • Custom Pick — manually select concepts
        • New Topic — enter free-text topic
    → Set difficulty (easy/medium/hard/adaptive) and question count
    → AI generates questions with adaptive difficulty distribution based on mastery
    → Take session → submit → mastery updates → spaced repetition recalculated
```

### Flow 5: Flashcard Study (Spaced Repetition)

```
Header → "Flashcards" → FlashcardsPage: list all decks
    → Create new deck (title + description) OR open existing deck
    → FlashcardDeckPage — 3 tabs:
        • Cards — browse all cards, add/delete manually
        • Study — flip-reveal cards, rate difficulty (0-5, SM-2 algorithm), tracks intervals
        • AI Generate — enter topic + count → AI creates cards automatically
    → SM-2 scheduling: cards rated ≥3 get increasing intervals (1→6→N days)
    → Cards rated <3 reset to 10-minute review
```

### Flow 6: Review Mistakes

```
After any test → StudentResultsPage → "Create Flashcards from Mistakes"
    → Auto-creates deck with wrong answers as flashcard fronts, correct answers + explanations as backs

OR

Dashboard → "My Tests" → "Review Tests" tab → "Generate Review"
    → ReviewGeneratorModal: choose strategy:
        • Wrong answers from recent attempts
        • Spaced repetition targeting
        • Mix of both
        • Fresh topic-based
    → Generates new practice test from mistake patterns → take it → track improvement
```

### Flow 7: Achievements & Gamification

```
Learning Dashboard shows: level badge, streak counter, mastered concept count
    → Header → "Achievements" → AchievementsPage
    → View all 17 achievements across 5 categories:
        • Streaks: 3, 7, 14, 30 consecutive days
        • Concept Mastery: master 5, 10, 25, 50 concepts (≥80%)
        • Sessions: complete 5, 25, 50, 100 sessions
        • Perfect Scores: get 1, 5, 10 perfect 100%
        • Flashcards: create 25 cards, review 100 cards
    → Progress bar on each unearned achievement
    → Earned achievements show unlock date
```

### Flow 8: Learning Dashboard & Progress Tracking

```
Header → "Learn" → LearningDashboardPage
    → Top stats: overall mastery %, mastered count, due for review, streak, weekly stats
    → Concept list with filters: All / Weak (<40%) / Learning (40-79%) / Mastered (≥80%) / Due for Review
    → Sort by: mastery level, name, recently practiced, review due date
    → Click any concept → ConceptDetailPage: mastery chart, accuracy, practice history, prerequisites, related concepts
    → Recommendations panel: AI-prioritized next steps based on weak areas, overdue reviews, declining performance
```

### Flow 9: Test Owner Analytics

```
Dashboard → "My Tests" tab → click a test
    → TestAnalyticsPage: list all participants with scores
    → Click a participant → AttemptDetailPage: see every answer, correct answer, explanation
    → "Close Test" button → expires test immediately, no new attempts allowed
```

---

## Feature Inventory

### AI Question Generation

- **Input sources**: free-text topic, pasted notes (up to 50,000 chars), uploaded files (.txt, .md, .pdf)
- **Question types**: Multiple Choice (MCQ), True/False, Short Answer
- **Output per question**: question text, options array, correct answer, explanation (40-400 chars), reference to source, difficulty tag, concept tags (1-3)
- **Language awareness**: auto-detects language from source text (Ukrainian/Cyrillic, CJK, Arabic, Latin). Generates questions in the same language as the source material
- **Structured output**: uses OpenAI JSON Schema mode (`response_format: { type: "json_schema", strict: true }`) with fallback to unstructured JSON
- **Models**: `openai/gpt-4o-mini` for easy/medium/adaptive, `openai/gpt-4o` for hard difficulty
- **Prompt engineering**: detailed system + user prompts with difficulty calibration, source material delimiters, concept tag instructions, answer format requirements
- **DRY_RUN_AI mode**: mock question generation for testing without API calls

### Adaptive Mastery System

- **Mastery scale**: 0-100 per concept per user
- **Scoring weights**: Easy correct +5 / wrong -8, Medium correct +8 / wrong -12, Hard correct +12 / wrong -5
- **Difficulty suggestion**: mastery <30 → easy, <60 → medium, ≥60 → hard
- **Adaptive difficulty distribution**: generates mix of easy/medium/hard questions based on current mastery — lower mastery gets more easy questions, higher mastery gets more hard
- **Consecutive tracking**: tracks consecutive correct/wrong answers per concept
- **Auto-concept extraction**: extracts concept names from test titles, question conceptTags, and AI concept extraction service

### Spaced Repetition (Concepts)

| Mastery Level | Next Review |
| ------------- | ----------- |
| < 30%         | 1 day       |
| 30-49%        | 3 days      |
| 50-69%        | 7 days      |
| 70-79%        | 14 days     |
| 80-89%        | 30 days     |
| ≥ 90%         | 60 days     |

- Dashboard shows "due for review" count
- Due concept list shows how many days overdue
- Practice session can target "due for review" concepts specifically

### Spaced Repetition (Flashcards — SM-2 Algorithm)

- **Quality scale**: 0 (forgot) to 5 (easy)
- **Quality < 3**: reset interval, schedule review in 10 minutes
- **Quality ≥ 3**: interval progression: 0→1→6→round(interval × easeFactor) days
- **Ease factor**: EF' = EF + (0.1 - (5-q) × (0.08 + (5-q) × 0.02)), minimum 1.3
- **Study modes**: "Due cards only" or "All cards"
- **Per-card tracking**: review count, correct count, interval, ease factor, next review date

### Achievements & Gamification (17 achievements)

| Category            | Achievements                                                      | Thresholds                     |
| ------------------- | ----------------------------------------------------------------- | ------------------------------ |
| **Streaks**         | First Steps, Week Warrior, Fortnight Fighter, Monthly Master      | 3, 7, 14, 30 days              |
| **Concept Mastery** | Concept Novice, Knowledge Builder, Concept Commander, Topic Titan | 5, 10, 25, 50 concepts at ≥80% |
| **Sessions**        | Practice Beginner, Session Specialist, Practice Pro, Century Club | 5, 25, 50, 100 sessions        |
| **Perfect Scores**  | First Perfect, Perfectionist, Flawless Master                     | 1, 5, 10 perfect 100%          |
| **Flashcards**      | Card Collector, Review Champion                                   | 25 cards created, 100 reviews  |

- Achievements initialized on user registration
- Progress tracked incrementally after each session/review
- SessionResultsPage shows newly earned achievements with celebration animations
- AchievementsPage shows all achievements with progress bars

### Test Sharing & Collaboration

- **Invite codes**: 8-character alphanumeric (ambiguity-safe alphabet: A-Z minus I/O, digits 2-9)
- **Public access**: anyone can take a test with just the code (anonymous with name entry)
- **Authenticated access**: auto-starts on page load, results linked to user profile
- **Leaderboard**: per-test scoreboard with top N scores, medal emojis (🥇🥈🥉)
- **Test lifecycle**: created → active → expired (by date or manual close by owner)
- **Owner analytics**: per-participant scores, individual answer review, test closure

### Review Test Generation

| Strategy            | Description                                       |
| ------------------- | ------------------------------------------------- |
| `wrong_recent`      | Regenerates questions from recent wrong answers   |
| `spaced_repetition` | Targets concepts due for review based on schedule |
| `mix`               | Combines wrong answers + spaced repetition        |
| `topic`             | Fresh AI generation on a specific topic           |

- Can target a specific past attempt or a base test
- Review tests marked separately (`is_review=1`)
- Listed in "Review Tests" tab on dashboard

### Recommendations Engine

5 priority tiers:

1. **Overdue reviews** (high) — concepts past their spaced repetition due date
2. **Weak concepts** (high) — concepts with mastery <40%
3. **Declining performance** (medium) — concepts where recent accuracy is dropping
4. **Related concepts** (medium) — concepts related to ones being studied
5. **Advanced topics** (low) — next-level concepts based on current mastery

Each recommendation includes: suggested question count, priority weight, reasoning text.

---

## API Endpoints

### Auth (`/api/v1/auth`)

| Method | Path        | Auth | Purpose                                                                             |
| ------ | ----------- | ---- | ----------------------------------------------------------------------------------- |
| POST   | `/register` | No   | Register (email, password, displayName). Rate-limited. Initializes all achievements |
| POST   | `/login`    | No   | Login → access + refresh tokens. Rate-limited                                       |
| POST   | `/refresh`  | No   | Refresh access token (rotates refresh token)                                        |
| GET    | `/me`       | Yes  | Get current user profile                                                            |
| PATCH  | `/me`       | Yes  | Update display name                                                                 |
| POST   | `/logout`   | Yes  | Revoke all refresh tokens                                                           |

### Tests (`/api/v1/tests`)

| Method | Path                           | Auth     | Purpose                                            |
| ------ | ------------------------------ | -------- | -------------------------------------------------- |
| POST   | `/generate`                    | Yes      | AI-generate test from topic/source text            |
| GET    | `/code/:code`                  | No       | Get test metadata + question shells by invite code |
| POST   | `/start`                       | Optional | Start attempt (anonymous or authenticated)         |
| POST   | `/submit`                      | Optional | Submit answers, auto-grade, extract concepts       |
| GET    | `/me/attempts`                 | Yes      | List user's attempts across all tests              |
| GET    | `/mine`                        | Yes      | List tests created by current user (paginated)     |
| GET    | `/:testId/attempts`            | Yes      | Owner: list all attempts for a test                |
| GET    | `/attempt/:attemptId`          | Yes      | Get attempt detail (hides answers for non-owners)  |
| GET    | `/:testId/attempts/:attemptId` | Yes      | Owner: full attempt detail with correct answers    |
| GET    | `/:testId/leaderboard`         | No       | Public leaderboard                                 |
| POST   | `/:testId/close`               | Yes      | Owner: close test immediately                      |
| POST   | `/review`                      | Yes      | Generate review/practice test                      |
| GET    | `/review/mine`                 | Yes      | List user's review tests                           |
| GET    | `/review/recommendations`      | Yes      | Practice recommendations from wrong answers        |

### Learning (`/api/v1/learning`) — All require auth

| Method | Path                              | Purpose                                                                |
| ------ | --------------------------------- | ---------------------------------------------------------------------- |
| GET    | `/dashboard`                      | Aggregated stats: mastery %, mastered count, due count, streak, weekly |
| GET    | `/concepts`                       | Concept list with filters/sorts/pagination                             |
| GET    | `/weak-concepts`                  | Top 10 weakest concepts                                                |
| GET    | `/due-reviews`                    | Concepts due for spaced repetition                                     |
| POST   | `/sessions/create`                | Create adaptive practice session                                       |
| POST   | `/sessions/:id/complete`          | Complete session: grade, update mastery, check achievements            |
| GET    | `/concepts/:name/details`         | Concept deep-dive                                                      |
| GET    | `/concepts/:name/attempts`        | All attempts for a concept                                             |
| POST   | `/concepts/:name/attempts/ensure` | Ensure concept has at least one attempt                                |
| GET    | `/concept-attempts`               | Query concept attempts with filters                                    |
| GET    | `/progress-chart`                 | Mastery trend data (week/month/quarter)                                |
| GET    | `/recommendations`                | Personalized learning recommendations                                  |
| GET    | `/achievements`                   | All user achievements with progress                                    |
| GET    | `/sessions/history`               | Practice session history                                               |

### Flashcards (`/api/v1/flashcards`) — All require auth

| Method | Path                              | Purpose                        |
| ------ | --------------------------------- | ------------------------------ |
| GET    | `/decks`                          | List all decks                 |
| POST   | `/decks`                          | Create deck                    |
| GET    | `/decks/:id`                      | Get deck with cards            |
| DELETE | `/decks/:id`                      | Delete deck and cards          |
| POST   | `/decks/:id/cards`                | Add card                       |
| PUT    | `/decks/:id/cards/:cardId`        | Update card                    |
| DELETE | `/decks/:id/cards/:cardId`        | Delete card                    |
| GET    | `/decks/:id/study`                | Get cards for study session    |
| POST   | `/decks/:id/cards/:cardId/review` | SM-2 review rating             |
| POST   | `/decks/:id/generate`             | AI-generate flashcards         |
| POST   | `/decks/from-attempt`             | Create deck from wrong answers |

### Users (`/api/v1/users`)

| Method | Path   | Auth | Purpose             |
| ------ | ------ | ---- | ------------------- |
| GET    | `/:id` | No   | Public user profile |

### System

| Method | Path      | Purpose      |
| ------ | --------- | ------------ |
| GET    | `/health` | Health check |

---

## Data Models

### users

| Field         | Type     | Description                        |
| ------------- | -------- | ---------------------------------- |
| id            | UUID     | Primary key                        |
| email         | string   | Unique, used for login             |
| password_hash | string   | bcrypt hashed                      |
| display_name  | string   | Shown on leaderboards and profiles |
| created_at    | datetime | Registration timestamp             |
| updated_at    | datetime | Last profile update                |

### tests

| Field                   | Type      | Description                                   |
| ----------------------- | --------- | --------------------------------------------- |
| id                      | UUID      | Primary key                                   |
| code                    | string(8) | Unique shareable invite code                  |
| title                   | string    | Test title                                    |
| source_text             | text      | Original source material (up to 50,000 chars) |
| source_filename         | string    | Original uploaded filename                    |
| model                   | string    | AI model used for generation                  |
| params_json             | JSON      | Generation parameters                         |
| questions_json          | JSON      | Full question array with answers              |
| time_limit_seconds      | int       | Time limit for test                           |
| expires_at              | datetime  | Expiry date                                   |
| created_by              | UUID FK   | Owner user ID                                 |
| is_review               | boolean   | Whether this is a review/practice test        |
| review_strategy         | string    | Review generation strategy used               |
| concepts_json           | JSON      | Extracted concepts                            |
| adaptive_mode           | boolean   | Whether adaptive difficulty was used          |
| difficulty_distribution | JSON      | Distribution of easy/medium/hard              |

### test_attempts

| Field            | Type     | Description                                 |
| ---------------- | -------- | ------------------------------------------- |
| id               | UUID     | Primary key                                 |
| test_id          | UUID FK  | Which test                                  |
| user_id          | UUID FK  | Authenticated user (nullable for anonymous) |
| participant_name | string   | Name entered for anonymous participants     |
| display_name     | string   | Display name for leaderboard                |
| started_at       | datetime | When attempt started                        |
| submitted_at     | datetime | When answers submitted                      |
| answers_json     | JSON     | All submitted answers                       |
| score            | int      | Final score percentage                      |
| session_id       | UUID FK  | Linked practice session (for learning flow) |

### user_concepts

| Field               | Type       | Description                  |
| ------------------- | ---------- | ---------------------------- |
| id                  | UUID       | Primary key                  |
| user_id             | UUID FK    | Owner                        |
| concept_name        | string     | Concept identifier           |
| mastery_level       | int(0-100) | Current mastery percentage   |
| total_attempts      | int        | Total questions attempted    |
| correct_attempts    | int        | Total correct answers        |
| last_practiced_at   | datetime   | Last practice timestamp      |
| next_review_due     | datetime   | Spaced repetition due date   |
| difficulty_level    | string     | Current suggested difficulty |
| consecutive_correct | int        | Streak of correct answers    |
| consecutive_wrong   | int        | Streak of wrong answers      |

### practice_sessions

| Field             | Type     | Description                                                        |
| ----------------- | -------- | ------------------------------------------------------------------ |
| id                | UUID     | Primary key                                                        |
| user_id           | UUID FK  | Owner                                                              |
| session_type      | enum     | quick_practice / focused_review / mastery_building / weak_concepts |
| concepts_json     | JSON     | Concepts targeted                                                  |
| target_difficulty | string   | Requested difficulty                                               |
| questions_total   | int      | Number of questions                                                |
| questions_correct | int      | Correct answers                                                    |
| score_percentage  | int      | Final score                                                        |
| test_id           | UUID FK  | Generated test                                                     |
| started_at        | datetime | Start time                                                         |
| completed_at      | datetime | Completion time                                                    |
| duration_seconds  | int      | Time spent                                                         |

### concept_practice_history

| Field               | Type    | Description                  |
| ------------------- | ------- | ---------------------------- |
| id                  | UUID    | Primary key                  |
| user_id             | UUID FK | Owner                        |
| concept_name        | string  | Which concept                |
| session_id          | UUID FK | Which session                |
| question_difficulty | string  | easy/medium/hard             |
| was_correct         | boolean | Result                       |
| mastery_before      | int     | Mastery before this question |
| mastery_after       | int     | Mastery after this question  |
| time_spent_seconds  | int     | Time on this question        |

### user_achievements

| Field            | Type     | Description                                         |
| ---------------- | -------- | --------------------------------------------------- |
| id               | UUID     | Primary key                                         |
| user_id          | UUID FK  | Owner                                               |
| achievement_type | string   | Category (streak/mastery/session/perfect/flashcard) |
| achievement_name | string   | Display name                                        |
| description      | string   | Description text                                    |
| progress         | int      | Current progress count                              |
| progress_total   | int      | Target threshold                                    |
| earned_at        | datetime | Null until earned                                   |

### flashcard_decks

| Field        | Type    | Description               |
| ------------ | ------- | ------------------------- |
| id           | UUID    | Primary key               |
| user_id      | UUID FK | Owner                     |
| title        | string  | Deck name                 |
| description  | string  | Deck description          |
| concept_name | string  | Linked concept (optional) |
| card_count   | int     | Number of cards           |

### flashcards

| Field         | Type     | Description             |
| ------------- | -------- | ----------------------- |
| id            | UUID     | Primary key             |
| deck_id       | UUID FK  | Parent deck             |
| front         | text     | Question side           |
| back          | text     | Answer side             |
| difficulty    | string   | Card difficulty         |
| interval_days | float    | SM-2 current interval   |
| ease_factor   | float    | SM-2 ease factor (≥1.3) |
| next_review   | datetime | When card is next due   |
| review_count  | int      | Times reviewed          |
| correct_count | int      | Times rated ≥3          |

### concept_relationships

| Field             | Type     | Description                       |
| ----------------- | -------- | --------------------------------- |
| id                | UUID     | Primary key                       |
| concept_name      | string   | Source concept                    |
| prerequisite_name | string   | Related/prerequisite concept      |
| relationship_type | enum     | prerequisite / related / advanced |
| strength          | int(1-5) | Relationship strength             |

---

## Pages (23 total)

| #   | Page                      | Route                                | Auth  | Description                                                                       |
| --- | ------------------------- | ------------------------------------ | ----- | --------------------------------------------------------------------------------- |
| 1   | HomePage                  | `/`                                  | No    | Landing page with quick-practice topic input, join-test-by-code, feature showcase |
| 2   | LoginPage                 | `/login`                             | No    | Email + password sign-in                                                          |
| 3   | RegisterPage              | `/register`                          | No    | Registration with email, password, display name                                   |
| 4   | LearningDashboardPage     | `/learning`                          | Yes   | Main learning hub: stats, concept grid, filters, recommendations                  |
| 5   | TopicStartPage            | `/learning/start`                    | Yes   | Quick start: choose source mode (AI/paste/upload), topic, question count          |
| 6   | PracticeSessionCreatePage | `/learning/practice/create`          | Yes   | Advanced session setup: type, concept strategy, difficulty, count                 |
| 7   | AchievementsPage          | `/learning/achievements`             | Yes   | All 17 achievements with progress bars                                            |
| 8   | SessionResultsPage        | `/learning/session/results`          | Yes   | Post-session: score, mastery changes, achievements, recommendations               |
| 9   | ConceptDetailPage         | `/learning/concepts/:name`           | Yes   | Concept deep-dive: chart, accuracy, history, prerequisites                        |
| 10  | FlashcardsPage            | `/flashcards`                        | Yes   | Deck list, create deck                                                            |
| 11  | FlashcardDeckPage         | `/flashcards/:deckId`                | Yes   | Deck detail: cards tab, study tab, AI generate tab                                |
| 12  | DashboardPage             | `/my-tests`                          | Yes   | Test management: my tests, my results, review tests                               |
| 13  | CreateTestPage            | `/create`                            | Yes   | Generate shareable test from topic or file                                        |
| 14  | TestGeneratedPage         | `/generated`                         | No    | Post-generation: shareable link + code                                            |
| 15  | TestLandingPage           | `/code/:code`                        | No    | Public test entry: title, questions, time limit, leaderboard, start               |
| 16  | TestTakingPage            | `/attempt`                           | Mixed | Take test: one question at a time, MCQ/TF/Short, timer, progress                  |
| 17  | TestTakingPage            | `/preview`                           | Mixed | Preview generated test before sharing                                             |
| 18  | StudentResultsPage        | `/results`                           | Yes   | Post-test: score, wrong answers, create flashcards from mistakes                  |
| 19  | TestAnalyticsPage         | `/tests/:id/analytics`               | Yes   | Test owner: participant list, scores, close test                                  |
| 20  | AttemptDetailPage         | `/tests/:testId/attempts/:attemptId` | Yes   | Owner view: participant's full answers with correct answers                       |
| 21  | MyAttemptDetailPage       | `/attempts/:attemptId`               | Yes   | Participant view: own answers with hints (no correct answers exposed)             |
| 22  | ProfilePage               | `/profile`                           | Yes   | Edit display name                                                                 |
| 23  | ReviewTestLandingPage     | `/review-tests/:code`                | Yes   | Review test entry with auto-start                                                 |

---

## Components

| Component            | Purpose                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Header               | Fixed top navbar: logo, nav links (Learn, Flashcards, Achievements, My Tests, Create, Profile), mobile menu, auth buttons |
| Button               | Reusable styled button (primary/secondary/danger variants)                                                                |
| Icons                | SVG icon library (Logo, Arrow, Upload, Clock, Calendar, Copy, Check, User, etc.)                                          |
| Leaderboard          | Per-test scoreboard widget: top N with medal emojis                                                                       |
| LearningComponents   | Shared learning UI: MasteryProgressBar, ConceptTag, DifficultyIndicator, StreakCounter, LevelBadge, StatCard              |
| RecommendationsPanel | AI-prioritized practice suggestions with action buttons                                                                   |
| ReviewGeneratorModal | Modal for configuring review test generation strategy                                                                     |

---

## Security

| Feature                  | Implementation                                            |
| ------------------------ | --------------------------------------------------------- |
| Password hashing         | bcrypt, 10 salt rounds                                    |
| JWT auth                 | Access tokens (15m), refresh tokens (7d), configurable    |
| Token rotation           | Old refresh token revoked on each refresh                 |
| Rate limiting            | express-rate-limit on auth endpoints                      |
| Security headers         | Helmet (CSP, HSTS, X-Frame-Options, etc.)                 |
| Input validation         | Zod schemas on every endpoint                             |
| SQL injection prevention | Parameterized queries everywhere                          |
| Ownership enforcement    | Tests, attempts, sessions, flashcards — all check user_id |
| Answer hiding            | Correct answers never sent to non-owner participants      |
| Invite codes             | 8-char ambiguity-safe alphabet (no I/O/0/1)               |

---

## Environment Configuration

| Variable               | Required | Default              | Description                        |
| ---------------------- | -------- | -------------------- | ---------------------------------- |
| `JWT_ACCESS_SECRET`    | Yes      | —                    | Secret for signing access tokens   |
| `JWT_REFRESH_SECRET`   | Yes      | —                    | Secret for signing refresh tokens  |
| `OPENROUTER_API_KEY`   | Yes      | —                    | OpenRouter API key for AI features |
| `PORT`                 | No       | 4000                 | Backend server port                |
| `DB_FILE`              | No       | `data/app.db`        | SQLite database file path          |
| `LOG_LEVEL`            | No       | `info`               | Pino log level                     |
| `DRY_RUN_AI`           | No       | `false`              | Mock AI responses for testing      |
| `AI_SCHEMA_JSON`       | No       | `true`               | Use structured JSON schema output  |
| `OPENROUTER_MODEL`     | No       | `openai/gpt-4o-mini` | Default AI model                   |
| `JWT_ACCESS_EXPIRY`    | No       | `15m`                | Access token lifetime              |
| `JWT_REFRESH_EXPIRY`   | No       | `7d`                 | Refresh token lifetime             |
| `RATE_LIMIT_WINDOW_MS` | No       | `900000`             | Rate limit window (15 min)         |
| `RATE_LIMIT_MAX`       | No       | `100`                | Max requests per window            |

---

## Tech Stack Summary

- **Frontend**: React 19.1, Vite 7.3, Tailwind CSS, React Router v6, pdfjs-dist (lazy-loaded for PDF parsing)
- **Backend**: Express 5.1, sql.js (SQLite), Zod, Pino, bcrypt, jsonwebtoken, helmet, cors, express-rate-limit, uuid
- **AI Provider**: OpenRouter API (proxies to OpenAI GPT-4o-mini / GPT-4o)
- **Testing**: Jest (backend), Supertest for API tests
- **Build**: Vite with code-splitting (main ~385KB + lazy PDF chunk ~411KB gzipped)
