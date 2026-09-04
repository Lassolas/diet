import { MEAL_TYPES, type MealEntryInput } from '$lib/types';

export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_NOTE_LENGTH = 1000;

const EATEN_AT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * Validates a Meal Entry input. Returns a list of human-readable problems;
 * an empty list means the input is valid.
 *
 * The core domain rule: an entry must carry a Description or at least one photo.
 */
export function validateEntry(input: MealEntryInput): string[] {
	const errors: string[] = [];

	if (!EATEN_AT_RE.test(input.eatenAt ?? '')) {
		errors.push('Time must be in the form YYYY-MM-DDTHH:MM.');
	} else if (Number.isNaN(Date.parse(input.eatenAt))) {
		errors.push('Time is not a real date.');
	}

	if (!MEAL_TYPES.includes(input.mealType)) {
		errors.push(`Meal type must be one of: ${MEAL_TYPES.join(', ')}.`);
	}

	const description = (input.description ?? '').trim();
	if (description.length === 0 && !input.hasPhoto) {
		errors.push('Add a description or at least one photo.');
	}
	if (description.length > MAX_DESCRIPTION_LENGTH) {
		errors.push(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
	}

	const note = (input.note ?? '').trim();
	if (note.length > MAX_NOTE_LENGTH) {
		errors.push(`Note must be ${MAX_NOTE_LENGTH} characters or fewer.`);
	}

	return errors;
}
