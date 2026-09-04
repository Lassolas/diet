// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: import('@cloudflare/workers-types').D1Database;
				PHOTOS: import('@cloudflare/workers-types').R2Bucket;
			};
			cf?: import('@cloudflare/workers-types').CfProperties;
			ctx?: import('@cloudflare/workers-types').ExecutionContext;
		}
	}
}

export {};
