import type { MealType, WeighIn } from '$lib/types';

// User-facing copy is French (Eulidia convention: end-user's language).
export const MEAL_TYPE_LABEL: Record<MealType, string> = {
	breakfast: 'Petit-déj',
	lunch: 'Déjeuner',
	dinner: 'Dîner',
	snack: 'Collation'
};

/** Short French summary of a weigh-in's conditions, e.g. "à jeun · habillé". */
export function conditionSummary(w: Pick<WeighIn, 'fasted' | 'clothed'>): string {
	const parts: string[] = [];
	parts.push(w.fasted ? 'à jeun' : 'pas à jeun');
	parts.push(w.clothed ? 'habillé' : 'pas habillé');
	return parts.join(' · ');
}
