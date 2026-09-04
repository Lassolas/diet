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

To run the whole thing locally (API + D1) you need Wrangler:

```sh
npm run db:migrate:local     # apply migrations to the local D1
npm run preview              # builds, then wrangler dev on http://127.0.0.1:8788
```

Cloudflare Access verification is skipped locally unless the `CF_ACCESS_*` /
`ALLOWED_EMAIL` vars are set (see `.dev.vars.example`).

## First-time Cloudflare setup

```sh
npx wrangler d1 create diet          # paste the id into wrangler.toml
npm run db:migrate:remote
```

Then connect the repo via Cloudflare **Workers Builds** (Workers & Pages →
create → import Git repo). Build command `npm run build`; the deploy command
defaults (`wrangler deploy` for production, `wrangler versions upload` for
branches) work as-is. Enable "Protect with Cloudflare Access" (scope: all
traffic; policy: your Cloudflare account), then set the `CF_ACCESS_*` /
`ALLOWED_EMAIL` variables (see `.dev.vars.example`) and redeploy.

## Deploy

Push to `main`. Workers Builds runs `npm run build` and deploys automatically.
Schema changes need `npm run db:migrate:remote` run by hand.
