import { json, error, type RequestHandler } from '@sveltejs/kit';
import { env } from '$lib/server/platform';
import { createEntry, listEntries } from '$lib/server/repo';
import { validateEntry } from '$lib/domain/validateEntry';
import type { MealEntryInput } from '$lib/types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const GET: RequestHandler = async (event) => {
	const from = event.url.searchParams.get('from') ?? undefined;
	const to = event.url.searchParams.get('to') ?? undefined;
	if (from && !DATE_RE.test(from)) throw error(400, 'from must be YYYY-MM-DD');
	if (to && !DATE_RE.test(to)) throw error(400, 'to must be YYYY-MM-DD');

	const entries = await listEntries(env(event).DB, { from, to });
	return json({ entries });
};

export const POST: RequestHandler = async (event) => {
	const body = (await event.request.json().catch(() => null)) as MealEntryInput | null;
	if (!body) throw error(400, 'Expected a JSON body');

	const errors = validateEntry(body);
	if (errors.length) throw error(400, errors.join(' '));

	const entry = await createEntry(env(event).DB, body);
	return json({ entry }, { status: 201 });
};
