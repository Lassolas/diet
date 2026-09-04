import { json, error, type RequestHandler } from '@sveltejs/kit';
import { ulid } from 'ulid';
import { env } from '$lib/server/platform';
import { addPhoto, countPhotos, getEntry, photoKey, MAX_PHOTOS_PER_ENTRY } from '$lib/server/repo';

const MAX_BYTES = 3_000_000; // generous ceiling; client resizes to ~200KB

/**
 * Uploads one photo for an entry. Body is the raw resized JPEG
 * (Content-Type: image/jpeg). The client is responsible for resizing.
 */
export const POST: RequestHandler = async (event) => {
	const { DB, PHOTOS } = env(event);
	const entryId = event.params.id!;

	if (!(await getEntry(DB, entryId))) throw error(404, 'No such entry');
	if ((await countPhotos(DB, entryId)) >= MAX_PHOTOS_PER_ENTRY) {
		throw error(409, `An entry can have at most ${MAX_PHOTOS_PER_ENTRY} photos.`);
	}

	const contentType = event.request.headers.get('content-type') ?? '';
	if (!contentType.startsWith('image/jpeg')) throw error(415, 'Expected image/jpeg');

	const bytes = new Uint8Array(await event.request.arrayBuffer());
	if (bytes.byteLength === 0) throw error(400, 'Empty body');
	if (bytes.byteLength > MAX_BYTES) throw error(413, 'Photo too large');

	const photoId = ulid();
	const key = photoKey(entryId, photoId);
	await PHOTOS.put(key, bytes, { httpMetadata: { contentType: 'image/jpeg' } });

	const photo = await addPhoto(DB, entryId, photoId, key);
	return json({ photo }, { status: 201 });
};
