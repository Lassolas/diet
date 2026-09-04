import type { MealEntry } from '$lib/types';

export interface ReportDay {
	/** 'YYYY-MM-DD'. */
	date: string;
	entries: MealEntry[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function nextDay(date: string): string {
	const [y, m, d] = date.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/**
 * Groups Meal Entries into one bucket per calendar day across the inclusive
 * range [from, to]. Days with nothing logged are still emitted with an empty
 * `entries` array, so gaps show up on the Report rather than being skipped.
 * Days are ascending; entries within a day are ascending by time.
 */
export function groupEntriesByDay(entries: MealEntry[], from: string, to: string): ReportDay[] {
	if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
		throw new Error('from and to must be YYYY-MM-DD dates');
	}
	if (from > to) throw new Error('from must not be after to');

	const byDate = new Map<string, MealEntry[]>();
	for (const entry of entries) {
		const day = entry.eatenAt.slice(0, 10);
		if (day < from || day > to) continue;
		(byDate.get(day) ?? byDate.set(day, []).get(day)!).push(entry);
	}

	const days: ReportDay[] = [];
	for (let date = from; date <= to; date = nextDay(date)) {
		const dayEntries = (byDate.get(date) ?? []).sort((a, b) => a.eatenAt.localeCompare(b.eatenAt));
		days.push({ date, entries: dayEntries });
	}
	return days;
}
