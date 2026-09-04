import type { MealType, WeighIn } from '$lib/types';

// User-facing copy is French (Eulidia convention: end-user's language).
export const MEAL_TYPE_LABEL: Record<MealType, string> = {
	breakfast: 'Petit-déj',
	lunch: 'Déjeuner',
	dinner: 'Dîner',
	snack: 'Collation'
};

/** The active conditions of a weigh-in, e.g. "à jeun · habillé" or "—". */
export function conditionSummary(w: Pick<WeighIn, 'fasted' | 'clothed'>): string {
	const parts: string[] = [];
	if (w.fasted) parts.push('à jeun');
	if (w.clothed) parts.push('habillé');
	return parts.length ? parts.join(' · ') : '—';
}
