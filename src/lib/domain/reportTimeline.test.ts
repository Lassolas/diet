import { describe, it, expect } from 'vitest';
import { buildTimeline } from './reportTimeline';
import type { MealEntry, WeighIn, Workout } from '$lib/types';

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

const workout = (id: string, startedAt: string): Workout => ({
	id,
	startedAt,
	durationMin: 45,
	workoutType: 'bag',
	description: id,
	feeling: null,
	intensity: 6,
	createdAt: startedAt,
	updatedAt: startedAt
});

describe('buildTimeline', () => {
	it('with a range, emits every day including empty ones (ascending)', () => {
		const days = buildTimeline([meal('a', '2026-09-02T09:00')], [], [], {
			from: '2026-09-01',
			to: '2026-09-03'
		});
		expect(days.map((d) => d.date)).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
		expect(days[0].items).toEqual([]);
		expect(days[1].items.map((i) => i.at)).toEqual(['2026-09-02T09:00']);
	});

	it('without a range, emits only non-empty days', () => {
		const days = buildTimeline(
			[meal('a', '2026-09-02T09:00'), meal('b', '2026-09-05T09:00')],
			[],
			[],
			{}
		);
		expect(days.map((d) => d.date)).toEqual(['2026-09-02', '2026-09-05']);
	});

	it('interleaves meals, weigh-ins and workouts by time within a day', () => {
		const days = buildTimeline(
			[meal('lunch', '2026-09-01T13:00'), meal('breakfast', '2026-09-01T08:00')],
			[weighIn('morning', '2026-09-01T07:15'), weighIn('evening', '2026-09-01T21:00')],
			[workout('boxing', '2026-09-01T18:30')],
			{ from: '2026-09-01', to: '2026-09-01' }
		);
		expect(days[0].items.map((i) => `${i.kind}:${i.at}`)).toEqual([
			'weighIn:2026-09-01T07:15',
			'meal:2026-09-01T08:00',
			'meal:2026-09-01T13:00',
			'workout:2026-09-01T18:30',
			'weighIn:2026-09-01T21:00'
		]);
	});

	it('order desc flips days and items to newest-first', () => {
		const days = buildTimeline(
			[meal('m1', '2026-09-01T08:00'), meal('m2', '2026-09-02T08:00')],
			[weighIn('w', '2026-09-02T20:00')],
			[workout('t', '2026-09-02T12:00')],
			{ order: 'desc' }
		);
		expect(days.map((d) => d.date)).toEqual(['2026-09-02', '2026-09-01']);
		expect(days[0].items.map((i) => i.at)).toEqual([
			'2026-09-02T20:00',
			'2026-09-02T12:00',
			'2026-09-02T08:00'
		]);
	});

	it('orders weigh-in, then workout, then meal when they share a minute', () => {
		const days = buildTimeline(
			[meal('m', '2026-09-01T07:30')],
			[weighIn('w', '2026-09-01T07:30')],
			[workout('t', '2026-09-01T07:30')],
			{ from: '2026-09-01', to: '2026-09-01' }
		);
		expect(days[0].items.map((i) => i.kind)).toEqual(['weighIn', 'workout', 'meal']);
	});

	it('rejects a backwards or half-open range', () => {
		expect(() => buildTimeline([], [], [], { from: '2026-09-05', to: '2026-09-01' })).toThrow();
		expect(() => buildTimeline([], [], [], { from: '2026-09-01' })).toThrow();
	});
});
