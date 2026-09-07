import type { PageLoad } from './$types';
import type { MealEntry, WeighIn, Workout } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
	const [entriesRes, weighInsRes, workoutsRes] = await Promise.all([
		fetch('/api/entries'),
		fetch('/api/weigh-ins'),
		fetch('/api/workouts')
	]);
	if (!entriesRes.ok) {
		return {
			entries: [] as MealEntry[],
			weighIns: [] as WeighIn[],
			workouts: [] as Workout[],
			loadError: await entriesRes.text()
		};
	}
	const { entries } = (await entriesRes.json()) as { entries: MealEntry[] };
	const weighIns = weighInsRes.ok
		? ((await weighInsRes.json()) as { weighIns: WeighIn[] }).weighIns
		: [];
	const workouts = workoutsRes.ok
		? ((await workoutsRes.json()) as { workouts: Workout[] }).workouts
		: [];
	return { entries, weighIns, workouts, loadError: null as string | null };
};
