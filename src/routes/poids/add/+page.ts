import type { PageLoad } from './$types';
import type { WeighIn } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/weigh-ins');
	if (!res.ok) return { lastWeightKg: null as number | null };
	const { weighIns } = (await res.json()) as { weighIns: WeighIn[] };
	// listWeighIns returns newest first.
	return { lastWeightKg: weighIns[0]?.weightKg ?? null };
};
