<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import { validateSleep } from '$lib/domain/validateSleep';
	import { daysAgoDate, todayDate } from '$lib/time';
	import { formatDuration, sleepQualityEmoji } from '$lib/ui';
	import { SLEEP_QUALITY_DEFAULT, type Sleep } from '$lib/types';
	import QualityWheel from './QualityWheel.svelte';
	import VoiceInput from './VoiceInput.svelte';

	let { sleep, autostartVoice = false }: { sleep?: Sleep; autostartVoice?: boolean } = $props();

	// `sleep` is fixed for this component's lifetime (parent remounts via {#key}).
	function seed(s?: Sleep) {
		return {
			editing: s !== undefined,
			bedAt: s?.bedAt ?? `${daysAgoDate(1)}T23:00`,
			wakeAt: s?.wakeAt ?? `${todayDate()}T07:00`,
			quality: s?.quality ?? SLEEP_QUALITY_DEFAULT,
			note: s?.note ?? ''
		};
	}
	const initial = untrack(() => seed(sleep));
	const editing = initial.editing;

	let bedAt = $state(initial.bedAt);
	let wakeAt = $state(initial.wakeAt);
	let quality = $state(initial.quality);
	let note = $state(initial.note);
	let saving = $state(false);
	let errorMsg = $state('');

	const durationMin = $derived((Date.parse(wakeAt) - Date.parse(bedAt)) / 60000);
	const durationLabel = $derived(
		Number.isFinite(durationMin) && durationMin > 0 ? formatDuration(Math.round(durationMin)) : '—'
	);

	function onDictated(text: string) {
		const current = note.trim();
		note = current ? `${current} ${text}` : text;
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		errorMsg = '';
		const payload = { bedAt, wakeAt, quality, note };
		const errors = validateSleep(payload);
		if (errors.length) {
			errorMsg = errors.join(' ');
			return;
		}

		saving = true;
		try {
			if (editing && sleep) await api.updateSleep(sleep.id, payload);
			else await api.createSleep(payload);
			await goto('/dodo', { invalidateAll: true });
		} catch (e) {
			errorMsg = (e as Error).message;
			saving = false;
		}
	}
</script>

<form onsubmit={submit}>
	<label for="bedAt">Couché</label>
	<input id="bedAt" type="datetime-local" bind:value={bedAt} required />

	<label for="wakeAt">Réveil</label>
	<input id="wakeAt" type="datetime-local" bind:value={wakeAt} required />

	<span class="lbl">Durée — {durationLabel}</span>

	<span class="lbl">Qualité — {sleepQualityEmoji(quality)} {quality} %</span>
	<QualityWheel bind:value={quality} />

	<label for="note">Note (optionnel)</label>
	<textarea
		id="note"
		rows="2"
		bind:value={note}
		placeholder="réveils nocturnes, mal au dos, beaucoup rêvé…"
	></textarea>
	<VoiceInput onText={onDictated} disabled={saving} autostart={autostartVoice} />

	{#if errorMsg}<p class="error">{errorMsg}</p>{/if}

	<div class="actions">
		<a class="btn" href="/dodo">Annuler</a>
		<button type="submit" class="primary" disabled={saving}>
			{saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
		</button>
	</div>
</form>

<style>
	.lbl {
		display: block;
		font-size: 0.85rem;
		color: var(--muted);
		margin: 14px 0 6px;
	}
	.actions {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		margin-top: 24px;
	}
	.actions .primary {
		flex: 1;
	}
	a.btn {
		text-decoration: none;
		display: inline-flex;
		align-items: center;
	}
</style>
