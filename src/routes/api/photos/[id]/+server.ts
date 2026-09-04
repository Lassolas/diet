import { error, type RequestHandler } from '@sveltejs/kit';
import { env } from '$lib/server/platform';
import { deletePhoto } from '$lib/server/repo';

export const DELETE: RequestHandler = async (event) => {
	const { DB, PHOTOS } = env(event);
	const key = await deletePhoto(DB, event.params.id!);
	if (key === null) throw error(404, 'No such photo');
	await PHOTOS.delete(key).catch(() => {});
	return new Response(null, { status: 204 });
};
