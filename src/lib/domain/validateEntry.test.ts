import { describe, it, expect } from 'vitest';
import { validateEntry, MAX_DESCRIPTION_LENGTH, MAX_NOTE_LENGTH } from './validateEntry';
import type { MealEntryInput } from '$lib/types';

const base: MealEntryInput = {
	eatenAt: '2026-09-04T13:15',
	mealType: 'lunch',
	description: 'chicken salad'
};

describe('validateEntry', () => {
	it('accepts a well-formed entry', () => {
		expect(validateEntry(base)).toEqual([]);
	});

	it('accepts a photo-only entry with no description', () => {
		expect(validateEntry({ ...base, description: '', hasPhoto: true })).toEqual([]);
	});

	it('rejects an entry with neither description nor photo', () => {
		const errors = validateEntry({ ...base, description: '   ', hasPhoto: false });
		expect(errors).toContain('Add a description or at least one photo.');
	});

	it('rejects a malformed time', () => {
		expect(validateEntry({ ...base, eatenAt: '04/09/2026 13:15' })).toContain(
			'Time must be in the form YYYY-MM-DDTHH:MM.'
		);
	});

	it('rejects an impossible date', () => {
		expect(validateEntry({ ...base, eatenAt: '2026-13-40T25:99' })).toContain(
			'Time is not a real date.'
		);
	});

	it('rejects an unknown meal type', () => {
		const errors = validateEntry({ ...base, mealType: 'brunch' as MealEntryInput['mealType'] });
		expect(errors.some((e) => e.startsWith('Meal type must be one of'))).toBe(true);
	});

	it('rejects an over-long description and note', () => {
		const errors = validateEntry({
			...base,
			description: 'x'.repeat(MAX_DESCRIPTION_LENGTH + 1),
			note: 'y'.repeat(MAX_NOTE_LENGTH + 1)
		});
		expect(errors).toHaveLength(2);
	});
});
