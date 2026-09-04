import type { PageLoad } from './$types';
import type { MealEntry } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/entries');
	if (!res.ok) return { entries: [] as MealEntry[], loadError: await res.text() };
	const { entries } = (await res.json()) as { entries: MealEntry[] };
	return { entries, loadError: null as string | null };
};
