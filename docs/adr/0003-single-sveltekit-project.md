# One SvelteKit project, API as server routes

Frontend and API live in a single SvelteKit repo. The API is SvelteKit
server routes under `src/routes/api/**/+server.ts`; D1 is bound through
`wrangler.toml` and reached via `platform.env`. The whole thing builds and
deploys as one unit.

We rejected a separate Cloudflare Workers repo for the API: it doubles the
deploy and configuration surface and splits shared TypeScript types for no
benefit at single-user scale.

## Consequences

- Local dev is one toolchain (`vite dev` for the UI, `wrangler dev` for the
  full stack with bindings).
- If the API ever needs to scale or deploy independently of the frontend,
  it must be extracted — acceptable, and unlikely for a personal tool.

## Update

Originally targeted Cloudflare Pages. Switched to the Cloudflare **Workers +
static assets** model (`@sveltejs/adapter-cloudflare` with `main` + `[assets]`
in `wrangler.toml`, no `pages_build_output_dir`) because the Cloudflare
dashboard now funnels new Git-connected projects through the Workers Builds
flow. Same single-project shape; only the build target changed.
