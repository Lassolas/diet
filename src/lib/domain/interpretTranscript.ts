export interface TranscriptResult {
	/** Whether the transcript is usable as a Description. */
	ok: boolean;
	/** Cleaned text (trimmed, whitespace collapsed). */
	text: string;
	/** Why it was rejected, when `ok` is false. */
	reason?: 'empty' | 'unclear';
	/** Usable, but the speech engine wasn't confident — prompt the user to check. */
	lowConfidence?: boolean;
}

const FILLERS = new Set([
	'euh',
	'heu',
	'hmm',
	'hum',
	'bah',
	'ben',
	'alors',
	'donc',
	'voila',
	'voilà'
]);

const LOW_CONFIDENCE = 0.6;
const MIN_LENGTH = 3;

/**
 * Decides whether a speech-to-text result can be dropped into a meal
 * Description, or whether we should ask the user to say it again.
 */
export function interpretTranscript(raw: string, confidence?: number): TranscriptResult {
	const text = (raw ?? '').replace(/\s+/g, ' ').trim();

	if (text.length === 0) return { ok: false, text: '', reason: 'empty' };

	const words = text.toLowerCase().replace(/[.,!?;:]/g, '').split(' ').filter(Boolean);
	const allFiller = words.length > 0 && words.every((w) => FILLERS.has(w));
	if (allFiller || text.length < MIN_LENGTH) {
		return { ok: false, text, reason: 'unclear' };
	}

	if (typeof confidence === 'number' && confidence > 0 && confidence < LOW_CONFIDENCE) {
		return { ok: true, text, lowConfidence: true };
	}

	return { ok: true, text };
}
