import { error, type RequestHandler } from '@sveltejs/kit';
import { env } from '$lib/server/platform';

// Streams a meal photo from R2. Still behind Cloudflare Access (hooks.server.ts).
export const GET: RequestHandler = async (event) => {
	const object = await env(event).PHOTOS.get(event.params.key ?? '');
	if (!object) throw error(404, 'No such photo');

	return new Response(object.body as unknown as ReadableStream, {
		headers: {
			'Content-Type': object.httpMetadata?.contentType ?? 'image/jpeg',
			'Cache-Control': 'private, max-age=31536000, immutable',
			ETag: object.httpEtag
		}
	});
};
