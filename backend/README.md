# AI Learn Backend

Express + SQLite (pure WASM via sql.js) backend scaffold following best practices, prepared for future AI-enhanced learning features.

## Stack

-   Node.js (ES Modules)
-   Express 5
-   SQLite (sql.js wasm, no native build)
-   Auth: JWT access + refresh rotation
-   Validation: Zod
-   Logging: Pino
-   Security: Helmet, CORS, Rate limiting
-   Testing: Jest + Supertest

## Structure

```
backend/
  data/                # SQLite db files (ignored in VCS ideally)
  logs/                # Future log output
  src/
    app.js             # App factory
    server.js          # Startup entry
    config/            # env & logger
    db/                # DB init + migrations
      migrations/      # .sql migration files
    repositories/      # Data access layer
    services/          # Business logic (authService)
    controllers/       # HTTP handlers
    routes/            # Express routers
    middleware/        # Auth, validation, error, logging
    utils/             # Schemas etc.
  tests/               # Jest tests
```

## Environment Variables

See `.env.example`:

-   `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (generate secure random 32+ bytes)
-   Expiry config: `JWT_ACCESS_EXPIRES` (default 15m), `JWT_REFRESH_EXPIRES` (default 1d in dev, configure as needed)
-   `OPENROUTER_API_KEY` (required for real AI generation, omit / leave blank when DRY_RUN_AI=true)
-   `OPENROUTER_MODEL` (model id used for generation; request body no longer accepts model)
-   `AI_SCHEMA_JSON` (set to `false` to disable json_schema forcing and use fallback prompt parsing)
-   `OPENROUTER_SITE_URL` / `OPENROUTER_SITE_TITLE` (optional meta headers for OpenRouter)
-   `DRY_RUN_AI` (true = generate fake questions, skips network)

## Scripts

-   `npm run dev` start with nodemon
-   `npm start` production start
-   `npm test` run tests
    (Migrations auto-run on startup; no separate migrate script needed)

## Auth Endpoints

Base: `/api/v1/auth`

-   `POST /register` { email, password, displayName? }
-   `POST /login` { email, password }
-   `POST /refresh` { refreshToken }
-   `GET /me` (Bearer access token)
-   `POST /logout` (Bearer access token) : revokes all refresh tokens for user

Refresh token rotation: each refresh call revokes the used token & issues a new pair.

## Future AI Features (Roadmap Ideas)

-   Personalized learning path recommender service (vector store + embeddings)
-   Content difficulty adaptation middleware
-   Chat-based tutor endpoint (OpenAI / local LLM abstraction)
-   Activity event tracking + analytics
-   Rate limiting customization per user plan

## Development Quick Start

1. Copy `.env.example` to `.env` and fill secrets
2. Install deps: `npm install`
3. Start dev: `npm run dev`
4. Run tests: `npm test`

## Testing

Tests create a separate SQLite file `data/test.db` to keep data isolated. Add more tests in `tests/` following the existing pattern.

## Standardized Error Responses

All errors are returned with a consistent JSON envelope:

```
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human-readable message",
    "details": [ /* optional array for validation or contextual info */ ]
  }
}
```

### Conventions

-   `code` is stable (UPPER_SNAKE_CASE) and suitable for client branching / i18n.
-   `message` is concise and human-readable (not for parsing).
-   `details` appears mainly for validation errors (Zod issues) or when extra structured info is useful.
-   Unknown / unhandled exceptions are mapped to `INTERNAL_SERVER_ERROR` (500) without leaking internal stack traces.

### Common HTTP Status -> Code Mapping

| HTTP | Code                                          | Typical Scenario                                     |
| ---- | --------------------------------------------- | ---------------------------------------------------- |
| 400  | VALIDATION_ERROR / BAD_REQUEST                | Zod validation failed / malformed input              |
| 400  | ALREADY_SUBMITTED                             | Attempt already submitted                            |
| 401  | UNAUTHORIZED / INVALID_CREDENTIALS            | Auth required or bad login                           |
| 401  | INVALID_REFRESH_TOKEN / EXPIRED_REFRESH_TOKEN | Refresh token invalid/expired                        |
| 401  | INVALID_TOKEN / AUTH_REQUIRED                 | Access token missing or invalid for protected action |
| 403  | FORBIDDEN_ATTEMPT_SUBMIT                      | User not owner of attempt                            |
| 403  | FORBIDDEN_TEST_ATTEMPTS_LIST                  | Non-owner listing test attempts                      |
| 404  | TEST_NOT_FOUND / ATTEMPT_NOT_FOUND            | Resource lookup failed                               |
| 409  | EMAIL_TAKEN / CONFLICT                        | Unique constraint conflict (e.g. register)           |
| 410  | TEST_EXPIRED                                  | Test expired before action                           |
| 429  | RATE_LIMITED                                  | Rate limiter triggered                               |
| 500  | INTERNAL_SERVER_ERROR                         | Unhandled server error                               |

### Validation Error Shape

For input validation failures (Zod), status 400 and:

```
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation error",
    "details": [
      { "path": ["body","email"], "message": "Invalid email", "code": "invalid_string" },
      { "path": ["body","password"], "message": "String must contain at least 8 character(s)", "code": "too_small" }
    ]
  }
}
```

### Example: Expired Test

```
HTTP/1.1 410 Gone
{
  "error": {
    "code": "TEST_EXPIRED",
    "message": "Test expired"
  }
}
```

### Example: Duplicate Submission

```
HTTP/1.1 400 Bad Request
{
  "error": {
    "code": "ALREADY_SUBMITTED",
    "message": "Already submitted"
  }
}
```

### Client Handling Tips

-   Branch on `error.code` rather than status for granular UX.
-   For validation, map each `details[i].path` array to form fields.
-   Implement a generic toast/banner for unknown `INTERNAL_SERVER_ERROR`.
-   Consider telemetry/logging of unexpected codes on the frontend.

### Future Error Enhancements

-   Correlation / request ID in error envelope
-   Localization of messages (clients decide language based on `code`)
-   Machine actionable `meta` object for rate limit resets, retry hints, etc.

## Notes

-   CORS currently allows all origins; tighten for production.
-   Consider adding ESLint & Prettier config.
-   Add centralized domain errors for richer error responses.
-   Add refresh token reuse detection for enhanced security.

MIT License

## Test Generation & Attempts API

Flow summary:

1. Authenticated user uploads or provides plain text content and requests generation.
2. Backend (if `DRY_RUN_AI=false`) calls OpenRouter chat completions with JSON schema forcing structured quiz output, else produces mock data.
3. Test stored with an invitation `code` + expiry + time limit.
4. Any participant (even anonymous) starts an attempt by code + name.
5. Participant submits answers (scoring currently placeholder / null).

### Endpoints

Base: `/api/v1/tests`

| Method | Path                | Auth     | Purpose                                                                  |
| ------ | ------------------- | -------- | ------------------------------------------------------------------------ |
| POST   | `/generate`         | Required | Generate & persist a test from provided text (uses env OPENROUTER_MODEL) |
| GET    | `/code/:code`       | Public   | Fetch test metadata & question shells (no answers)                       |
| POST   | `/start`            | Public   | Start an attempt (name + code)                                           |
| POST   | `/submit`           | Public   | Submit answers for an attempt                                            |
| GET    | `/:testId/attempts` | Owner    | List attempts (id, participant/display names, score, timestamps)         |
| GET    | `/me/attempts`      | Auth     | List authenticated user attempts with scores                             |
| GET    | `/attempt/:attemptId` | Auth   | Participant view of own attempt answers (hides correct answers)          |
| GET    | `/:testId/attempts/:attemptId` | Owner | Owner view full attempt answers incl. correct answers         |
| GET    | `/:testId/leaderboard` | Public | Leaderboard (top scored attempts; only attempts with score)              |
| POST   | `/:testId/close`    | Owner    | Close test early (sets expiry to past)                                   |

User profile:

| Method | Path              | Auth | Purpose                 |
| ------ | ----------------- | ---- | ----------------------- |
| PATCH  | `/api/v1/auth/me` | Auth | Update user displayName |

### Generate Body (Updated)

```
{
  "title": "Algebra Basics",
  "questionCount": 10,
  "difficulty": "medium",
  "timeLimitSeconds": 900,
  "expiresInMinutes": 1440,
  "extraInstructions": "Focus on linear equations",
  "sourceText": "... user supplied study text ...",
  "filename": "algebra.txt",
  "params": {"topic": "algebra"}
}
```

Response: `{ id, code, expiresAt, timeLimitSeconds }`

### OpenRouter JSON Schema Strategy & Fallback

Service first tries `response_format.json_schema` (unless `AI_SCHEMA_JSON=false`), and on 400 schema unsupported errors automatically retries without schema, parsing JSON from the raw content with a robust extractor.

### Invitation Code

Random 8-char Base32-like (no ambiguous chars). Used for public sharing.

### Expiration & Time Limit

`expiresInMinutes` sets test lifetime; participants starting before expiry get full `timeLimitSeconds` countdown on frontend.

### Attempts & Scoring

Submissions now persist per-question answers in `test_attempt_answers` plus JSON summary in attempt row. Score is percentage of questions with both a correct answer key and a user answer matching (case-insensitive). If no answer keys, score is null. Future: partial credit & freeform AI evaluation.

### Attempt Visibility & Answer Redaction

- Participant (GET `/api/v1/tests/attempt/:attemptId`):
  - Must be the user who owns the attempt (if `user_id` linked) OR the test owner.
  - Returns each question with `userAnswer` and `correct` boolean.
  - Field `correctAnswer` is omitted unless requester is test owner.
- Owner (GET `/api/v1/tests/:testId/attempts/:attemptId`):
  - Must be creator of the test.
  - Always receives `correctAnswer` and an `isCorrect` boolean per answer.

Leaderboard (GET `/api/v1/tests/:testId/leaderboard`):

- Sorted descending by score (null scores excluded) then by earliest submission.
- Limit defaults to 10 (capped at 100). Returns participant & display names, score, submittedAt.

Closing a Test (POST `/api/v1/tests/:testId/close`):

- Owner only; sets `expires_at` to a past timestamp so further `/start` calls return `TEST_EXPIRED` (410).

### New Error Codes

| Code                          | Status | Scenario                                                |
| ----------------------------- | ------ | ------------------------------------------------------- |
| FORBIDDEN_ATTEMPT_DETAIL      | 403    | User tries to view another user's attempt (participant) |
| FORBIDDEN_ATTEMPT_DETAIL_OWNER| 403    | Non-owner requests owner attempt detail                 |
| FORBIDDEN_CLOSE_TEST          | 403    | Non-owner attempts to close a test                      |
| ATTEMPT_NOT_SUBMITTED         | 400    | Attempt detail requested before submission              |

Existing codes (TEST_EXPIRED, ALREADY_SUBMITTED, etc.) apply unchanged.

Anonymous attempts may include optional `displayName` separate from mandatory `participantName`.

Tests store `created_by` (user id of generator) enabling owner-only attempt listings.

### Environment Considerations

-   Keep `DRY_RUN_AI=true` in development to avoid API costs.
-   When enabling real generation ensure secrets set and consider rate-limiting / quotas.

### Future Enhancements

-   Per-question adaptive difficulty
-   Streaming generation progress
-   Answer key encryption
-   AI-based scoring for free-form responses
