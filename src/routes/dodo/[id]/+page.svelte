<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import SleepForm from '$lib/components/SleepForm.svelte';
	import { api } from '$lib/api';

	let { data }: { data: PageData } = $props();
	let confirming = $state(false);
	let deleting = $state(false);
	let errorMsg = $state('');

	async function remove() {
		deleting = true;
		try {
			await api.deleteSleep(data.sleep.id);
			await goto('/dodo', { invalidateAll: true });
		} catch (e) {
			errorMsg = (e as Error).message;
			deleting = false;
		}
	}
</script>

<header><a class="btn" href="/dodo">← Dodo</a></header>
<h1>Modifier le dodo</h1>

{#key data.sleep.id}
	<SleepForm sleep={data.sleep} />
{/key}

<div class="delete">
	{#if confirming}
		<p>Supprimer ce dodo&nbsp;?</p>
		<button class="danger" onclick={remove} disabled={deleting}>
			{deleting ? 'Suppression…' : 'Oui, supprimer'}
		</button>
		<button onclick={() => (confirming = false)}>Annuler</button>
	{:else}
		<button class="danger" onclick={() => (confirming = true)}>Supprimer</button>
	{/if}
	{#if errorMsg}<p class="error">{errorMsg}</p>{/if}
</div>

<style>
	header {
		padding-top: 12px;
	}
	header .btn {
		text-decoration: none;
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
