# Architecture

A personal food diary. The user logs the meals they eat; a dietician reviews a
printed Report offline. The app does no nutritional analysis — it is an
interface facilitator. See [CONTEXT.md](./CONTEXT.md) for domain vocabulary and
[docs/adr/](./docs/adr/) for the decisions behind the choices below.

## Shape

Single SvelteKit project (ADR 0003), built with `@sveltejs/adapter-cloudflare`
for the Cloudflare Workers + static-assets model and deployed via Workers Builds
(Git integration).

```
Browser (responsive web app, home-screen manifest)
   |
   |  fetch, behind Cloudflare Access (see Auth below)
   v
Cloudflare Worker: static assets (ASSETS binding) + SvelteKit SSR + API
   |                                (src/routes/api/**/+server.ts)
   v
Cloudflare D1 (SQLite) — entries and photo bytes
```

Everything runs on the Cloudflare free tier (ADR 0001): Workers, D1. No R2
(ADR 0004). No offline support — the server is the single source of truth.

## Data model

- `meal_entry`: `id` (ULID), `eaten_at` (text `YYYY-MM-DDTHH:MM`, Europe/Paris
  wall-clock — ADR 0002), `meal_type` (`breakfast|lunch|dinner|snack`),
  `description` (nullable), `note` (nullable), `created_at`, `updated_at`.
  A row must have a `description` or at least one photo.
- `photo`: `id` (ULID), `meal_entry_id` (FK, cascade delete), `bytes` (BLOB —
  the resized JPEG, ADR 0004), `content_type`, `position`, `created_at`.
  Max 5 per entry. List/get queries select photo metadata only, never `bytes`.
- Entry delete cascades to its photo rows in SQL.
- `weigh_in`: `id` (ULID), `measured_at` (text `YYYY-MM-DDTHH:MM`, Paris
  wall-clock), `weight_kg` (real), `fasted` (0/1), `clothed` (0/1),
  `created_at`, `updated_at`. Two independent condition flags. A separate time
  series from `meal_entry`; multiple per day.
- `workout`: `id` (ULID), `started_at` (text `YYYY-MM-DDTHH:MM`, Paris
  wall-clock), `duration_min` (integer, entered in 15-min steps), `workout_type`
  (enum — see `WORKOUT_TYPES` in `src/lib/types.ts`; boxing plus cross-training),
  `description` (not null), `feeling` (nullable), `intensity` (integer 1–10),
  `created_at`, `updated_at`. A third time series, parallel to `meal_entry` and
  `weigh_in`; multiple per day. Boxing-training context.

Migrations are Wrangler D1 migration files in `migrations/`, applied manually.
Backup relies on D1 Time Travel, plus a manual `wrangler d1 export` before risky
migrations.

## API

REST-ish, all under `/api` and gated by Cloudflare Access:

- `GET /api/entries?from=&to=` · `POST /api/entries`
- `GET|PATCH|DELETE /api/entries/:id`
- `POST /api/entries/:id/photos` (receives an already-resized JPEG blob,
  stored inline in D1) · `DELETE /api/photos/:id`
- `GET /api/frequent-items?mealType=` — SQL aggregate ranking past
  Descriptions by frequency and recency
- `GET /photos/:id` — reads the blob from D1, long cache header
- `GET /api/weigh-ins?from=&to=` · `POST /api/weigh-ins` ·
  `GET|PATCH|DELETE /api/weigh-ins/:id`
- `GET /api/workouts?from=&to=` · `POST /api/workouts` ·
  `GET|PATCH|DELETE /api/workouts/:id`

The Report is not a server feature: the frontend calls `GET /api/entries`,
`GET /api/weigh-ins` and `GET /api/workouts` for a date range and renders a
print layout.

## Client logic worth testing (Vitest, test-first)

- `mealTypeForTime(date)` — 06–11 breakfast, 11–15 lunch, 15–18 snack,
  18–23 dinner
- `rankFrequentItems(entries, mealType)` — frequency x recency
- `validateEntry(input)` — the description-or-photo rule
- `validateWeighIn(input)` — weight range, time format, condition
- `validateWorkout(input)` — time format, duration range, type, description
  required, intensity 1–10
- `interpretTranscript(text, confidence)` — dictation usable vs re-ask
- `buildTimeline(entries, weighIns, workouts, options)` — merges meals,
  weigh-ins and workouts into one time-sorted stream per day. The Report calls
  it with `{ from, to }` (ascending, empty days included); the journal calls it
  with `{ order: 'desc' }` (newest day and newest item first, no empty days).
  When items share a minute: weigh-in, then workout, then meal.

Photos are resized client-side before upload: longest edge 1280px, JPEG quality
~0.72, via `<canvas>`, no library.

Voice: `src/lib/voice.ts` wraps the browser `SpeechRecognition` API (fr-FR,
feature-detected). The `VoiceInput` component is an inline dictate button reused
by `EntryForm` and `WorkoutForm`; its `autostart` prop makes it begin listening
on mount. Every home voice shortcut opens the matching add form with `?voice=1`
(`/add`, `/add?type=collation`, `/sport/add`) and drops the transcript straight
into the description field — the user reviews and completes the other fields
before saving. No server-side transcription, no auto-create.

## Auth

There are no user accounts. Cloudflare Access sits in front of the deployment
(configured in the Cloudflare dashboard, not in code) and adds a signed JWT on
every request. `src/hooks.server.ts` verifies that JWT (`src/lib/server/auth.ts`)
against the team JWKS, checking the audience tag and that the email matches
`ALLOWED_EMAIL`, so a request that bypasses Access is still rejected. When
`CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD` / `ALLOWED_EMAIL` are unset (local
dev), verification is skipped.

`jose` is used for JWT verification, so the Worker needs the `nodejs_compat`
compatibility flag (set in `wrangler.toml`).

## Deployment

Cloudflare Workers Builds (Git integration) — push to `main` runs
`npm run build` and `wrangler deploy`; non-production branches get
`wrangler versions upload` previews. No separate CI pipeline. Schema changes
need `npm run db:migrate:remote` run by hand.
