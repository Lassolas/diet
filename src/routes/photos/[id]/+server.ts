import { error, type RequestHandler } from '@sveltejs/kit';
import { env } from '$lib/server/platform';
import { getPhotoBytes } from '$lib/server/repo';

// Streams a meal photo from D1. Still behind Cloudflare Access (hooks.server.ts).
export const GET: RequestHandler = async (event) => {
	const photo = await getPhotoBytes(env(event).DB, event.params.id!);
	if (!photo) throw error(404, 'No such photo');

	return new Response(photo.bytes, {
		headers: {
			'Content-Type': photo.contentType,
			'Cache-Control': 'private, max-age=31536000, immutable'
		}
	});
};
