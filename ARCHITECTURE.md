# Architecture

A personal food diary. The user logs the meals they eat; a dietician reviews a
printed Report offline. The app does no nutritional analysis — it is an
interface facilitator. See [CONTEXT.md](./CONTEXT.md) for domain vocabulary and
[docs/adr/](./docs/adr/) for the decisions behind the choices below.

## Shape

Single SvelteKit project deployed to Cloudflare Pages (ADR 0003).

```
Browser (responsive web app, home-screen manifest)
   |
   |  fetch, behind Cloudflare Access (see Auth below)
   v
SvelteKit server routes  =  the API   (src/routes/api/**/+server.ts)
   |                         |
   v                         v
Cloudflare D1 (SQLite)    Cloudflare R2 (meal photos)
```

Everything runs on the Cloudflare free tier (ADR 0001): Pages, Functions, D1,
R2. No offline support — the server is the single source of truth.

## Data model

- `meal_entry`: `id` (ULID), `eaten_at` (text `YYYY-MM-DDTHH:MM`, Europe/Paris
  wall-clock — ADR 0002), `meal_type` (`breakfast|lunch|dinner|snack`),
  `description` (nullable), `note` (nullable), `created_at`, `updated_at`.
  A row must have a `description` or at least one photo.
- `photo`: `id` (ULID), `meal_entry_id` (FK, cascade delete), `r2_key`,
  `position`, `created_at`. Max 5 per entry.
- R2 objects at `photos/{meal_entry_id}/{photo_id}.jpg`. Entry delete removes
  the rows, then best-effort deletes the R2 objects.

Migrations are Wrangler D1 migration files in `migrations/`, applied manually.
Backup relies on D1 Time Travel, plus a manual `wrangler d1 export` before risky
migrations.

## API

REST-ish, all under `/api` and gated by Cloudflare Access:

- `GET /api/entries?from=&to=` · `POST /api/entries`
- `GET|PATCH|DELETE /api/entries/:id`
- `POST /api/entries/:id/photos` (receives an already-resized JPEG blob,
  streams to R2) · `DELETE /api/photos/:id`
- `GET /api/frequent-items?mealType=` — SQL aggregate ranking past
  Descriptions by frequency and recency
- `GET /photos/:key` — streams from R2 with a long cache header

The Report is not a server feature: the frontend calls `GET /api/entries` for a
date range and renders a print layout.

## Client logic worth testing (Vitest, test-first)

- `mealTypeForTime(date)` — 06–11 breakfast, 11–15 lunch, 15–18 snack,
  18–23 dinner
- `rankFrequentItems(entries, mealType)` — frequency x recency
- `validateEntry(input)` — the description-or-photo rule
- Report date grouping (including empty days shown as "no entries logged")

Photos are resized client-side before upload: longest edge 1280px, JPEG quality
~0.72, via `<canvas>`, no library.

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

Cloudflare Pages Git integration — push to `main` auto-builds and deploys;
branches get preview deployments. No separate CI pipeline.
