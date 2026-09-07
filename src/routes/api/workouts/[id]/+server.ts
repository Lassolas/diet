import { json, error, type RequestHandler } from '@sveltejs/kit';
import { env } from '$lib/server/platform';
import { deleteWorkout, getWorkout, updateWorkout } from '$lib/server/repo';
import { validateWorkout } from '$lib/domain/validateWorkout';
import type { WorkoutInput } from '$lib/types';

export const GET: RequestHandler = async (event) => {
	const workout = await getWorkout(env(event).DB, event.params.id!);
	if (!workout) throw error(404, 'No such workout');
	return json({ workout });
};

export const PATCH: RequestHandler = async (event) => {
	const body = (await event.request.json().catch(() => null)) as WorkoutInput | null;
	if (!body) throw error(400, 'Expected a JSON body');

	const errors = validateWorkout(body);
	if (errors.length) throw error(400, errors.join(' '));

	const workout = await updateWorkout(env(event).DB, event.params.id!, body);
	if (!workout) throw error(404, 'No such workout');
	return json({ workout });
};

export const DELETE: RequestHandler = async (event) => {
	await deleteWorkout(env(event).DB, event.params.id!);
	return new Response(null, { status: 204 });
};
