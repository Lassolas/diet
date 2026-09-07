<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { buildTimeline, type TimelineItem } from '$lib/domain/reportTimeline';
	import { formatTime, formatDay } from '$lib/time';
	import { MEAL_TYPE_LABEL, conditionSummary, WORKOUT_TYPE_LABEL, formatDuration } from '$lib/ui';

	let { data }: { data: PageData } = $props();

	// Seed the date inputs from the loaded range once; navigation reloads the page.
	const range = untrack(() => ({ from: data.from, to: data.to }));
	let from = $state(range.from);
	let to = $state(range.to);
	let withPhotos = $state(true);

	const days = $derived(
		buildTimeline(data.entries, data.weighIns, data.workouts, { from: data.from, to: data.to })
	);

	const itemId = (i: TimelineItem) =>
		i.kind === 'meal' ? i.entry.id : i.kind === 'weighIn' ? i.weighIn.id : i.workout.id;
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

	{#each days as day (day.date)}
		<section class="day">
			<h2>{formatDay(day.date)}</h2>
			{#if day.items.length === 0}
				<p class="none">Rien enregistré</p>
			{:else}
				{#each day.items as item (item.kind + item.at + itemId(item))}
					{#if item.kind === 'weighIn'}
						<div class="line weigh">
							<span class="time">{formatTime(item.at)}</span>
							<span class="tag">Poids</span>
							<span class="body"
								>{item.weighIn.weightKg.toFixed(1)} kg · {conditionSummary(item.weighIn)}</span
							>
						</div>
					{:else if item.kind === 'workout'}
						<div class="line">
							<div class="head">
								<span class="time">{formatTime(item.at)}</span>
								<span class="tag">{WORKOUT_TYPE_LABEL[item.workout.workoutType]}</span>
								<span class="body">{item.workout.description}</span>
							</div>
							<p class="note">
								{formatDuration(item.workout.durationMin)} · intensité {item.workout.intensity}/10{#if item.workout.feeling}
									· {item.workout.feeling}{/if}
							</p>
						</div>
					{:else}
						<div class="line">
							<div class="head">
								<span class="time">{formatTime(item.at)}</span>
								<span class="tag">{MEAL_TYPE_LABEL[item.entry.mealType]}</span>
								<span class="body">{item.entry.description ?? ''}</span>
							</div>
							{#if item.entry.note}<p class="note">{item.entry.note}</p>{/if}
							{#if withPhotos && item.entry.photos.length}
								<div class="photos">
									{#each item.entry.photos as photo (photo.id)}<img src={photo.url} alt="" />{/each}
								</div>
							{/if}
						</div>
					{/if}
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
	.day {
		break-inside: avoid;
		margin-bottom: 18px;
	}
	.day h2 {
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
	.line {
		break-inside: avoid;
		margin: 8px 0;
	}
	.head {
		display: flex;
		gap: 8px;
		align-items: baseline;
	}
	.line.weigh {
		display: flex;
		gap: 8px;
		align-items: baseline;
	}
	.time {
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}
	.tag {
		font-weight: 600;
		font-size: 0.85rem;
		min-width: 4.5rem;
	}
	.line.weigh .body {
		font-weight: 600;
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
