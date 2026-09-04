<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { groupEntriesByDay } from '$lib/domain/reportGrouping';
	import { formatTime, formatDay } from '$lib/time';
	import { MEAL_TYPE_LABEL, conditionSummary } from '$lib/ui';

	let { data }: { data: PageData } = $props();

	// Seed the date inputs from the loaded range once; navigation reloads the page.
	const range = untrack(() => ({ from: data.from, to: data.to }));
	let from = $state(range.from);
	let to = $state(range.to);
	let withPhotos = $state(true);

	const days = $derived(groupEntriesByDay(data.entries, data.from, data.to));
	const weighIns = $derived([...data.weighIns].reverse()); // oldest first for the report
	const generatedAt = new Intl.DateTimeFormat('fr-FR', {
		dateStyle: 'long',
		timeStyle: 'short'
	}).format(new Date());

	function apply() {
		goto(`/report?from=${from}&to=${to}`, { invalidateAll: true });
	}
</script>

<div class="controls no-print">
	<a class="btn" href="/">← Journal</a>
	<label>Du <input type="date" bind:value={from} max={to} /></label>
	<label>Au <input type="date" bind:value={to} min={from} /></label>
	<label class="cb"><input type="checkbox" bind:checked={withPhotos} /> Photos</label>
	<button onclick={apply}>Appliquer</button>
	<button class="primary" onclick={() => window.print()}>Imprimer / PDF</button>
</div>

<article class="report" class:hide-photos={!withPhotos}>
	<h1>Journal alimentaire</h1>
	<p class="meta">Du {formatDay(data.from)} au {formatDay(data.to)} · généré le {generatedAt}</p>

	{#if weighIns.length}
		<section class="weights">
			<h2>Poids</h2>
			<table>
				<thead>
					<tr><th>Date</th><th>Heure</th><th>Poids</th><th>Conditions</th></tr>
				</thead>
				<tbody>
					{#each weighIns as w (w.id)}
						<tr>
							<td>{formatDay(w.measuredAt.slice(0, 10))}</td>
							<td>{formatTime(w.measuredAt)}</td>
							<td>{w.weightKg.toFixed(1)} kg</td>
							<td>{conditionSummary(w)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}

	{#each days as day (day.date)}
		<section class="day">
			<h2>{formatDay(day.date)}</h2>
			{#if day.entries.length === 0}
				<p class="none">Aucun repas enregistré</p>
			{:else}
				{#each day.entries as entry (entry.id)}
					<div class="entry">
						<div class="head">
							<span class="time">{formatTime(entry.eatenAt)}</span>
							<span class="type">{MEAL_TYPE_LABEL[entry.mealType]}</span>
							<span class="desc">{entry.description ?? ''}</span>
						</div>
						{#if entry.note}<p class="note">{entry.note}</p>{/if}
						{#if withPhotos && entry.photos.length}
							<div class="photos">
								{#each entry.photos as photo (photo.id)}<img src={photo.url} alt="" />{/each}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</section>
	{/each}
</article>

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		padding: 12px 0;
	}
	.controls label {
		margin: 0;
		color: var(--text);
		font-size: 0.9rem;
	}
	.controls input[type='date'] {
		width: auto;
	}
	.controls .cb {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.controls .cb input {
		width: auto;
	}
	.controls .btn {
		text-decoration: none;
	}

	.report {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 24px;
	}
	.report h1 {
		margin: 0;
	}
	.meta {
		color: var(--muted);
		font-size: 0.9rem;
		margin: 4px 0 20px;
	}
	.weights {
		break-inside: avoid;
		margin-bottom: 22px;
	}
	.weights table {
		border-collapse: collapse;
		width: 100%;
		font-size: 0.9rem;
	}
	.weights th,
	.weights td {
		text-align: left;
		padding: 4px 8px;
		border-bottom: 1px solid var(--border);
	}
	.weights th {
		text-transform: capitalize;
	}
	.weights td:first-child {
		text-transform: capitalize;
	}
	.day {
		break-inside: avoid;
		margin-bottom: 18px;
	}
	.day h2,
	.weights h2 {
		font-size: 1rem;
		text-transform: capitalize;
		border-bottom: 1px solid var(--border);
		padding-bottom: 4px;
		margin: 0 0 8px;
	}
	.none {
		color: var(--muted);
		font-style: italic;
		margin: 0;
	}
	.entry {
		break-inside: avoid;
		margin: 8px 0;
	}
	.head {
		display: flex;
		gap: 8px;
		align-items: baseline;
	}
	.head .time {
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}
	.head .type {
		font-weight: 600;
		font-size: 0.85rem;
	}
	.note {
		margin: 2px 0 0;
		font-style: italic;
		color: var(--muted);
		font-size: 0.9rem;
	}
	.photos {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 6px;
	}
	.photos img {
		width: 76px;
		height: 76px;
		object-fit: cover;
		border-radius: 4px;
	}

	@media print {
		.no-print {
			display: none;
		}
		.report {
			border: none;
			border-radius: 0;
			padding: 0;
		}
		:global(.app) {
			max-width: none;
			padding: 0;
		}
	}
</style>
