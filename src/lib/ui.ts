import type { MealType, WeighInCondition } from '$lib/types';

// User-facing copy is French (Eulidia convention: end-user's language).
export const MEAL_TYPE_LABEL: Record<MealType, string> = {
	breakfast: 'Petit-déj',
	lunch: 'Déjeuner',
	dinner: 'Dîner',
	snack: 'Collation'
};

export const CONDITION_LABEL: Record<WeighInCondition, string> = {
	fasted: 'À jeun',
	clothed: 'Habillé'
};
