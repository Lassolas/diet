import { describe, it, expect } from 'vitest';
import { groupEntriesByDay } from './reportGrouping';
import type { MealEntry } from '$lib/types';

const entry = (id: string, eatenAt: string): MealEntry => ({
	id,
	eatenAt,
	mealType: 'snack',
	description: id,
	note: null,
	photos: [],
	createdAt: eatenAt,
	updatedAt: eatenAt
});

describe('groupEntriesByDay', () => {
	it('emits every day in range, including empty ones', () => {
		const days = groupEntriesByDay([entry('a', '2026-09-02T09:00')], '2026-09-01', '2026-09-03');
		expect(days.map((d) => d.date)).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
		expect(days[0].entries).toEqual([]);
		expect(days[1].entries.map((e) => e.id)).toEqual(['a']);
		expect(days[2].entries).toEqual([]);
	});

	it('sorts entries within a day by time', () => {
		const days = groupEntriesByDay(
			[entry('dinner', '2026-09-01T20:00'), entry('breakfast', '2026-09-01T08:00')],
			'2026-09-01',
			'2026-09-01'
		);
		expect(days[0].entries.map((e) => e.id)).toEqual(['breakfast', 'dinner']);
	});

	it('excludes entries outside the range', () => {
		const days = groupEntriesByDay(
			[entry('before', '2026-08-31T20:00'), entry('after', '2026-09-02T08:00')],
			'2026-09-01',
			'2026-09-01'
		);
		expect(days).toHaveLength(1);
		expect(days[0].entries).toEqual([]);
	});

	it('crosses month boundaries', () => {
		const days = groupEntriesByDay([], '2026-08-30', '2026-09-02');
		expect(days.map((d) => d.date)).toEqual([
			'2026-08-30',
			'2026-08-31',
			'2026-09-01',
			'2026-09-02'
		]);
	});

	it('rejects a backwards range', () => {
		expect(() => groupEntriesByDay([], '2026-09-05', '2026-09-01')).toThrow();
	});
});
