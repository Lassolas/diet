import type { PageLoad } from './$types';
import type { MealEntry, WeighIn } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
	const [entriesRes, weighInsRes] = await Promise.all([
		fetch('/api/entries'),
		fetch('/api/weigh-ins')
	]);
	if (!entriesRes.ok) {
		return { entries: [] as MealEntry[], weighIns: [] as WeighIn[], loadError: await entriesRes.text() };
	}
	const { entries } = (await entriesRes.json()) as { entries: MealEntry[] };
	const weighIns = weighInsRes.ok
		? ((await weighInsRes.json()) as { weighIns: WeighIn[] }).weighIns
		: [];
	return { entries, weighIns, loadError: null as string | null };
};
