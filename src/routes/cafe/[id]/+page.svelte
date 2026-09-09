<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { api } from '$lib/api';
	import { coffeeDose, coffeeDescription, MAX_COFFEE_DOSE } from '$lib/domain/coffee';

	let { data }: { data: PageData } = $props();

	const initial = untrack(() => ({
		eatenAt: data.entry.eatenAt,
		dose: coffeeDose(data.entry.description)
	}));

	let eatenAt = $state(initial.eatenAt);
	let dose = $state(initial.dose);
	let saving = $state(false);
	let confirming = $state(false);
	let deleting = $state(false);
	let errorMsg = $state('');

	async function save(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		errorMsg = '';
		try {
			await api.updateEntry(data.entry.id, {
				eatenAt,
				mealType: 'snack',
				description: coffeeDescription(dose)
			});
			await goto('/', { invalidateAll: true });
		} catch (e) {
			errorMsg = (e as Error).message;
			saving = false;
		}
	}

	async function remove() {
		deleting = true;
		try {
			await api.deleteEntry(data.entry.id);
			await goto('/', { invalidateAll: true });
		} catch (e) {
			errorMsg = (e as Error).message;
			deleting = false;
		}
	}
</script>

<header><a class="btn" href="/">← Journal</a></header>
<h1>☕ Café</h1>

<form onsubmit={save}>
	<label for="eatenAt">Quand</label>
	<input id="eatenAt" type="datetime-local" bind:value={eatenAt} required />

	<span class="lbl">Dose</span>
	<div class="doses">
		{#each Array.from({ length: MAX_COFFEE_DOSE }, (_, i) => i + 1) as d (d)}
			<button type="button" class:on={dose === d} onclick={() => (dose = d)} aria-pressed={dose === d}>
				{'☕'.repeat(d)}
			</button>
		{/each}
	</div>

	{#if errorMsg}<p class="error">{errorMsg}</p>{/if}

	<div class="actions">
		<a class="btn" href="/">Annuler</a>
		<button type="submit" class="primary" disabled={saving}>
			{saving ? 'Enregistrement…' : 'Enregistrer'}
		</button>
	</div>
</form>

<div class="delete">
	{#if confirming}
		<p>Supprimer ce café&nbsp;?</p>
		<button class="danger" onclick={remove} disabled={deleting}>
			{deleting ? 'Suppression…' : 'Oui, supprimer'}
		</button>
		<button onclick={() => (confirming = false)}>Annuler</button>
	{:else}
		<button class="danger" onclick={() => (confirming = true)}>Supprimer</button>
	{/if}
</div>

<style>
	header {
		padding-top: 12px;
	}
	header .btn {
		text-decoration: none;
	}
	.lbl {
		display: block;
		font-size: 0.85rem;
		color: var(--muted);
		margin: 14px 0 6px;
	}
	.doses {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}
	.doses button {
		padding: 12px 4px;
		font-size: 1rem;
		letter-spacing: 2px;
	}
	.doses button.on {
		background: var(--accent);
		border-color: var(--accent);
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
	.delete {
		margin-top: 32px;
		padding-top: 16px;
		border-top: 1px solid var(--border);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}
	.delete p {
		width: 100%;
		margin: 0;
	}
</style>
