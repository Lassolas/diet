export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MAX_PHOTOS_PER_ENTRY = 5;

export interface Photo {
	id: string;
	position: number;
	/** Relative URL the client can load, e.g. `/photos/photos/<entryId>/<photoId>.jpg`. */
	url: string;
}

export interface MealEntry {
	id: string;
	/** 'YYYY-MM-DDTHH:MM', Europe/Paris wall-clock (ADR 0002). */
	eatenAt: string;
	mealType: MealType;
	description: string | null;
	note: string | null;
	photos: Photo[];
	createdAt: string;
	updatedAt: string;
}

/** Fields accepted when creating or patching an entry. */
export interface MealEntryInput {
	eatenAt: string;
	mealType: MealType;
	description?: string | null;
	note?: string | null;
	/** Whether the entry has (or will have) at least one photo. Used for validation. */
	hasPhoto?: boolean;
}

export interface WeighIn {
	id: string;
	/** 'YYYY-MM-DDTHH:MM', Europe/Paris wall-clock (ADR 0002). */
	measuredAt: string;
	weightKg: number;
	/** Empty stomach at the time of the weigh-in. */
	fasted: boolean;
	/** Wearing clothes at the time of the weigh-in. */
	clothed: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface WeighInInput {
	measuredAt: string;
	weightKg: number;
	fasted: boolean;
	clothed: boolean;
}

export const WORKOUT_TYPES = [
	'running',
	'bag',
	'hiit',
	'tabata',
	'swimming',
	'sparring',
	'boxing_class',
	'coaching',
	'musculation'
] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

/** Duration is entered in 15-minute steps around a 45-minute default. */
export const WORKOUT_DURATION_STEP_MIN = 15;
export const WORKOUT_DURATION_DEFAULT_MIN = 45;
export const WORKOUT_INTENSITY_DEFAULT = 5;

export interface Workout {
	id: string;
	/** 'YYYY-MM-DDTHH:MM', Europe/Paris wall-clock (ADR 0002). Start of the session. */
	startedAt: string;
	/** Whole minutes. */
	durationMin: number;
	workoutType: WorkoutType;
	description: string;
	/** How it felt — pain, fatigue, form. Optional. */
	feeling: string | null;
	/** Perceived intensity, 1–10. */
	intensity: number;
	createdAt: string;
	updatedAt: string;
}

export interface WorkoutInput {
	startedAt: string;
	durationMin: number;
	workoutType: WorkoutType;
	description: string;
	feeling?: string | null;
	intensity: number;
}
