<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import { validateWeighIn } from '$lib/domain/validateWeighIn';
	import { nowLocalInput } from '$lib/time';
	import type { WeighIn } from '$lib/types';
	import WeightWheel from './WeightWheel.svelte';

	let {
		weighIn,
		lastWeightKg
	}: { weighIn?: WeighIn; lastWeightKg?: number | null } = $props();

	// `weighIn` is fixed for this component's lifetime (parent remounts via {#key}).
	function seed(w?: WeighIn) {
		return {
			editing: w !== undefined,
			measuredAt: w?.measuredAt ?? nowLocalInput(),
			// New weigh-in defaults to the last recorded weight; then 70 as a fallback.
			weight: w?.weightKg ?? lastWeightKg ?? 70,
			fasted: w?.fasted ?? true,
			clothed: w?.clothed ?? false
		};
	}
	const initial = untrack(() => seed(weighIn));
	const editing = initial.editing;

	let measuredAt = $state(initial.measuredAt);
	let weight = $state(initial.weight);
	let fasted = $state(initial.fasted);
	let clothed = $state(initial.clothed);
	let saving = $state(false);
	let errorMsg = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		errorMsg = '';
		const payload = { measuredAt, weightKg: weight, fasted, clothed };
		const errors = validateWeighIn(payload);
		if (errors.length) {
			errorMsg = errors.join(' ');
			return;
		}

		saving = true;
		try {
			if (editing && weighIn) await api.updateWeighIn(weighIn.id, payload);
			else await api.createWeighIn(payload);
			await goto('/poids', { invalidateAll: true });
		} catch (e) {
			errorMsg = (e as Error).message;
			saving = false;
		}
	}
</script>

<form onsubmit={submit}>
	<span class="lbl">Poids — {weight.toFixed(1)} kg</span>
	<WeightWheel bind:value={weight} />

	<label for="measuredAt">Quand</label>
	<input id="measuredAt" type="datetime-local" bind:value={measuredAt} required />

	<span class="lbl">Conditions</span>
	<div class="toggles">
		<button type="button" class:on={fasted} aria-pressed={fasted} onclick={() => (fasted = !fasted)}>
			{fasted ? 'À jeun' : 'Pas à jeun'}
		</button>
		<button
			type="button"
			class:on={clothed}
			aria-pressed={clothed}
			onclick={() => (clothed = !clothed)}
		>
			{clothed ? 'Habillé' : 'Pas habillé'}
		</button>
	</div>

	{#if errorMsg}<p class="error">{errorMsg}</p>{/if}

	<div class="actions">
		<a class="btn" href="/poids">Annuler</a>
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
	.toggles {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 6px;
	}
	.toggles button.on {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-text);
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
