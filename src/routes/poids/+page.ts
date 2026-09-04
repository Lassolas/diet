import type { PageLoad } from './$types';
import type { WeighIn } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/weigh-ins');
	if (!res.ok) return { weighIns: [] as WeighIn[], loadError: await res.text() };
	const { weighIns } = (await res.json()) as { weighIns: WeighIn[] };
	return { weighIns, loadError: null as string | null };
};
