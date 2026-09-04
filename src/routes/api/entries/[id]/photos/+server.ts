import { json, error, type RequestHandler } from '@sveltejs/kit';
import { env } from '$lib/server/platform';
import { addPhoto, countPhotos, getEntry, MAX_PHOTOS_PER_ENTRY } from '$lib/server/repo';

const MAX_BYTES = 1_800_000; // under D1's 2 MB per-value ceiling; client resizes to ~200 KB

/**
 * Uploads one photo for an entry. Body is the raw resized JPEG
 * (Content-Type: image/jpeg); the client is responsible for resizing.
 * Bytes are stored inline in D1 (ADR 0004).
 */
export const POST: RequestHandler = async (event) => {
	const db = env(event).DB;
	const entryId = event.params.id!;

	if (!(await getEntry(db, entryId))) throw error(404, 'No such entry');
	if ((await countPhotos(db, entryId)) >= MAX_PHOTOS_PER_ENTRY) {
		throw error(409, `An entry can have at most ${MAX_PHOTOS_PER_ENTRY} photos.`);
	}

	const contentType = event.request.headers.get('content-type') ?? '';
	if (!contentType.startsWith('image/jpeg')) throw error(415, 'Expected image/jpeg');

	const bytes = await event.request.arrayBuffer();
	if (bytes.byteLength === 0) throw error(400, 'Empty body');
	if (bytes.byteLength > MAX_BYTES) throw error(413, 'Photo too large');

	const photo = await addPhoto(db, entryId, bytes);
	return json({ photo }, { status: 201 });
};
