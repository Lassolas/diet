import type { SleepInput } from '$lib/types';

/** A night longer than this is almost certainly a wrong wake date. */
export const MAX_DURATION_MIN = 18 * 60;
export const MAX_NOTE_LENGTH = 1000;

const AT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * Validates a Sleep input. Returns a list of human-readable problems; an empty
 * list means the input is valid.
 */
export function validateSleep(input: SleepInput): string[] {
	const errors: string[] = [];

	const bedOk = AT_RE.test(input.bedAt ?? '');
	const wakeOk = AT_RE.test(input.wakeAt ?? '');
	if (!bedOk || !wakeOk) {
		errors.push('Times must be in the form YYYY-MM-DDTHH:MM.');
	} else {
		const bed = Date.parse(input.bedAt);
		const wake = Date.parse(input.wakeAt);
		if (Number.isNaN(bed) || Number.isNaN(wake)) {
			errors.push('A time is not a real date.');
		} else if (wake <= bed) {
			errors.push('Wake time must be after bed time.');
		} else if ((wake - bed) / 60000 > MAX_DURATION_MIN) {
			errors.push(`Sleep can't be longer than ${MAX_DURATION_MIN / 60} h — check the dates.`);
		}
	}

	if (!Number.isInteger(input.quality) || input.quality < 0 || input.quality > 100) {
		errors.push('Quality must be a whole number from 0 to 100.');
	}

	const note = (input.note ?? '').trim();
	if (note.length > MAX_NOTE_LENGTH) {
		errors.push(`Note must be ${MAX_NOTE_LENGTH} characters or fewer.`);
	}

	return errors;
}
