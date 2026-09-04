import { json, error, type RequestHandler } from '@sveltejs/kit';
import { env } from '$lib/server/platform';
import { deleteWeighIn, getWeighIn, updateWeighIn } from '$lib/server/repo';
import { validateWeighIn } from '$lib/domain/validateWeighIn';
import type { WeighInInput } from '$lib/types';

export const GET: RequestHandler = async (event) => {
	const weighIn = await getWeighIn(env(event).DB, event.params.id!);
	if (!weighIn) throw error(404, 'No such weigh-in');
	return json({ weighIn });
};

export const PATCH: RequestHandler = async (event) => {
	const body = (await event.request.json().catch(() => null)) as WeighInInput | null;
	if (!body) throw error(400, 'Expected a JSON body');

	const errors = validateWeighIn(body);
	if (errors.length) throw error(400, errors.join(' '));

	const weighIn = await updateWeighIn(env(event).DB, event.params.id!, body);
	if (!weighIn) throw error(404, 'No such weigh-in');
	return json({ weighIn });
};

export const DELETE: RequestHandler = async (event) => {
	await deleteWeighIn(env(event).DB, event.params.id!);
	return new Response(null, { status: 204 });
};
