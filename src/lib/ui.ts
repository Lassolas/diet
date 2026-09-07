import type { MealType, WeighIn, WorkoutType } from '$lib/types';

// User-facing copy is French (Eulidia convention: end-user's language).
export const MEAL_TYPE_LABEL: Record<MealType, string> = {
	breakfast: 'Petit-déj',
	lunch: 'Déjeuner',
	dinner: 'Dîner',
	snack: 'Collation'
};

/** Leading glyph for a meal type — for at-a-glance scanning. */
export const MEAL_TYPE_EMOJI: Record<MealType, string> = {
	breakfast: '🥐',
	lunch: '🍽️',
	dinner: '🍲',
	snack: '🍌'
};

/**
 * Saturated accent per category — a thin coloured strip down the left edge of
 * a journal card / report line. Gold for food, red for sport, blue for a
 * weigh-in.
 */
export const MEAL_ACCENT = '#D49A2C';
export const WORKOUT_ACCENT = '#C6423B';
export const WEIGH_IN_ACCENT = '#3C6FB0';

/** The active conditions of a weigh-in, e.g. "à jeun · habillé" or "—". */
export function conditionSummary(w: Pick<WeighIn, 'fasted' | 'clothed'>): string {
	const parts: string[] = [];
	if (w.fasted) parts.push('à jeun');
	if (w.clothed) parts.push('habillé');
	return parts.length ? parts.join(' · ') : '—';
}

export const WORKOUT_TYPE_LABEL: Record<WorkoutType, string> = {
	running: 'Course à pied',
	bag: 'Sac de frappe',
	hiit: 'HIIT',
	tabata: 'Tabata',
	swimming: 'Piscine',
	sparring: 'Sparring',
	boxing_class: 'Cours de boxe collectif',
	coaching: 'Séance individuelle (coach)',
	musculation: 'Musculation',
	paos: "Pattes d'ours",
	rope: 'Corde à sauter',
	prepa: 'Prépa physique',
	cycling: 'Vélo / home-trainer',
	rowing: 'Rameur',
	circuit: 'Circuit training',
	mobility: 'Mobilité / étirements',
	yoga: 'Yoga / Pilates'
};

/**
 * Leading glyph per workout type. The category is already carried by the tint
 * (WORKOUT_TINT) and the "Sport" section, so this can be specific.
 */
export const WORKOUT_TYPE_EMOJI: Record<WorkoutType, string> = {
	running: '🏃',
	bag: '🥊',
	hiit: '🔥',
	tabata: '⏱️',
	swimming: '🏊',
	sparring: '🤼',
	boxing_class: '👥',
	coaching: '🧑‍🏫',
	musculation: '🏋️',
	paos: '🎯',
	rope: '🪢',
	prepa: '💪',
	cycling: '🚴',
	rowing: '🚣',
	circuit: '🔁',
	mobility: '🤸',
	yoga: '🧘'
};

/** '45 min', '1 h', '1 h 15' from a whole number of minutes. */
export function formatDuration(min: number): string {
	if (min < 60) return `${min} min`;
	const h = Math.floor(min / 60);
	const m = min % 60;
	return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}
