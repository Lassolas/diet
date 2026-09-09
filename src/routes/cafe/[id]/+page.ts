import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { MealEntry } from '$lib/types';

export const load: PageLoad = async ({ fetch, params }) => {
	const res = await fetch(`/api/entries/${params.id}`);
	if (res.status === 404) throw error(404, 'Café introuvable');
	if (!res.ok) throw error(res.status, await res.text());
	const { entry } = (await res.json()) as { entry: MealEntry };
	return { entry };
};
