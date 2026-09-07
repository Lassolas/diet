import type { MealType, WeighIn, WorkoutType } from '$lib/types';

// User-facing copy is French (Eulidia convention: end-user's language).
export const MEAL_TYPE_LABEL: Record<MealType, string> = {
	breakfast: 'Petit-déj',
	lunch: 'Déjeuner',
	dinner: 'Dîner',
	snack: 'Collation'
};

/** Leading glyph for a meal type — for at-a-glance scanning of the Report. */
export const MEAL_TYPE_EMOJI: Record<MealType, string> = {
	breakfast: '🥐',
	lunch: '🍽️',
	dinner: '🍲',
	snack: '🍎'
};

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
	coaching: 'Séance individuelle (coach)'
};

/** Leading glyph for a workout type — for at-a-glance scanning of the Report. */
export const WORKOUT_TYPE_EMOJI: Record<WorkoutType, string> = {
	running: '🏃',
	bag: '🥊',
	hiit: '🔥',
	tabata: '⏱️',
	swimming: '🏊',
	sparring: '🤼',
	boxing_class: '👥',
	coaching: '🧑‍🏫'
};

/** '45 min', '1 h', '1 h 15' from a whole number of minutes. */
export function formatDuration(min: number): string {
	if (min < 60) return `${min} min`;
	const h = Math.floor(min / 60);
	const m = min % 60;
	return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}
