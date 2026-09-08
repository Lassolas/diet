import type { PageLoad } from './$types';
import type { MealEntry, WeighIn, Workout, Sleep } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
	const [entriesRes, weighInsRes, workoutsRes, sleepsRes] = await Promise.all([
		fetch('/api/entries'),
		fetch('/api/weigh-ins'),
		fetch('/api/workouts'),
		fetch('/api/sleeps')
	]);
	if (!entriesRes.ok) {
		return {
			entries: [] as MealEntry[],
			weighIns: [] as WeighIn[],
			workouts: [] as Workout[],
			sleeps: [] as Sleep[],
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
	const sleeps = sleepsRes.ok ? ((await sleepsRes.json()) as { sleeps: Sleep[] }).sleeps : [];
	return { entries, weighIns, workouts, sleeps, loadError: null as string | null };
};
