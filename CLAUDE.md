# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-user food diary (see `CONTEXT.md` for vocabulary, `ARCHITECTURE.md` for
the design, `docs/adr/` for decisions). The app captures meal entries; a
dietician reviews a printed Report offline. No nutritional analysis, no accounts.

## Commands

```sh
npm test                     # Vitest — domain logic in src/lib/domain/*.test.ts
npm run test:watch
npx vitest run src/lib/domain/mealType.test.ts   # a single file
npm run check                # svelte-check + tsc
npm run dev                  # UI only; API routes return 503 (no CF bindings)

npm run db:migrate:local && npm run preview       # full local stack (wrangler dev)
```

`npm run preview` builds then runs `wrangler dev`, which reads bindings from
`wrangler.toml` and uses the local D1 that `db:migrate:local` populates. This is
a **Workers** project (`main` + `[assets]` in `wrangler.toml`), not Pages — use
`wrangler dev`, not `wrangler pages dev`.

## Architecture notes that span files

- **API = SvelteKit server routes** under `src/routes/api/**`, plus the photo
  stream at `src/routes/photos/[id]`. All of it is gated by
  `src/hooks.server.ts` (Cloudflare Access JWT check, no-op when unconfigured).
- **Persistence** is `src/lib/server/repo.ts` only — the D1 calls live there
  and nowhere else. Routes call the repo; the repo maps rows to the `MealEntry`
  shape in `src/lib/types.ts`.
- **Photos live in D1** as BLOBs (ADR 0004), not R2. Never `SELECT` the `bytes`
  column in a list query — `repo.ts` selects photo metadata only and fetches
  bytes one row at a time via `getPhotoBytes`.
- **Domain logic is pure and tested**: `mealType`, `frequentItems`,
  `validateEntry`, `validateWeighIn`, `interpretTranscript`, `reportTimeline`
  under `src/lib/domain/`. Both the client (`EntryForm` / `WeighInForm`) and the
  server routes import the same functions. Change behaviour here test-first.
  `buildTimeline` merges meals and weigh-ins by day for both the journal
  (`+page.svelte`, newest-first, no empty days) and the Report (ascending,
  empty days shown) — one function, different options.
- **Voice**: `src/lib/voice.ts` wraps browser `SpeechRecognition` (fr-FR). The
  `/dicter` route auto-starts dictation and creates an entry from the transcript
  + time-of-day meal type. No server-side transcription. The home 🍽️/🍌 FABs
  point here; `?type=collation` forces the Snack meal type.
- **Weigh-ins** (`/poids`, `weigh_in` table) are a second time series parallel
  to meal entries — same shape of code (repo fns, `/api/weigh-ins` routes,
  list/add/edit pages). Not linked to `meal_entry`. Weight input is the
  `WeightWheel` component (CSS scroll-snap 0.1 kg picker); a new weigh-in
  defaults to the last recorded weight (loaded in `poids/add/+page.ts`).
  Conditions are two independent booleans (`fasted`, `clothed`).
- **Times are Paris wall-clock strings** (`YYYY-MM-DDTHH:MM`), never UTC — see
  ADR 0002. `src/lib/time.ts` has the formatting/`now` helpers; don't reach for
  `Date.toISOString()` for anything user-facing.
- **Photos** are resized client-side in `src/lib/photo.ts` before upload; the
  upload route stores the JPEG bytes in the `photo` row. Entry delete cascades
  to photo rows in SQL.
- **Vitest uses its own config** (`vitest.config.ts`) that deliberately omits the
  SvelteKit Vite plugin — the plugin crashes under Vitest. Keep domain tests
  free of SvelteKit imports.

## Conventions

- User-facing copy is French (`src/lib/ui.ts`, component templates). Code,
  comments, and docs are English.
- Every prompt/schema/behaviour change to the domain logic needs its test
  updated in the same change.
