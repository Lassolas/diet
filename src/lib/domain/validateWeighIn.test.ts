import { describe, it, expect } from 'vitest';
import { validateWeighIn, MIN_WEIGHT_KG, MAX_WEIGHT_KG } from './validateWeighIn';
import type { WeighInInput } from '$lib/types';

const base: WeighInInput = {
	measuredAt: '2026-09-04T07:30',
	weightKg: 72.4,
	fasted: true,
	clothed: false
};

describe('validateWeighIn', () => {
	it('accepts a well-formed weigh-in in any condition combination', () => {
		expect(validateWeighIn(base)).toEqual([]);
		expect(validateWeighIn({ ...base, fasted: false, clothed: true })).toEqual([]);
		expect(validateWeighIn({ ...base, fasted: true, clothed: true })).toEqual([]);
		expect(validateWeighIn({ ...base, fasted: false, clothed: false })).toEqual([]);
	});

	it('rejects a malformed time', () => {
		expect(validateWeighIn({ ...base, measuredAt: '2026-09-04 07:30' })).toContain(
			'Time must be in the form YYYY-MM-DDTHH:MM.'
		);
	});

	it('rejects a non-numeric or out-of-range weight', () => {
		expect(validateWeighIn({ ...base, weightKg: NaN })).toContain('Weight must be a number.');
		expect(validateWeighIn({ ...base, weightKg: MIN_WEIGHT_KG - 1 })).toHaveLength(1);
		expect(validateWeighIn({ ...base, weightKg: MAX_WEIGHT_KG + 1 })).toHaveLength(1);
	});

	it('rejects non-boolean condition flags', () => {
		expect(
			validateWeighIn({ ...base, fasted: 'yes' as unknown as boolean })
		).toContain('Fasted and clothed must be true or false.');
	});
});
