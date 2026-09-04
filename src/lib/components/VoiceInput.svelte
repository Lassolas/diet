<script lang="ts">
	import { onDestroy } from 'svelte';
	import { isDictationSupported, startDictation, type DictationHandle, type DictationErrorKind } from '$lib/voice';
	import { interpretTranscript } from '$lib/domain/interpretTranscript';

	let { onText, disabled = false }: {
		onText: (text: string, lowConfidence: boolean) => void;
		disabled?: boolean;
	} = $props();

	const supported = isDictationSupported();

	type State = 'idle' | 'listening' | 'reask';
	let phase = $state<State>('idle');
	let interim = $state('');
	let message = $state('');
	let attempts = $state(0);
	let handle: DictationHandle | null = null;

	const ERROR_MESSAGE: Record<DictationErrorKind, string> = {
		unsupported: 'Dictée non disponible sur ce navigateur.',
		'not-allowed': 'Micro refusé. Autorise-le ou écris le texte.',
		'no-speech': "Je n'ai rien entendu. Réessaie ?",
		audio: 'Problème de micro. Réessaie ou écris.',
		network: 'Pas de réseau pour la dictée. Réessaie ou écris.',
		aborted: '',
		unknown: 'Échec de la dictée. Réessaie ou écris.'
	};

	function reask(msg: string) {
		attempts += 1;
		if (attempts >= 2) {
			// Stop pestering — let them type.
			phase = 'idle';
			message = 'Écris le repas ci-dessus.';
			return;
		}
		phase = 'reask';
		message = msg;
	}

	function start() {
		if (disabled) return;
		interim = '';
		message = '';
		phase = 'listening';
		let gotFinal = false;

		handle = startDictation({
			onInterim: (t) => (interim = t),
			onFinal: (t, confidence) => {
				gotFinal = true;
				const result = interpretTranscript(t, confidence);
				if (result.ok) {
					onText(result.text, !!result.lowConfidence);
					attempts = 0;
					phase = 'idle';
					interim = '';
					message = result.lowConfidence ? 'Vérifie le texte, je n’étais pas sûr.' : '';
				} else {
					reask(result.reason === 'empty' ? ERROR_MESSAGE['no-speech'] : "Je n'ai pas compris. Réessaie ?");
				}
			},
			onError: (kind) => {
				if (kind === 'aborted') {
					phase = 'idle';
					return;
				}
				reask(ERROR_MESSAGE[kind]);
			},
			onEnd: () => {
				if (phase === 'listening' && !gotFinal) reask(ERROR_MESSAGE['no-speech']);
			}
		});
	}

	function stop() {
		handle?.stop();
	}

	onDestroy(() => handle?.abort());
</script>

{#if supported}
	<div class="voice">
		{#if phase === 'listening'}
			<button type="button" class="mic on" onclick={stop} aria-label="Arrêter la dictée">
				<span class="dot"></span> J’écoute… (toucher pour arrêter)
			</button>
			{#if interim}<p class="interim">{interim}</p>{/if}
		{:else}
			<button type="button" class="mic" onclick={start} {disabled} aria-label="Dicter le repas">
				🎤 {phase === 'reask' ? 'Réessayer' : 'Dicter'}
			</button>
		{/if}
		{#if message}<p class="msg">{message}</p>{/if}
	</div>
{/if}

<style>
	.voice {
		margin-top: 8px;
	}
	.mic {
		font-size: 0.9rem;
		padding: 8px 12px;
	}
	.mic.on {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-text);
	}
	.dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: currentColor;
		margin-right: 6px;
		animation: pulse 1s ease-in-out infinite;
	}
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}
	.interim {
		margin: 6px 0 0;
		color: var(--muted);
		font-style: italic;
	}
	.msg {
		margin: 6px 0 0;
		font-size: 0.85rem;
		color: var(--muted);
	}
</style>
