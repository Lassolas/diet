<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { buildTimeline, type TimelineItem } from '$lib/domain/reportTimeline';
	import { formatTime, formatDay } from '$lib/time';
	import {
		MEAL_TYPE_LABEL,
		MEAL_TYPE_EMOJI,
		MEAL_TINT,
		conditionSummary,
		WORKOUT_TYPE_LABEL,
		WORKOUT_TYPE_EMOJI,
		WORKOUT_TINT,
		WEIGH_IN_TINT,
		formatDuration
	} from '$lib/ui';

	let { data }: { data: PageData } = $props();

	// Chronological, like a chat log: oldest at the top, today at the bottom.
	// Scroll up to go back in time.
	const days = $derived(
		buildTimeline(data.entries, data.weighIns, data.workouts, { order: 'asc' })
	);

	const itemId = (i: TimelineItem) =>
		i.kind === 'meal' ? i.entry.id : i.kind === 'weighIn' ? i.weighIn.id : i.workout.id;

	const kg = (n: number) => `${n.toFixed(1).replace('.', ',')} kg`;

	// Land on the latest entry. Runs on every mount (including coming back from
	// an entry page), which matches the "return to now" mental model. Repeated
	// to catch layout that settles late (photos loading).
	onMount(() => {
		const toBottom = () => window.scrollTo(0, document.documentElement.scrollHeight);
		toBottom();
		requestAnimationFrame(toBottom);
		setTimeout(toBottom, 150);
	});
</script>

<header>
	<h1>Journal</h1>
	<nav>
		<a class="btn" href="/sport">Sport</a>
		<a class="btn" href="/poids">Poids</a>
		<a class="btn" href="/report">Rapport</a>
	</nav>
</header>

{#if data.loadError}
	<p class="error">{data.loadError}</p>
{:else if days.length === 0}
	<p class="empty">Rien d'enregistré. Touche « + » ou 🍽️ pour commencer.</p>
{:else}
	{#each days as day (day.date)}
		<section>
			<h2>{formatDay(day.date)}</h2>
			<ul>
				{#each day.items as item (item.kind + item.at + itemId(item))}
					<li>
						{#if item.kind === 'weighIn'}
							<a href="/poids/{item.weighIn.id}" class="item">
								<span class="tile" style="background:{WEIGH_IN_TINT}">⚖️</span>
								<div class="body">
									<div class="head">
										<span class="label">Poids</span>
										<span class="time">{formatTime(item.at)}</span>
									</div>
									<p class="text">{kg(item.weighIn.weightKg)} · {conditionSummary(item.weighIn)}</p>
								</div>
							</a>
						{:else if item.kind === 'workout'}
							<a href="/sport/{item.workout.id}" class="item">
								<span class="tile" style="background:{WORKOUT_TINT}"
									>{WORKOUT_TYPE_EMOJI[item.workout.workoutType]}</span
								>
								<div class="body">
									<div class="head">
										<span class="label">{WORKOUT_TYPE_LABEL[item.workout.workoutType]}</span>
										<span class="time">{formatTime(item.at)}</span>
									</div>
									<p class="text">{item.workout.description}</p>
									<p class="sub">
										{formatDuration(item.workout.durationMin)} · intensité {item.workout
											.intensity}/10{item.workout.feeling ? ` · ${item.workout.feeling}` : ''}
									</p>
								</div>
							</a>
						{:else}
							<a href="/entry/{item.entry.id}" class="item">
								<span class="tile" style="background:{MEAL_TINT}"
									>{MEAL_TYPE_EMOJI[item.entry.mealType]}</span
								>
								<div class="body">
									<div class="head">
										<span class="label">{MEAL_TYPE_LABEL[item.entry.mealType]}</span>
										<span class="time">{formatTime(item.at)}</span>
									</div>
									{#if item.entry.description}<p class="text">{item.entry.description}</p>{/if}
									{#if item.entry.note}<p class="sub">{item.entry.note}</p>{/if}
									{#if item.entry.photos.length}
										<div class="thumbs">
											{#each item.entry.photos as photo (photo.id)}
												<img src={photo.url} alt="" />
											{/each}
										</div>
									{/if}
								</div>
							</a>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/each}
	<div class="tail" aria-hidden="true"></div>
{/if}

<div class="fabs">
	<a class="fab mini" href="/poids/add" title="Nouvelle pesée" aria-label="Nouvelle pesée">⚖️</a>
	<a
		class="fab mini voice"
		href="/sport/add?voice=1"
		title="Sport à la voix"
		aria-label="Sport à la voix"
	>
		<span class="ripple"></span>
		<span class="ripple delay"></span>
		🥊
	</a>
	<a
		class="fab mini voice"
		href="/add?type=collation&voice=1"
		title="Collation à la voix"
		aria-label="Collation à la voix"
	>
		<span class="ripple"></span>
		<span class="ripple delay"></span>
		🍌
	</a>
	<a class="fab mini voice" href="/add?voice=1" title="Repas à la voix" aria-label="Repas à la voix">
		<span class="ripple"></span>
		<span class="ripple delay"></span>
		🍽️
	</a>
	<a class="fab add" href="/add" aria-label="Ajouter un repas">+</a>
</div>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin: 0 -16px;
		padding: 10px 16px;
		background: rgba(247, 246, 243, 0.82);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--border);
	}
	header h1 {
		margin: 0;
		font-size: 1.15rem;
	}
	header nav {
		display: flex;
		gap: 6px;
	}
	header .btn {
		text-decoration: none;
		padding: 6px 11px;
		font-size: 0.85rem;
		border-radius: 999px;
	}
	.empty {
		color: var(--muted);
		margin-top: 40px;
		text-align: center;
	}
	/* Clearance so the newest rows sit above the floating action buttons when
	   the page lands scrolled to the bottom. */
	.tail {
		height: 180px;
	}

	section {
		display: flex;
		flex-direction: column;
	}
	h2 {
		align-self: center;
		width: fit-content;
		margin: 22px 0 12px;
		padding: 3px 12px;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: lowercase;
		color: var(--muted);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 999px;
	}
	h2::first-letter {
		text-transform: uppercase;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.item {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 12px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 12px 14px;
		text-decoration: none;
		color: var(--text);
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.03),
			0 2px 10px rgba(0, 0, 0, 0.03);
	}
	.tile {
		width: 34px;
		height: 34px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.05rem;
		line-height: 1;
		font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
		align-self: start;
	}
	.body {
		min-width: 0;
	}
	.head {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}
	.label {
		font-weight: 600;
		font-size: 0.92rem;
	}
	.time {
		margin-left: auto;
		flex-shrink: 0;
		font-size: 0.75rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.text {
		margin: 3px 0 0;
		font-size: 0.95rem;
	}
	.sub {
		margin: 3px 0 0;
		font-size: 0.83rem;
		color: var(--muted);
	}
	.thumbs {
		display: flex;
		gap: 6px;
		margin-top: 8px;
	}
	.thumbs img {
		width: 54px;
		height: 54px;
		object-fit: cover;
		border-radius: 8px;
	}

	.fabs {
		position: fixed;
		right: max(16px, calc(50vw - 320px + 16px));
		bottom: 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}
	.fab {
		border-radius: 999px;
		text-decoration: none;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.fab.add {
		width: 60px;
		height: 60px;
		background: var(--accent);
		color: var(--accent-text);
		font-size: 2rem;
	}
	.fab.mini {
		width: 46px;
		height: 46px;
		background: var(--surface);
		border: 1px solid var(--border);
		font-size: 1.3rem;
	}
	.fab.voice {
		position: relative;
	}
	.fab.voice .ripple {
		position: absolute;
		inset: 0;
		border-radius: 999px;
		border: 2px solid var(--accent);
		pointer-events: none;
		opacity: 0; /* reduced-motion fallback: no static ring */
	}
	@media (prefers-reduced-motion: no-preference) {
		.fab.voice .ripple {
			animation: ripple 2.4s ease-out infinite;
		}
		.fab.voice .ripple.delay {
			animation-delay: 1.2s;
		}
	}
	@keyframes ripple {
		0% {
			transform: scale(1);
			opacity: 0.55;
		}
		100% {
			transform: scale(1.6);
			opacity: 0;
		}
	}
</style>
