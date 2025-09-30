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
-   Expiry config: `JWT_ACCESS_EXPIRES` (default 15m), `JWT_REFRESH_EXPIRES` (default 7d)
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

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/generate` | Required | Generate & persist a test from provided text (uses env OPENROUTER_MODEL) |
| GET | `/code/:code` | Public | Fetch test metadata & question shells (no answers) |
| POST | `/start` | Public | Start an attempt (name + code) |
| POST | `/submit` | Public | Submit answers for an attempt |
| GET | `/:testId/attempts` | Owner | List attempts (id, participant/display names, score, timestamps) |
| GET | `/me/attempts` | Auth | List authenticated user attempts with scores |

User profile:

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| PATCH | `/api/v1/auth/me` | Auth | Update user displayName |

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

Anonymous attempts may include optional `displayName` separate from mandatory `participantName`.

Tests store `created_by` (user id of generator) enabling owner-only attempt listings.

### Environment Considerations
- Keep `DRY_RUN_AI=true` in development to avoid API costs.
- When enabling real generation ensure secrets set and consider rate-limiting / quotas.

### Future Enhancements
- Per-question adaptive difficulty
- Streaming generation progress
- Answer key encryption
- AI-based scoring for free-form responses
