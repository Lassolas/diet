import type { MealType, MealEntryInput } from '$lib/types';

/** A coffee is a Snack whose Description is exactly "N café(s)", N in 1–3. */
const COFFEE_RE = /^(\d+)\s+cafés?$/i;

export const MAX_COFFEE_DOSE = 3;

const clampDose = (n: number) => Math.min(MAX_COFFEE_DOSE, Math.max(1, Math.round(n || 1)));

/** Whether a Meal Entry is a one-tap coffee (vs a hand-written snack). */
export function isCoffee(entry: { mealType: MealType; description?: string | null }): boolean {
	return entry.mealType === 'snack' && COFFEE_RE.test((entry.description ?? '').trim());
}

/** The dose (1–3) carried by a coffee's Description; 1 when unparseable. */
export function coffeeDose(description: string | null): number {
	const m = (description ?? '').trim().match(COFFEE_RE);
	return clampDose(m ? Number(m[1]) : 1);
}

/** The canonical Description for a coffee of the given dose. */
export function coffeeDescription(dose: number): string {
	const n = clampDose(dose);
	return n === 1 ? '1 café' : `${n} cafés`;
}

/** The Meal Entry input for a one-tap coffee at the given wall-clock time. */
export function coffeeEntryInput(eatenAt: string, dose = 1): MealEntryInput {
	return { eatenAt, mealType: 'snack', description: coffeeDescription(dose) };
}
