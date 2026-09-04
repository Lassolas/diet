import type { MealType } from '$lib/types';

export interface FrequentItemSource {
	description: string | null;
	/** 'YYYY-MM-DDTHH:MM' wall-clock. */
	eatenAt: string;
	mealType: MealType;
}

export interface RankOptions {
	/** Only consider entries of this Meal Type. */
	mealType?: MealType;
	/** Reference "now" for recency weighting. Defaults to the current time. */
	now?: Date;
	/** Maximum number of items to return. */
	limit?: number;
}

const DAILY_DECAY = 0.9;
const MS_PER_DAY = 86_400_000;

/**
 * Ranks past Descriptions as Frequent Items: repeated entries score higher,
 * recent entries score higher. Each occurrence contributes DAILY_DECAY ^ daysAgo;
 * scores for the same Description (case-insensitive) are summed.
 *
 * Returns the display text of the top items, most relevant first.
 */
export function rankFrequentItems(
	entries: FrequentItemSource[],
	{ mealType, now = new Date(), limit = 6 }: RankOptions = {}
): string[] {
	const nowMs = now.getTime();
	const acc = new Map<string, { text: string; score: number; lastMs: number }>();

	for (const entry of entries) {
		if (mealType && entry.mealType !== mealType) continue;
		const text = (entry.description ?? '').trim();
		if (text.length === 0) continue;

		const eatenMs = Date.parse(entry.eatenAt);
		if (Number.isNaN(eatenMs)) continue;

		const daysAgo = Math.max(0, (nowMs - eatenMs) / MS_PER_DAY);
		const weight = DAILY_DECAY ** daysAgo;

		const key = text.toLowerCase();
		const current = acc.get(key);
		if (current) {
			current.score += weight;
			if (eatenMs > current.lastMs) {
				current.lastMs = eatenMs;
				current.text = text;
			}
		} else {
			acc.set(key, { text, score: weight, lastMs: eatenMs });
		}
	}

	return [...acc.values()]
		.sort((a, b) => b.score - a.score || b.lastMs - a.lastMs)
		.slice(0, limit)
		.map((item) => item.text);
}
