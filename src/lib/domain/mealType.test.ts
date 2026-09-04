import { describe, it, expect } from 'vitest';
import { mealTypeForTime } from './mealType';

const at = (hour: number, minute = 0) => new Date(2026, 8, 4, hour, minute);

describe('mealTypeForTime', () => {
	it('maps morning hours to breakfast', () => {
		expect(mealTypeForTime(at(6))).toBe('breakfast');
		expect(mealTypeForTime(at(9, 30))).toBe('breakfast');
		expect(mealTypeForTime(at(10, 59))).toBe('breakfast');
	});

	it('maps midday to lunch', () => {
		expect(mealTypeForTime(at(11))).toBe('lunch');
		expect(mealTypeForTime(at(14, 59))).toBe('lunch');
	});

	it('maps mid-afternoon to snack', () => {
		expect(mealTypeForTime(at(15))).toBe('snack');
		expect(mealTypeForTime(at(17, 59))).toBe('snack');
	});

	it('maps evening to dinner', () => {
		expect(mealTypeForTime(at(18))).toBe('dinner');
		expect(mealTypeForTime(at(22, 59))).toBe('dinner');
	});

	it('maps late night and early morning to snack', () => {
		expect(mealTypeForTime(at(23))).toBe('snack');
		expect(mealTypeForTime(at(2))).toBe('snack');
		expect(mealTypeForTime(at(5, 59))).toBe('snack');
	});
});
