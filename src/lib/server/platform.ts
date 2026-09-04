import { error, type RequestEvent } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
	DB: D1Database;
}

/**
 * The Cloudflare bindings for this request. Throws a clean 503 when they are
 * absent (e.g. `vite dev` without `wrangler pages dev`).
 */
export function env(event: RequestEvent): Env {
	const platformEnv = event.platform?.env as Env | undefined;
	if (!platformEnv?.DB) {
		throw error(503, 'Cloudflare bindings unavailable. Run `npm run preview` (wrangler).');
	}
	return platformEnv;
}
