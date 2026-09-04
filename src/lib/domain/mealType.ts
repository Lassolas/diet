import type { MealType } from '$lib/types';

/**
 * The Meal Type suggested for a given moment, by wall-clock hour:
 *   06:00–10:59 breakfast · 11:00–14:59 lunch · 15:00–17:59 snack ·
 *   18:00–22:59 dinner · everything else (late night / early morning) snack.
 *
 * Uses the Date's local hour, which on the user's device is Europe/Paris.
 */
export function mealTypeForTime(date: Date): MealType {
	const hour = date.getHours();
	if (hour >= 6 && hour < 11) return 'breakfast';
	if (hour >= 11 && hour < 15) return 'lunch';
	if (hour >= 15 && hour < 18) return 'snack';
	if (hour >= 18 && hour < 23) return 'dinner';
	return 'snack';
}
