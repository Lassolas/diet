import type { PageLoad } from './$types';
import type { MealEntry, WeighIn, Workout, Sleep } from '$lib/types';
import { daysAgoDate, todayDate } from '$lib/time';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageLoad = async ({ fetch, url }) => {
	const to = url.searchParams.get('to');
	const from = url.searchParams.get('from');
	const range = {
		from: from && DATE_RE.test(from) ? from : daysAgoDate(13),
		to: to && DATE_RE.test(to) ? to : todayDate()
	};

	const qs = new URLSearchParams(range);
	const [entriesRes, weighInsRes, workoutsRes, sleepsRes] = await Promise.all([
		fetch(`/api/entries?${qs}`),
		fetch(`/api/weigh-ins?${qs}`),
		fetch(`/api/workouts?${qs}`),
		fetch(`/api/sleeps?${qs}`)
	]);
	const entries = entriesRes.ok
		? ((await entriesRes.json()) as { entries: MealEntry[] }).entries
		: [];
	const weighIns = weighInsRes.ok
		? ((await weighInsRes.json()) as { weighIns: WeighIn[] }).weighIns
		: [];
	const workouts = workoutsRes.ok
		? ((await workoutsRes.json()) as { workouts: Workout[] }).workouts
		: [];
	const sleeps = sleepsRes.ok ? ((await sleepsRes.json()) as { sleeps: Sleep[] }).sleeps : [];
	return { ...range, entries, weighIns, workouts, sleeps };
};
