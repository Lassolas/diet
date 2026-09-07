import { describe, it, expect } from 'vitest';
import {
	validateWorkout,
	MIN_DURATION_MIN,
	MAX_DURATION_MIN,
	MAX_FEELING_LENGTH
} from './validateWorkout';
import type { WorkoutInput } from '$lib/types';

const base: WorkoutInput = {
	startedAt: '2026-09-04T18:30',
	durationMin: 45,
	workoutType: 'sparring',
	description: '5 rounds de sparring léger',
	feeling: 'jambes lourdes',
	intensity: 7
};

describe('validateWorkout', () => {
	it('accepts a well-formed workout', () => {
		expect(validateWorkout(base)).toEqual([]);
		expect(validateWorkout({ ...base, feeling: null })).toEqual([]);
		expect(validateWorkout({ ...base, feeling: undefined })).toEqual([]);
	});

	it('rejects a malformed time', () => {
		expect(validateWorkout({ ...base, startedAt: '2026-09-04 18:30' })).toContain(
			'Time must be in the form YYYY-MM-DDTHH:MM.'
		);
	});

	it('rejects a non-integer, non-positive, or out-of-range duration', () => {
		expect(validateWorkout({ ...base, durationMin: 42.5 })).toHaveLength(1);
		expect(validateWorkout({ ...base, durationMin: 0 })).toHaveLength(1);
		expect(validateWorkout({ ...base, durationMin: MIN_DURATION_MIN - 1 })).toHaveLength(1);
		expect(validateWorkout({ ...base, durationMin: MAX_DURATION_MIN + 1 })).toHaveLength(1);
	});

	it('rejects an unknown workout type', () => {
		expect(
			validateWorkout({ ...base, workoutType: 'yoga' as unknown as WorkoutInput['workoutType'] })
		).toHaveLength(1);
	});

	it('requires a non-empty description', () => {
		expect(validateWorkout({ ...base, description: '   ' })).toContain(
			'Add a description of the workout.'
		);
	});

	it('rejects an over-long feeling', () => {
		expect(validateWorkout({ ...base, feeling: 'x'.repeat(MAX_FEELING_LENGTH + 1) })).toHaveLength(1);
	});

	it('rejects an intensity outside 1–10 or non-integer', () => {
		expect(validateWorkout({ ...base, intensity: 0 })).toHaveLength(1);
		expect(validateWorkout({ ...base, intensity: 11 })).toHaveLength(1);
		expect(validateWorkout({ ...base, intensity: 5.5 })).toHaveLength(1);
	});
});
