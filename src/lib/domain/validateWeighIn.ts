import type { WeighInInput } from '$lib/types';

export const MIN_WEIGHT_KG = 20;
export const MAX_WEIGHT_KG = 400;

const MEASURED_AT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * Validates a Weigh-in input. Returns a list of human-readable problems;
 * an empty list means the input is valid.
 */
export function validateWeighIn(input: WeighInInput): string[] {
	const errors: string[] = [];

	if (!MEASURED_AT_RE.test(input.measuredAt ?? '')) {
		errors.push('Time must be in the form YYYY-MM-DDTHH:MM.');
	} else if (Number.isNaN(Date.parse(input.measuredAt))) {
		errors.push('Time is not a real date.');
	}

	if (typeof input.weightKg !== 'number' || !Number.isFinite(input.weightKg)) {
		errors.push('Weight must be a number.');
	} else if (input.weightKg < MIN_WEIGHT_KG || input.weightKg > MAX_WEIGHT_KG) {
		errors.push(`Weight must be between ${MIN_WEIGHT_KG} and ${MAX_WEIGHT_KG} kg.`);
	}

	if (typeof input.fasted !== 'boolean' || typeof input.clothed !== 'boolean') {
		errors.push('Fasted and clothed must be true or false.');
	}

	return errors;
}
