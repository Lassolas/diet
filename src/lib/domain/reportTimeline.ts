import type { MealEntry, WeighIn } from '$lib/types';

export type TimelineItem =
	| { kind: 'meal'; at: string; entry: MealEntry }
	| { kind: 'weighIn'; at: string; weighIn: WeighIn };

export interface TimelineDay {
	/** 'YYYY-MM-DD'. */
	date: string;
	items: TimelineItem[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function nextDay(date: string): string {
	const [y, m, d] = date.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/**
 * Merges Meal Entries and Weigh-ins into one chronological stream per calendar
 * day, across the inclusive range [from, to]. Days with nothing logged are still
 * emitted with an empty `items` array, so gaps show up on the Report. Days are
 * ascending; items within a day are ascending by time (`at`). When a meal and a
 * weigh-in share a minute, the weigh-in comes first.
 */
export function buildReportTimeline(
	entries: MealEntry[],
	weighIns: WeighIn[],
	from: string,
	to: string
): TimelineDay[] {
	if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
		throw new Error('from and to must be YYYY-MM-DD dates');
	}
	if (from > to) throw new Error('from must not be after to');

	const byDate = new Map<string, TimelineItem[]>();
	const push = (date: string, item: TimelineItem) => {
		if (date < from || date > to) return;
		const list = byDate.get(date) ?? byDate.set(date, []).get(date)!;
		list.push(item);
	};

	for (const weighIn of weighIns) {
		push(weighIn.measuredAt.slice(0, 10), {
			kind: 'weighIn',
			at: weighIn.measuredAt,
			weighIn
		});
	}
	for (const entry of entries) {
		push(entry.eatenAt.slice(0, 10), { kind: 'meal', at: entry.eatenAt, entry });
	}

	const rank = (i: TimelineItem) => (i.kind === 'weighIn' ? 0 : 1);
	const days: TimelineDay[] = [];
	for (let date = from; date <= to; date = nextDay(date)) {
		const items = (byDate.get(date) ?? []).sort(
			(a, b) => a.at.localeCompare(b.at) || rank(a) - rank(b)
		);
		days.push({ date, items });
	}
	return days;
}
