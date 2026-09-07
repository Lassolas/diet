<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { buildTimeline, type TimelineItem } from '$lib/domain/reportTimeline';
	import { formatTime, formatDay } from '$lib/time';
	import {
		MEAL_TYPE_LABEL,
		MEAL_TYPE_EMOJI,
		mealAccent,
		conditionSummary,
		WORKOUT_TYPE_LABEL,
		WORKOUT_TYPE_EMOJI,
		WORKOUT_ACCENT,
		WEIGH_IN_ACCENT,
		formatDuration
	} from '$lib/ui';

	let { data }: { data: PageData } = $props();

	// Seed the date inputs from the loaded range once; navigation reloads the page.
	const range = untrack(() => ({ from: data.from, to: data.to }));
	let from = $state(range.from);
	let to = $state(range.to);
	let withPhotos = $state(true);

	// Which themes go into the report. All on by default; toggled client-side,
	// no re-fetch. `withPhotos` only bites when meals are included.
	let withMeals = $state(true);
	let withWorkouts = $state(true);
	let withWeighIns = $state(true);

	const days = $derived(
		buildTimeline(
			withMeals ? data.entries : [],
			withWeighIns ? data.weighIns : [],
			withWorkouts ? data.workouts : [],
			{ from: data.from, to: data.to }
		)
	);

	const includedThemes = $derived(
		[withMeals && 'repas', withWorkouts && 'sport', withWeighIns && 'poids'].filter(
			(t): t is string => Boolean(t)
		)
	);

	const itemId = (i: TimelineItem) =>
		i.kind === 'meal' ? i.entry.id : i.kind === 'weighIn' ? i.weighIn.id : i.workout.id;
	const lineAccent = (i: TimelineItem) =>
		i.kind === 'weighIn'
			? WEIGH_IN_ACCENT
			: i.kind === 'workout'
				? WORKOUT_ACCENT
				: mealAccent(i.entry.mealType);
	const generatedAt = new Intl.DateTimeFormat('fr-FR', {
		dateStyle: 'long',
		timeStyle: 'short'
	}).format(new Date());

	const kg = (n: number) => `${n.toFixed(1).replace('.', ',')} kg`;

	function apply() {
		goto(`/report?from=${from}&to=${to}`, { invalidateAll: true });
	}
</script>

<div class="controls no-print">
	<a class="btn" href="/">← Journal</a>
	<label>Du <input type="date" bind:value={from} max={to} /></label>
	<label>Au <input type="date" bind:value={to} min={from} /></label>
	<span class="group">
		<label class="cb"><input type="checkbox" bind:checked={withMeals} /> Repas</label>
		<label class="cb"><input type="checkbox" bind:checked={withWorkouts} /> Sport</label>
		<label class="cb"><input type="checkbox" bind:checked={withWeighIns} /> Poids</label>
		<label class="cb">
			<input type="checkbox" bind:checked={withPhotos} disabled={!withMeals} /> Photos
		</label>
	</span>
	<button onclick={apply}>Appliquer</button>
	<button class="primary" onclick={() => window.print()}>Imprimer / PDF</button>
</div>

<article class="report" class:hide-photos={!withPhotos}>
	<h1>{withMeals ? 'Journal alimentaire' : 'Journal'}</h1>
	<p class="meta">
		Du {formatDay(data.from)} au {formatDay(data.to)} · généré le {generatedAt}{#if includedThemes.length < 3}
			· {includedThemes.join(', ') || 'aucun thème sélectionné'}{/if}
	</p>

	{#each days as day (day.date)}
		<section class="day">
			<h2>{formatDay(day.date)}</h2>
			{#if day.items.length === 0}
				<p class="none">Rien enregistré</p>
			{:else}
				{#each day.items as item (item.kind + item.at + itemId(item))}
					<div class="line" style="border-left-color:{lineAccent(item)}">
						<span class="time">{formatTime(item.at)}</span>
						{#if item.kind === 'weighIn'}
							<span class="emo">⚖️</span>
							<div class="content">
								<span class="label">Poids</span><span class="text"
									>{kg(item.weighIn.weightKg)} · {conditionSummary(item.weighIn)}</span
								>
							</div>
						{:else if item.kind === 'workout'}
							<span class="emo">{WORKOUT_TYPE_EMOJI[item.workout.workoutType]}</span>
							<div class="content">
								<span class="label">{WORKOUT_TYPE_LABEL[item.workout.workoutType]}</span><span
									class="text">{item.workout.description}</span
								>
								<p class="note">
									{formatDuration(item.workout.durationMin)} · intensité {item.workout
										.intensity}/10{item.workout.feeling ? ` · ${item.workout.feeling}` : ''}
								</p>
							</div>
						{:else}
							<span class="emo">{MEAL_TYPE_EMOJI[item.entry.mealType]}</span>
							<div class="content">
								<span class="label">{MEAL_TYPE_LABEL[item.entry.mealType]}</span>{#if item.entry.description}<span
										class="text">{item.entry.description}</span
									>{/if}
								{#if item.entry.note}<p class="note">{item.entry.note}</p>{/if}
								{#if withPhotos && item.entry.photos.length}
									<div class="photos">
										{#each item.entry.photos as photo (photo.id)}<img src={photo.url} alt="" />{/each}
									</div>
								{/if}
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
	.controls .group {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 12px;
		padding: 4px 10px;
		border: 1px solid var(--border);
		border-radius: 10px;
	}
	.controls .cb {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.controls .cb input {
		width: auto;
	}
	.controls .cb input:disabled {
		opacity: 0.4;
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
		margin: 4px 0 24px;
	}
	.day {
		break-inside: avoid;
		margin-bottom: 16px;
	}
	.day h2 {
		font-size: 0.9rem;
		font-weight: 700;
		text-transform: capitalize;
		color: var(--text);
		margin: 0 0 2px;
		padding-bottom: 3px;
		border-bottom: 1px solid var(--border);
	}
	.none {
		color: var(--muted);
		font-style: italic;
		margin: 3px 0;
		font-size: 0.85rem;
	}
	/* Days with nothing logged recede — the heading shouldn't shout at a gap. */
	.day:has(.none) h2 {
		color: var(--muted);
		font-weight: 600;
		border-bottom-color: transparent;
	}

	.line {
		display: grid;
		grid-template-columns: 3rem 1.4rem 1fr;
		column-gap: 0.5rem;
		align-items: baseline;
		padding: 5px 0 5px 8px;
		border-top: 1px solid var(--border);
		border-left: 3px solid;
		break-inside: avoid;
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}
	.line:first-of-type {
		border-top: none;
	}
	.time {
		font-variant-numeric: tabular-nums;
		color: var(--muted);
		font-size: 0.85rem;
	}
	.emo {
		font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
		font-size: 0.9rem;
		text-align: center;
		line-height: 1;
	}
	.content {
		min-width: 0;
	}
	.label {
		font-weight: 700;
		font-size: 0.85rem;
	}
	.text::before {
		content: '—';
		margin: 0 0.45em;
		color: var(--muted);
		font-weight: 400;
	}
	.note {
		margin: 1px 0 0;
		font-style: italic;
		color: var(--muted);
		font-size: 0.85rem;
	}
	.photos {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 6px;
	}
	.photos img {
		width: 70px;
		height: 70px;
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
		.line {
			border-top-color: #bbb;
		}
		.day h2 {
			border-color: #bbb;
		}
		:global(.app) {
			max-width: none;
			padding: 0;
		}
	}
</style>
