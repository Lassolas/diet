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
