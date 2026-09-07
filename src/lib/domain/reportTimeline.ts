import type { MealEntry, WeighIn, Workout } from '$lib/types';

export type TimelineItem =
	| { kind: 'meal'; at: string; entry: MealEntry }
	| { kind: 'weighIn'; at: string; weighIn: WeighIn }
	| { kind: 'workout'; at: string; workout: Workout };

export interface TimelineDay {
	/** 'YYYY-MM-DD'. */
	date: string;
	items: TimelineItem[];
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
 * Merges Meal Entries, Weigh-ins and Workouts into one chronological stream per
 * calendar day. When `from`/`to` are given, every day in the range is emitted
 * (empty ones included) — used by the Report. Without them, only days that have
 * something are emitted — used by the journal. `order: 'desc'` flips days and the
 * items within each day to newest-first. When several items share a minute, a
 * weigh-in sorts first, then a workout, then a meal.
 */
export function buildTimeline(
	entries: MealEntry[],
	weighIns: WeighIn[],
	workouts: Workout[],
	options: TimelineOptions = {}
): TimelineDay[] {
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

	for (const weighIn of weighIns) {
		push(weighIn.measuredAt.slice(0, 10), { kind: 'weighIn', at: weighIn.measuredAt, weighIn });
	}
	for (const workout of workouts) {
		push(workout.startedAt.slice(0, 10), { kind: 'workout', at: workout.startedAt, workout });
	}
	for (const entry of entries) {
		push(entry.eatenAt.slice(0, 10), { kind: 'meal', at: entry.eatenAt, entry });
	}

	const rank = (i: TimelineItem) => (i.kind === 'weighIn' ? 0 : i.kind === 'workout' ? 1 : 2);
	const sortItems = (items: TimelineItem[]) =>
		items.sort((a, b) => {
			const cmp = a.at.localeCompare(b.at) || rank(a) - rank(b);
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
