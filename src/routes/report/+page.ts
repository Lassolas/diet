import type { PageLoad } from './$types';
import type { MealEntry } from '$lib/types';
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
	const res = await fetch(`/api/entries?${qs}`);
	const entries = res.ok ? ((await res.json()) as { entries: MealEntry[] }).entries : [];
	return { ...range, entries };
};
