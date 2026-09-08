import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { Sleep } from '$lib/types';

export const load: PageLoad = async ({ fetch, params }) => {
	const res = await fetch(`/api/sleeps/${params.id}`);
	if (res.status === 404) throw error(404, 'Dodo introuvable');
	if (!res.ok) throw error(res.status, await res.text());
	const { sleep } = (await res.json()) as { sleep: Sleep };
	return { sleep };
};
