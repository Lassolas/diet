import type { PageLoad } from './$types';
import type { Workout } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/workouts');
	if (!res.ok) return { workouts: [] as Workout[], loadError: await res.text() };
	const { workouts } = (await res.json()) as { workouts: Workout[] };
	return { workouts, loadError: null as string | null };
};
