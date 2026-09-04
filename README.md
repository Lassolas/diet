# diet

A personal food diary. You log the meals you eat; a dietician reviews a printed
Report offline. The app does no nutritional analysis — it just makes logging
almost frictionless. Single user, no accounts.

See [CONTEXT.md](./CONTEXT.md) for domain vocabulary, [ARCHITECTURE.md](./ARCHITECTURE.md)
for the design, and [docs/adr/](./docs/adr/) for the decisions behind it.

## Stack

SvelteKit on the Cloudflare free tier: Pages (frontend + API as server routes)
and D1 (SQLite) — meal entries and photo bytes both live in D1. No R2, no
payment card. See ADR 0001, 0003, 0004.

## Develop

```sh
npm install
npm test                     # domain-logic unit tests (Vitest)
npm run check                # svelte-check / types
npm run dev                  # UI only — API routes 503 without Cloudflare bindings
```

To run the whole thing locally (API + D1 + R2) you need Wrangler:

```sh
npm run db:migrate:local     # apply migrations to the local D1
npm run build
npm run preview              # wrangler pages dev, serves on http://127.0.0.1:8788
```

Cloudflare Access verification is skipped locally unless the `CF_ACCESS_*` /
`ALLOWED_EMAIL` vars are set (see `.dev.vars.example`).

## First-time Cloudflare setup

```sh
npx wrangler d1 create diet          # paste the id into wrangler.toml
npm run db:migrate:remote
```

Then connect the repo in the Cloudflare Pages dashboard (build: `npm run build`,
output: `.svelte-kit/cloudflare`), add an Access application in front of it, and
set the environment variables.

## Deploy

Push to `main`. Cloudflare Pages builds and deploys automatically. Schema
changes need `npm run db:migrate:remote` run by hand.
