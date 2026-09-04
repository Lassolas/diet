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

npm run db:migrate:local && npm run build && npm run preview   # full local stack via wrangler
```

`npm run preview` runs `wrangler pages dev` and reads bindings from
`wrangler.toml`. Do **not** pass `--d1`/`--r2` flags to it — they point wrangler
at a different local database than `db:migrate:local` migrates.

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
  `validateEntry`, `reportGrouping` under `src/lib/domain/`. Both the client
  (`EntryForm`) and the server routes import the same functions. Change behaviour
  here test-first.
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
