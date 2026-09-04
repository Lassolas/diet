<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { api } from '$lib/api';
	import {
		isDictationSupported,
		startDictation,
		type DictationHandle,
		type DictationErrorKind
	} from '$lib/voice';
	import { interpretTranscript } from '$lib/domain/interpretTranscript';
	import { mealTypeForTime } from '$lib/domain/mealType';
	import { nowLocalInput, formatTime } from '$lib/time';
	import { MEAL_TYPE_LABEL } from '$lib/ui';
	import type { MealType } from '$lib/types';

	let { data }: { data: PageData } = $props();

	const collation = untrack(() => data.collation);
	const now = nowLocalInput();
	const mealType: MealType = collation ? 'snack' : mealTypeForTime(new Date());
	const heading = collation ? 'Collation' : MEAL_TYPE_LABEL[mealType];
	const writeHref = `/add${collation ? '?type=collation' : ''}`;

	type Phase = 'listening' | 'saving' | 'reask';
	let phase = $state<Phase>('listening');
	let interim = $state('');
	let message = $state('');
	let attempts = $state(0);
	let handle: DictationHandle | null = null;

	const ERR: Record<DictationErrorKind, string> = {
		unsupported: 'Dictée non disponible.',
		'not-allowed': 'Micro refusé. Autorise-le, ou écris le repas.',
		'no-speech': "Je n'ai rien entendu.",
		audio: 'Problème de micro.',
		network: 'Pas de réseau pour la dictée.',
		aborted: '',
		unknown: 'Échec de la dictée.'
	};

	async function save(text: string) {
		phase = 'saving';
		try {
			const entry = await api.createEntry({ eatenAt: now, mealType, description: text });
			await goto(`/entry/${entry.id}`, { invalidateAll: true });
		} catch (e) {
			message = (e as Error).message;
			phase = 'reask';
		}
	}

	function reask(msg: string) {
		attempts += 1;
		message = msg;
		phase = 'reask';
	}

	function listen() {
		interim = '';
		message = '';
		phase = 'listening';
		let gotFinal = false;
		handle = startDictation({
			onInterim: (t) => (interim = t),
			onFinal: (t, confidence) => {
				gotFinal = true;
				const r = interpretTranscript(t, confidence);
				if (r.ok) save(r.text);
				else reask(r.reason === 'empty' ? ERR['no-speech'] : "Je n'ai pas compris.");
			},
			onError: (kind) => {
				if (kind === 'aborted') return;
				reask(ERR[kind]);
			},
			onEnd: () => {
				if (phase === 'listening' && !gotFinal) reask(ERR['no-speech']);
			}
		});
	}

	onMount(() => {
		if (!isDictationSupported()) {
			goto(writeHref, { replaceState: true });
			return;
		}
		listen();
	});
	onDestroy(() => handle?.abort());
</script>

<div class="dicter">
	<a class="close" href="/" aria-label="Annuler">×</a>

	<p class="ctx">{heading} · {formatTime(now)}</p>

	{#if phase === 'listening'}
		<button class="orb on" onclick={() => handle?.stop()} aria-label="Arrêter">
			<span class="wave"></span>🎤
		</button>
		<p class="hint">{interim || 'Parle maintenant…'}</p>
		<p class="sub">Touche le micro pour arrêter</p>
	{:else if phase === 'saving'}
		<div class="orb"><span class="spin"></span></div>
		<p class="hint">Enregistrement…</p>
	{:else}
		<div class="orb muted">🎤</div>
		<p class="hint">{message}</p>
		<div class="row">
			<button class="primary" onclick={listen}>Réessayer</button>
			<a class="btn" href={writeHref}>Écrire à la place</a>
		</div>
	{/if}
</div>

<style>
	.dicter {
		min-height: 80vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 14px;
		text-align: center;
		padding: 24px 0;
	}
	.close {
		position: absolute;
		top: 12px;
		right: 16px;
		font-size: 1.8rem;
		line-height: 1;
		text-decoration: none;
		color: var(--muted);
	}
	.ctx {
		color: var(--muted);
		text-transform: capitalize;
		margin: 0;
	}
	.orb {
		width: 128px;
		height: 128px;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--surface);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		position: relative;
	}
	.orb.on {
		background: var(--accent);
		border-color: var(--accent);
		cursor: pointer;
	}
	.orb.muted {
		opacity: 0.6;
	}
	.wave {
		position: absolute;
		inset: -6px;
		border-radius: 999px;
		border: 2px solid var(--accent);
		animation: ping 1.4s ease-out infinite;
	}
	@keyframes ping {
		0% {
			transform: scale(1);
			opacity: 0.7;
		}
		100% {
			transform: scale(1.35);
			opacity: 0;
		}
	}
	.spin {
		width: 36px;
		height: 36px;
		border-radius: 999px;
		border: 3px solid var(--border);
		border-top-color: var(--accent);
		animation: rot 0.8s linear infinite;
	}
	@keyframes rot {
		to {
			transform: rotate(360deg);
		}
	}
	.hint {
		font-size: 1.1rem;
		margin: 0;
		max-width: 20rem;
	}
	.sub {
		color: var(--muted);
		font-size: 0.85rem;
		margin: 0;
	}
	.row {
		display: flex;
		gap: 10px;
		align-items: center;
	}
	.btn,
	.row a {
		text-decoration: none;
	}
</style>
