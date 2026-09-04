import { json, error, type RequestHandler } from '@sveltejs/kit';
import { env } from '$lib/server/platform';
import { deleteEntry, getEntry, updateEntry, countPhotos } from '$lib/server/repo';
import { validateEntry } from '$lib/domain/validateEntry';
import type { MealEntryInput } from '$lib/types';

export const GET: RequestHandler = async (event) => {
	const entry = await getEntry(env(event).DB, event.params.id!);
	if (!entry) throw error(404, 'No such entry');
	return json({ entry });
};

export const PATCH: RequestHandler = async (event) => {
	const db = env(event).DB;
	const id = event.params.id!;
	const body = (await event.request.json().catch(() => null)) as MealEntryInput | null;
	if (!body) throw error(400, 'Expected a JSON body');

	const hasPhoto = (await countPhotos(db, id)) > 0;
	const errors = validateEntry({ ...body, hasPhoto });
	if (errors.length) throw error(400, errors.join(' '));

	const entry = await updateEntry(db, id, body);
	if (!entry) throw error(404, 'No such entry');
	return json({ entry });
};

export const DELETE: RequestHandler = async (event) => {
	const { DB, PHOTOS } = env(event);
	const keys = await deleteEntry(DB, event.params.id!);
	// Best-effort R2 cleanup; a stray orphan object is harmless.
	await Promise.allSettled(keys.map((k) => PHOTOS.delete(k)));
	return new Response(null, { status: 204 });
};
