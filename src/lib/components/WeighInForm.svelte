<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import { validateWeighIn } from '$lib/domain/validateWeighIn';
	import { nowLocalInput } from '$lib/time';
	import { WEIGH_IN_CONDITIONS, type WeighIn, type WeighInCondition } from '$lib/types';
	import { CONDITION_LABEL } from '$lib/ui';

	let { weighIn }: { weighIn?: WeighIn } = $props();

	// `weighIn` is fixed for this component's lifetime (parent remounts via {#key}).
	function seed(w?: WeighIn) {
		return {
			editing: w !== undefined,
			measuredAt: w?.measuredAt ?? nowLocalInput(),
			weight: w ? String(w.weightKg) : '',
			condition: (w?.condition ?? 'fasted') as WeighInCondition
		};
	}
	const initial = untrack(() => seed(weighIn));
	const editing = initial.editing;

	let measuredAt = $state(initial.measuredAt);
	let weight = $state(initial.weight);
	let condition = $state<WeighInCondition>(initial.condition);
	let saving = $state(false);
	let errorMsg = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		errorMsg = '';
		const weightKg = Number(weight.replace(',', '.'));
		const payload = { measuredAt, weightKg, condition };
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
	<label for="weight">Poids (kg)</label>
	<input
		id="weight"
		type="number"
		inputmode="decimal"
		step="0.1"
		min="20"
		max="400"
		bind:value={weight}
		placeholder="72.4"
		required
	/>

	<label for="measuredAt">Quand</label>
	<input id="measuredAt" type="datetime-local" bind:value={measuredAt} required />

	<span class="lbl">Condition</span>
	<div class="picker">
		{#each WEIGH_IN_CONDITIONS as c (c)}
			<button
				type="button"
				class:active={condition === c}
				aria-pressed={condition === c}
				onclick={() => (condition = c)}
			>
				{CONDITION_LABEL[c]}
			</button>
		{/each}
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
		margin: 14px 0 4px;
	}
	.picker {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 6px;
	}
	.picker button.active {
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
