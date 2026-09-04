// Thin wrapper around the browser Web Speech API (SpeechRecognition).
// Spike: evaluating whether this is reliable enough on the target device
// before committing to it over a server-side (Workers AI Whisper) path.

export type DictationErrorKind =
	| 'unsupported'
	| 'not-allowed'
	| 'no-speech'
	| 'audio'
	| 'network'
	| 'aborted'
	| 'unknown';

export interface DictationCallbacks {
	onInterim?: (text: string) => void;
	onFinal: (text: string, confidence: number) => void;
	onError: (kind: DictationErrorKind) => void;
	onEnd?: () => void;
}

export interface DictationHandle {
	stop: () => void;
	abort: () => void;
}

/* Minimal typings — SpeechRecognition is not in the standard DOM lib. */
interface SpeechRecognitionLike {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	maxAlternatives: number;
	start(): void;
	stop(): void;
	abort(): void;
	onresult: ((e: SpeechRecognitionEventLike) => void) | null;
	onerror: ((e: { error: string }) => void) | null;
	onend: (() => void) | null;
}
interface SpeechRecognitionEventLike {
	results: ArrayLike<
		ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }
	>;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
	if (typeof window === 'undefined') return null;
	const w = window as unknown as {
		SpeechRecognition?: SpeechRecognitionCtor;
		webkitSpeechRecognition?: SpeechRecognitionCtor;
	};
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isDictationSupported(): boolean {
	return getCtor() !== null;
}

const ERROR_MAP: Record<string, DictationErrorKind> = {
	'not-allowed': 'not-allowed',
	'service-not-allowed': 'not-allowed',
	'no-speech': 'no-speech',
	'audio-capture': 'audio',
	network: 'network',
	aborted: 'aborted'
};

export function startDictation(cb: DictationCallbacks): DictationHandle {
	const Ctor = getCtor();
	if (!Ctor) {
		cb.onError('unsupported');
		return { stop: () => {}, abort: () => {} };
	}

	const rec = new Ctor();
	rec.lang = 'fr-FR';
	rec.continuous = false;
	rec.interimResults = true;
	rec.maxAlternatives = 1;

	rec.onresult = (e) => {
		let interim = '';
		for (let i = 0; i < e.results.length; i++) {
			const result = e.results[i];
			const alt = result[0];
			if (result.isFinal) {
				cb.onFinal(alt.transcript, alt.confidence ?? 0);
			} else {
				interim += alt.transcript;
			}
		}
		if (interim) cb.onInterim?.(interim);
	};

	rec.onerror = (e) => cb.onError(ERROR_MAP[e.error] ?? 'unknown');
	rec.onend = () => cb.onEnd?.();

	try {
		rec.start();
	} catch {
		cb.onError('unknown');
	}

	return {
		stop: () => {
			try {
				rec.stop();
			} catch {
				/* already stopped */
			}
		},
		abort: () => {
			try {
				rec.abort();
			} catch {
				/* already stopped */
			}
		}
	};
}
