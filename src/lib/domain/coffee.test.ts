import { describe, it, expect } from 'vitest';
import { isCoffee, coffeeDose, coffeeDescription, coffeeEntryInput } from './coffee';

describe('isCoffee', () => {
	it('matches a snack whose description is exactly N café(s)', () => {
		expect(isCoffee({ mealType: 'snack', description: '1 café' })).toBe(true);
		expect(isCoffee({ mealType: 'snack', description: '2 cafés' })).toBe(true);
		expect(isCoffee({ mealType: 'snack', description: ' 3 cafés ' })).toBe(true);
	});

	it('rejects real snacks and non-snacks', () => {
		expect(isCoffee({ mealType: 'snack', description: 'café au lait, croissant' })).toBe(false);
		expect(isCoffee({ mealType: 'snack', description: 'banane' })).toBe(false);
		expect(isCoffee({ mealType: 'snack', description: null })).toBe(false);
		expect(isCoffee({ mealType: 'breakfast', description: '1 café' })).toBe(false);
	});
});

describe('coffeeDose', () => {
	it('reads the dose, clamped to 1–3', () => {
		expect(coffeeDose('1 café')).toBe(1);
		expect(coffeeDose('3 cafés')).toBe(3);
		expect(coffeeDose('5 cafés')).toBe(3);
		expect(coffeeDose('banane')).toBe(1);
		expect(coffeeDose(null)).toBe(1);
	});
});

describe('coffeeDescription', () => {
	it('formats the canonical description', () => {
		expect(coffeeDescription(1)).toBe('1 café');
		expect(coffeeDescription(2)).toBe('2 cafés');
		expect(coffeeDescription(9)).toBe('3 cafés');
	});
});

describe('coffeeEntryInput', () => {
	it('builds a snack entry that round-trips through isCoffee', () => {
		const input = coffeeEntryInput('2026-09-09T08:30');
		expect(input).toEqual({ eatenAt: '2026-09-09T08:30', mealType: 'snack', description: '1 café' });
		expect(isCoffee(input)).toBe(true);
	});
});
