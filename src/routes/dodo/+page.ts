import type { PageLoad } from './$types';
import type { Sleep } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/sleeps');
	if (!res.ok) return { sleeps: [] as Sleep[], loadError: await res.text() };
	const { sleeps } = (await res.json()) as { sleeps: Sleep[] };
	return { sleeps, loadError: null as string | null };
};
