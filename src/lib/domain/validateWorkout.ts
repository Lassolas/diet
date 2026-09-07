import { WORKOUT_TYPES, type WorkoutInput } from '$lib/types';

export const MIN_DURATION_MIN = 5;
export const MAX_DURATION_MIN = 600;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_FEELING_LENGTH = 1000;

const STARTED_AT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * Validates a Workout input. Returns a list of human-readable problems;
 * an empty list means the input is valid.
 */
export function validateWorkout(input: WorkoutInput): string[] {
	const errors: string[] = [];

	if (!STARTED_AT_RE.test(input.startedAt ?? '')) {
		errors.push('Time must be in the form YYYY-MM-DDTHH:MM.');
	} else if (Number.isNaN(Date.parse(input.startedAt))) {
		errors.push('Time is not a real date.');
	}

	if (!Number.isInteger(input.durationMin)) {
		errors.push('Duration must be a whole number of minutes.');
	} else if (input.durationMin < MIN_DURATION_MIN || input.durationMin > MAX_DURATION_MIN) {
		errors.push(`Duration must be between ${MIN_DURATION_MIN} and ${MAX_DURATION_MIN} minutes.`);
	}

	if (!WORKOUT_TYPES.includes(input.workoutType)) {
		errors.push(`Workout type must be one of: ${WORKOUT_TYPES.join(', ')}.`);
	}

	const description = (input.description ?? '').trim();
	if (description.length === 0) {
		errors.push('Add a description of the workout.');
	} else if (description.length > MAX_DESCRIPTION_LENGTH) {
		errors.push(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
	}

	const feeling = (input.feeling ?? '').trim();
	if (feeling.length > MAX_FEELING_LENGTH) {
		errors.push(`How it felt must be ${MAX_FEELING_LENGTH} characters or fewer.`);
	}

	if (!Number.isInteger(input.intensity) || input.intensity < 1 || input.intensity > 10) {
		errors.push('Intensity must be a whole number from 1 to 10.');
	}

	return errors;
}
