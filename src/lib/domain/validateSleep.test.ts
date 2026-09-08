import { describe, it, expect } from 'vitest';
import { validateSleep, MAX_DURATION_MIN, MAX_NOTE_LENGTH } from './validateSleep';
import type { SleepInput } from '$lib/types';

const base: SleepInput = {
	bedAt: '2026-09-07T23:30',
	wakeAt: '2026-09-08T07:15',
	quality: 70,
	note: 'réveil facile'
};

describe('validateSleep', () => {
	it('accepts a well-formed night, note optional', () => {
		expect(validateSleep(base)).toEqual([]);
		expect(validateSleep({ ...base, note: null })).toEqual([]);
		expect(validateSleep({ ...base, note: undefined })).toEqual([]);
		expect(validateSleep({ ...base, quality: 0 })).toEqual([]);
		expect(validateSleep({ ...base, quality: 100 })).toEqual([]);
	});

	it('rejects a malformed time', () => {
		expect(validateSleep({ ...base, bedAt: '2026-09-07 23:30' })).toContain(
			'Times must be in the form YYYY-MM-DDTHH:MM.'
		);
		expect(validateSleep({ ...base, wakeAt: 'nope' })).toHaveLength(1);
	});

	it('rejects a wake time at or before the bed time', () => {
		expect(validateSleep({ ...base, wakeAt: '2026-09-07T23:30' })).toContain(
			'Wake time must be after bed time.'
		);
		expect(validateSleep({ ...base, wakeAt: '2026-09-07T22:00' })).toContain(
			'Wake time must be after bed time.'
		);
	});

	it('rejects a night longer than the cap', () => {
		// 19 h later
		expect(validateSleep({ ...base, wakeAt: '2026-09-08T18:30' })).toContain(
			`Sleep can't be longer than ${MAX_DURATION_MIN / 60} h — check the dates.`
		);
	});

	it('accepts a night exactly at the cap', () => {
		expect(validateSleep({ ...base, bedAt: '2026-09-07T20:00', wakeAt: '2026-09-08T14:00' })).toEqual(
			[]
		);
	});

	it('rejects a non-integer or out-of-range quality', () => {
		expect(validateSleep({ ...base, quality: -1 })).toHaveLength(1);
		expect(validateSleep({ ...base, quality: 101 })).toHaveLength(1);
		expect(validateSleep({ ...base, quality: 55.5 })).toHaveLength(1);
	});

	it('rejects an over-long note', () => {
		expect(validateSleep({ ...base, note: 'x'.repeat(MAX_NOTE_LENGTH + 1) })).toHaveLength(1);
	});
});
