import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { Workout } from '$lib/types';

export const load: PageLoad = async ({ fetch, params }) => {
	const res = await fetch(`/api/workouts/${params.id}`);
	if (res.status === 404) throw error(404, 'Séance introuvable');
	if (!res.ok) throw error(res.status, await res.text());
	const { workout } = (await res.json()) as { workout: Workout };
	return { workout };
};
