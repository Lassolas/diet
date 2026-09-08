import type { MealEntry, WeighIn, Workout, Sleep } from '$lib/types';

export type TimelineItem =
	| { kind: 'meal'; at: string; entry: MealEntry }
	| { kind: 'weighIn'; at: string; weighIn: WeighIn }
	| { kind: 'workout'; at: string; workout: Workout }
	| { kind: 'sleep'; at: string; sleep: Sleep };

export interface TimelineDay {
	/** 'YYYY-MM-DD'. */
	date: string;
	items: TimelineItem[];
}

/** The four series merged into a timeline. Any may be omitted / empty. */
export interface TimelineSeries {
	entries?: MealEntry[];
	weighIns?: WeighIn[];
	workouts?: Workout[];
	sleeps?: Sleep[];
}

export interface TimelineOptions {
	/** Fill every calendar day in this inclusive range, even empty ones. */
	from?: string;
	to?: string;
	/** 'asc' (default): oldest day and time first. 'desc': newest first. */
	order?: 'asc' | 'desc';
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function nextDay(date: string): string {
	const [y, m, d] = date.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/**
 * Merges Meal Entries, Weigh-ins, Workouts and Sleep into one chronological
 * stream per calendar day. A sleep is filed under its wake date. When `from`/`to`
 * are given, every day in the range is emitted (empty ones included) — used by
 * the Report. Without them, only days that have something are emitted — used by
 * the journal. `order: 'desc'` flips days and the items within each day to
 * newest-first. When several items share a minute they order sleep → weigh-in →
 * workout → meal (the night precedes the day).
 */
export function buildTimeline(
	series: TimelineSeries,
	options: TimelineOptions = {}
): TimelineDay[] {
	const { entries = [], weighIns = [], workouts = [], sleeps = [] } = series;
	const { from, to, order = 'asc' } = options;
	if (from !== undefined || to !== undefined) {
		if (!from || !to || !DATE_RE.test(from) || !DATE_RE.test(to)) {
			throw new Error('from and to must both be YYYY-MM-DD dates');
		}
		if (from > to) throw new Error('from must not be after to');
	}

	const byDate = new Map<string, TimelineItem[]>();
	const push = (date: string, item: TimelineItem) => {
		if (from && (date < from || date > to!)) return;
		const list = byDate.get(date) ?? byDate.set(date, []).get(date)!;
		list.push(item);
	};

	for (const sleep of sleeps) {
		push(sleep.wakeAt.slice(0, 10), { kind: 'sleep', at: sleep.wakeAt, sleep });
	}
	for (const weighIn of weighIns) {
		push(weighIn.measuredAt.slice(0, 10), { kind: 'weighIn', at: weighIn.measuredAt, weighIn });
	}
	for (const workout of workouts) {
		push(workout.startedAt.slice(0, 10), { kind: 'workout', at: workout.startedAt, workout });
	}
	for (const entry of entries) {
		push(entry.eatenAt.slice(0, 10), { kind: 'meal', at: entry.eatenAt, entry });
	}

	const RANK = { sleep: 0, weighIn: 1, workout: 2, meal: 3 } as const;
	const sortItems = (items: TimelineItem[]) =>
		items.sort((a, b) => {
			const cmp = a.at.localeCompare(b.at) || RANK[a.kind] - RANK[b.kind];
			return order === 'desc' ? -cmp : cmp;
		});

	let dates: string[];
	if (from) {
		dates = [];
		for (let d = from; d <= to!; d = nextDay(d)) dates.push(d);
	} else {
		dates = [...byDate.keys()].sort();
	}
	if (order === 'desc') dates.reverse();

	return dates.map((date) => ({ date, items: sortItems(byDate.get(date) ?? []) }));
}
