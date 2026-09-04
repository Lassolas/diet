import { error, type RequestHandler } from '@sveltejs/kit';
import { env } from '$lib/server/platform';
import { deletePhoto } from '$lib/server/repo';

export const DELETE: RequestHandler = async (event) => {
	const removed = await deletePhoto(env(event).DB, event.params.id!);
	if (!removed) throw error(404, 'No such photo');
	return new Response(null, { status: 204 });
};
