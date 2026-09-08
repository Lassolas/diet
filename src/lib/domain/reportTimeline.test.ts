import { describe, it, expect } from 'vitest';
import { buildTimeline } from './reportTimeline';
import type { MealEntry, WeighIn, Workout, Sleep } from '$lib/types';

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

const sleep = (id: string, bedAt: string, wakeAt: string): Sleep => ({
	id,
	bedAt,
	wakeAt,
	quality: 70,
	note: null,
	createdAt: wakeAt,
	updatedAt: wakeAt
});

describe('buildTimeline', () => {
	it('with a range, emits every day including empty ones (ascending)', () => {
		const days = buildTimeline(
			{ entries: [meal('a', '2026-09-02T09:00')] },
			{ from: '2026-09-01', to: '2026-09-03' }
		);
		expect(days.map((d) => d.date)).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
		expect(days[0].items).toEqual([]);
		expect(days[1].items.map((i) => i.at)).toEqual(['2026-09-02T09:00']);
	});

	it('without a range, emits only non-empty days', () => {
		const days = buildTimeline({
			entries: [meal('a', '2026-09-02T09:00'), meal('b', '2026-09-05T09:00')]
		});
		expect(days.map((d) => d.date)).toEqual(['2026-09-02', '2026-09-05']);
	});

	it('files a sleep under its wake date and interleaves all four series by time', () => {
		const days = buildTimeline(
			{
				entries: [meal('lunch', '2026-09-01T13:00'), meal('breakfast', '2026-09-01T08:00')],
				weighIns: [weighIn('morning', '2026-09-01T07:15')],
				workouts: [workout('boxing', '2026-09-01T18:30')],
				// went to bed on the 8th's eve — wait, filed under wake date 2026-09-01
				sleeps: [sleep('night', '2026-08-31T23:30', '2026-09-01T07:00')]
			},
			{ from: '2026-09-01', to: '2026-09-01' }
		);
		expect(days[0].items.map((i) => `${i.kind}:${i.at}`)).toEqual([
			'sleep:2026-09-01T07:00',
			'weighIn:2026-09-01T07:15',
			'meal:2026-09-01T08:00',
			'meal:2026-09-01T13:00',
			'workout:2026-09-01T18:30'
		]);
	});

	it('order desc flips days and items to newest-first', () => {
		const days = buildTimeline(
			{
				entries: [meal('m1', '2026-09-01T08:00'), meal('m2', '2026-09-02T08:00')],
				weighIns: [weighIn('w', '2026-09-02T20:00')]
			},
			{ order: 'desc' }
		);
		expect(days.map((d) => d.date)).toEqual(['2026-09-02', '2026-09-01']);
		expect(days[0].items.map((i) => i.at)).toEqual(['2026-09-02T20:00', '2026-09-02T08:00']);
	});

	it('orders sleep, then weigh-in, then workout, then meal when they share a minute', () => {
		const days = buildTimeline(
			{
				entries: [meal('m', '2026-09-01T07:30')],
				weighIns: [weighIn('w', '2026-09-01T07:30')],
				workouts: [workout('t', '2026-09-01T07:30')],
				sleeps: [sleep('s', '2026-08-31T23:00', '2026-09-01T07:30')]
			},
			{ from: '2026-09-01', to: '2026-09-01' }
		);
		expect(days[0].items.map((i) => i.kind)).toEqual(['sleep', 'weighIn', 'workout', 'meal']);
	});

	it('rejects a backwards or half-open range', () => {
		expect(() => buildTimeline({}, { from: '2026-09-05', to: '2026-09-01' })).toThrow();
		expect(() => buildTimeline({}, { from: '2026-09-01' })).toThrow();
	});
});
