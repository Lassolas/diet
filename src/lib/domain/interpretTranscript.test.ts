import { describe, it, expect } from 'vitest';
import { interpretTranscript } from './interpretTranscript';

describe('interpretTranscript', () => {
	it('accepts a normal meal description', () => {
		expect(interpretTranscript('deux œufs, pain complet et un café', 0.92)).toEqual({
			ok: true,
			text: 'deux œufs, pain complet et un café'
		});
	});

	it('collapses whitespace and trims', () => {
		expect(interpretTranscript('  poulet   riz \n salade  ').text).toBe('poulet riz salade');
	});

	it('rejects an empty transcript', () => {
		expect(interpretTranscript('   ')).toEqual({ ok: false, text: '', reason: 'empty' });
	});

	it('rejects a transcript that is only filler words', () => {
		expect(interpretTranscript('euh hmm bah').reason).toBe('unclear');
		expect(interpretTranscript('euh hmm bah').ok).toBe(false);
	});

	it('rejects a too-short transcript', () => {
		expect(interpretTranscript('ok').reason).toBe('unclear');
	});

	it('flags a low-confidence result but keeps the text', () => {
		const r = interpretTranscript('salade de chèvre chaud', 0.41);
		expect(r.ok).toBe(true);
		expect(r.lowConfidence).toBe(true);
		expect(r.text).toBe('salade de chèvre chaud');
	});

	it('does not flag when confidence is unknown (0 or missing)', () => {
		expect(interpretTranscript('yaourt nature').lowConfidence).toBeUndefined();
		expect(interpretTranscript('yaourt nature', 0).lowConfidence).toBeUndefined();
	});
});
