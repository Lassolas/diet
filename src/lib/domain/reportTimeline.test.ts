import { describe, it, expect } from 'vitest';
import { buildReportTimeline } from './reportTimeline';
import type { MealEntry, WeighIn } from '$lib/types';

const meal = (id: string, eatenAt: string): MealEntry => ({
	id,
	eatenAt,
	mealType: 'snack',
	description: id,
	note: null,
	photos: [],
	createdAt: eatenAt,
	updatedAt: eatenAt
});

const weighIn = (id: string, measuredAt: string): WeighIn => ({
	id,
	measuredAt,
	weightKg: 72,
	fasted: true,
	clothed: false,
	createdAt: measuredAt,
	updatedAt: measuredAt
});

describe('buildReportTimeline', () => {
	it('emits every day in range, including empty ones', () => {
		const days = buildReportTimeline([meal('a', '2026-09-02T09:00')], [], '2026-09-01', '2026-09-03');
		expect(days.map((d) => d.date)).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
		expect(days[0].items).toEqual([]);
		expect(days[1].items.map((i) => i.at)).toEqual(['2026-09-02T09:00']);
	});

	it('interleaves meals and weigh-ins by time within a day', () => {
		const days = buildReportTimeline(
			[meal('lunch', '2026-09-01T13:00'), meal('breakfast', '2026-09-01T08:00')],
			[weighIn('morning', '2026-09-01T07:15'), weighIn('evening', '2026-09-01T21:00')],
			'2026-09-01',
			'2026-09-01'
		);
		expect(days[0].items.map((i) => `${i.kind}:${i.at}`)).toEqual([
			'weighIn:2026-09-01T07:15',
			'meal:2026-09-01T08:00',
			'meal:2026-09-01T13:00',
			'weighIn:2026-09-01T21:00'
		]);
	});

	it('puts the weigh-in first when it shares a minute with a meal', () => {
		const days = buildReportTimeline(
			[meal('m', '2026-09-01T07:30')],
			[weighIn('w', '2026-09-01T07:30')],
			'2026-09-01',
			'2026-09-01'
		);
		expect(days[0].items.map((i) => i.kind)).toEqual(['weighIn', 'meal']);
	});

	it('excludes items outside the range', () => {
		const days = buildReportTimeline(
			[meal('after', '2026-09-03T08:00')],
			[weighIn('before', '2026-08-31T08:00')],
			'2026-09-01',
			'2026-09-02'
		);
		expect(days.every((d) => d.items.length === 0)).toBe(true);
	});

	it('rejects a backwards range', () => {
		expect(() => buildReportTimeline([], [], '2026-09-05', '2026-09-01')).toThrow();
	});
});
