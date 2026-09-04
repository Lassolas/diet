import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { WeighIn } from '$lib/types';

export const load: PageLoad = async ({ fetch, params }) => {
	const res = await fetch(`/api/weigh-ins/${params.id}`);
	if (res.status === 404) throw error(404, 'Pesée introuvable');
	if (!res.ok) throw error(res.status, await res.text());
	const { weighIn } = (await res.json()) as { weighIn: WeighIn };
	return { weighIn };
};
