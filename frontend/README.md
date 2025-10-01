# AI Learn Frontend

React + Vite + Tailwind frontend aligned with the backend's clean layering philosophy. Includes:

-   Real authentication (login / register / refresh rotation)
-   Protected test generation from uploaded .txt content
-   Polling-based async test build (generate -> poll by code until questions ready)
-   Preview + timer + share link + copyable code
-   Dynamic test metadata (title, difficulty, time, expiration, extra instructions)

All test & attempt interactions now flow through backend endpoints; mock data has been removed. A listing endpoint for "my created tests" is not yet present, so the dashboard shows guidance and your personal attempts.

## Stack

-   React 19 (functional components)
-   React Router v6 for routing
-   Tailwind CSS for utility-first styling
-   Context API for light-weight state (Auth + Test data)
-   Vite for build & dev server

## Structure

```
frontend/
	src/
		components/        # Reusable presentational components (Button, Header, Icons)
		contexts/          # Context providers (AuthContext, TestDataContext)
		pages/             # Route-level screens
		mocks/             # Mock data (tests, results, preview test)
		utils/             # Small pure helpers (clipboard)
		App.jsx            # Route composition
		main.jsx           # App bootstrap (providers + router)
		index.css          # Tailwind entry + global tweaks
	tailwind.config.js
	postcss.config.js
```

## State Management Philosophy

Keep it simple until complexity proves otherwise:

-   Global auth + test data use React Context (no Redux needed yet).
-   Mock data isolated in `mocks/data.js` so replacement with fetch calls is trivial.
-   Derived lookups (e.g. `getTestById`) kept inside the provider value to avoid recomputing.
-   Keep write operations minimal (only `addTest` for now) – expand with domain-specific mutations later.

If API integration grows, introduce a lightweight data fetching layer (React Query / TanStack Query) rather than prematurely adding global state libraries.

## Implemented API Integration

Auth flow implemented (`/api/v1/auth/{register,login,refresh,me,logout,me PATCH}`):

-   `AuthContext` delegates to `apiClient` which injects the access token & silently refreshes on 401 using the stored refresh token.
-   Tokens + user persisted in `localStorage` (key: `auth`).
-   On app start we attempt `/me` once to hydrate the user (no repeat hammering).
-   Logout revokes all refresh tokens then clears local storage.

Test Generation & Preview Flow:

1. User uploads a `.txt` file (only `.txt` supported currently) on `CreateTestPage`.
2. Text is read client-side via `File.text()`, normalized (line endings + condensed blank lines).
3. User sets: title, question count, time limit (minutes), difficulty, expiration (minutes), optional extra instructions.
4. Client sends `POST /api/v1/tests/generate` with body:
    ```jsonc
    {
        "title": "Intro Biology",
        "questionCount": 20,
        "difficulty": "easy", // easy | medium | hard
        "timeLimitSeconds": 1800, // derived from minutes slider
        "expiresInMinutes": 60,
        "sourceText": "<normalized file text>",
        "extraInstructions": "Emphasize definitions"
    }
    ```
5. Response returns at least a `code` (short identifier).
6. Frontend polls `GET /api/v1/tests/code/{code}` every 1.5s (timeout 120s) until a payload with a non-empty `questions` array is returned.
7. Completed test (with questions + timing metadata) is stored in `TestDataContext.previewTest` and user is navigated to the preview / taking page.
8. Countdown timer (seconds) renders using `timeLimitSeconds` and auto-submits (navigates to generated page) at zero.
9. Share link + raw test code are copyable from both the preview header and the generated confirmation page.
10. Anyone with the code can visit `/code/:code`, enter a participant name, start an attempt (public), and then answer questions at `/attempt`.

Error Handling:

-   Unsupported file types or empty file → inline error.
-   Poll timeout (120s) → user sees timeout error & can retry.
-   Abort (Cancel) button lets user stop generation mid-poll.

Extensibility:

-   Add PDF/DOCX by swapping `readTextFile` with an extraction pipeline (web worker + WASM parser or backend pre-process endpoint).
-   Replace polling with server-sent events or WebSocket when backend supports push status updates.

## Environment Variables

Set API base (defaults to `http://localhost:4000`). Create `.env` in the `frontend` root:

```
VITE_API_BASE=http://localhost:4000
```

## Adding Further API Features

1. Add endpoint for listing tests created by current user (to populate dashboard).
2. Introduce optimistic UI + caching (consider TanStack Query) if data frequency grows.
3. Expand file ingestion to PDF/DOCX (drag-drop -> extract text -> send `sourceText`).
4. Persist in-progress generation across navigation (store code + continue polling if page refreshed).
5. Enhance attempt submission summary page with score + per-question breakdown.
6. SSE / WebSocket for real-time generation progress (replace polling).

## Development

Install deps:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Styling

Tailwind configured with content scanning across `index.html` and all source files. Add design tokens via `theme.extend` in `tailwind.config.js` as the design system evolves.

## Accessibility & UX Notes

-   Buttons are semantic `<button>` elements with clear focus rings via Tailwind focus utilities.
-   Color choices rely on Tailwind defaults; add custom palette later for brand AA contrast.
-   Clipboard helper uses async API then falls back for legacy support.

## Next Steps / Roadmap

-   List user's generated tests (requires backend feature).
-   Add validation (Zod) to forms (login/register/generate/start attempt/submit) for schema parity.
-   Add dedicated error & loading components (skeletons, toasts).
-   Score & answer review page after submission.
-   Analytics fetch for attempts per test owner.
-   Persist generation + resume polling after refresh.
-   Domain caching layer (TanStack Query) if API usage increases.

## License

MIT
