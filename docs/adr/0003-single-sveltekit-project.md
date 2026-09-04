# One SvelteKit project, API as server routes, deployed to Cloudflare Pages

Frontend and API live in a single SvelteKit repo. The API is SvelteKit
server routes under `src/routes/api/**/+server.ts`; D1 and R2 are bound
through `wrangler.toml` and reached via `platform.env`. The whole thing
deploys as one Cloudflare Pages project with Functions, via the Pages Git
integration.

We rejected a separate Cloudflare Workers repo for the API: it doubles the
deploy and configuration surface and splits shared TypeScript types for no
benefit at single-user scale.

## Consequences

- Local dev is one toolchain (`vite dev` with the Cloudflare adapter /
  `wrangler pages dev`).
- If the API ever needs to scale or deploy independently of the frontend,
  it must be extracted — acceptable, and unlikely for a personal tool.
