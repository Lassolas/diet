import { describe, it, expect } from 'vitest';
import { rankFrequentItems, type FrequentItemSource } from './frequentItems';

const now = new Date('2026-09-10T12:00');

const entry = (
	description: string | null,
	eatenAt: string,
	mealType: FrequentItemSource['mealType'] = 'snack'
): FrequentItemSource => ({ description, eatenAt, mealType });

describe('rankFrequentItems', () => {
	it('ranks a more frequent item above a rarer one', () => {
		const entries = [
			entry('protein shaker', '2026-09-09T18:00'),
			entry('protein shaker', '2026-09-08T18:00'),
			entry('protein shaker', '2026-09-07T18:00'),
			entry('banana', '2026-09-09T10:00')
		];
		expect(rankFrequentItems(entries, { now })).toEqual(['protein shaker', 'banana']);
	});

	it('treats descriptions case- and whitespace-insensitively, keeping the most recent spelling', () => {
		const entries = [
			entry('Protein Shaker', '2026-09-09T18:00'),
			entry('  protein shaker ', '2026-09-05T18:00')
		];
		expect(rankFrequentItems(entries, { now })).toEqual(['Protein Shaker']);
	});

	it('lets recency break a frequency tie', () => {
		const entries = [
			entry('old thing', '2026-08-01T18:00'),
			entry('old thing', '2026-08-02T18:00'),
			entry('fresh thing', '2026-09-09T18:00'),
			entry('fresh thing', '2026-09-08T18:00')
		];
		expect(rankFrequentItems(entries, { now })[0]).toBe('fresh thing');
	});

	it('filters by meal type when asked', () => {
		const entries = [
			entry('cereal bar', '2026-09-09T16:00', 'snack'),
			entry('steak', '2026-09-09T20:00', 'dinner'),
			entry('steak', '2026-09-08T20:00', 'dinner')
		];
		expect(rankFrequentItems(entries, { now, mealType: 'snack' })).toEqual(['cereal bar']);
	});

	it('ignores empty descriptions and caps the list at the limit', () => {
		const entries = [
			entry('   ', '2026-09-09T18:00'),
			entry(null, '2026-09-09T18:00'),
			entry('a', '2026-09-09T18:00'),
			entry('b', '2026-09-09T18:00'),
			entry('c', '2026-09-09T18:00')
		];
		expect(rankFrequentItems(entries, { now, limit: 2 })).toHaveLength(2);
	});
});
