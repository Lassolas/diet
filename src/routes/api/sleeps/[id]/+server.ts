import { json, error, type RequestHandler } from '@sveltejs/kit';
import { env } from '$lib/server/platform';
import { deleteSleep, getSleep, updateSleep } from '$lib/server/repo';
import { validateSleep } from '$lib/domain/validateSleep';
import type { SleepInput } from '$lib/types';

export const GET: RequestHandler = async (event) => {
	const sleep = await getSleep(env(event).DB, event.params.id!);
	if (!sleep) throw error(404, 'No such sleep');
	return json({ sleep });
};

export const PATCH: RequestHandler = async (event) => {
	const body = (await event.request.json().catch(() => null)) as SleepInput | null;
	if (!body) throw error(400, 'Expected a JSON body');

	const errors = validateSleep(body);
	if (errors.length) throw error(400, errors.join(' '));

	const sleep = await updateSleep(env(event).DB, event.params.id!, body);
	if (!sleep) throw error(404, 'No such sleep');
	return json({ sleep });
};

export const DELETE: RequestHandler = async (event) => {
	await deleteSleep(env(event).DB, event.params.id!);
	return new Response(null, { status: 204 });
};
