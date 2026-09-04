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

The Report is not a server feature: the frontend calls `GET /api/entries` and
`GET /api/weigh-ins` for a date range and renders a print layout.

## Client logic worth testing (Vitest, test-first)

- `mealTypeForTime(date)` — 06–11 breakfast, 11–15 lunch, 15–18 snack,
  18–23 dinner
- `rankFrequentItems(entries, mealType)` — frequency x recency
- `validateEntry(input)` — the description-or-photo rule
- `validateWeighIn(input)` — weight range, time format, condition
- `interpretTranscript(text, confidence)` — dictation usable vs re-ask
- `buildReportTimeline(entries, weighIns, from, to)` — one time-sorted stream
  per day across the range, empty days included

Photos are resized client-side before upload: longest edge 1280px, JPEG quality
~0.72, via `<canvas>`, no library.

Voice: `src/lib/voice.ts` wraps the browser `SpeechRecognition` API (fr-FR,
feature-detected). `/dicter` auto-starts it, creates the entry from the
transcript + time-of-day meal type, and lands on the entry's edit page.
`EntryForm` also has an inline dictate button. No server component.

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
