<script lang="ts">
	import type { PageData } from './$types';
	import { buildTimeline, type TimelineItem } from '$lib/domain/reportTimeline';
	import { formatTime, formatDay } from '$lib/time';
	import { MEAL_TYPE_LABEL, conditionSummary, WORKOUT_TYPE_LABEL, formatDuration } from '$lib/ui';

	let { data }: { data: PageData } = $props();

	// Newest day first, and within a day, newest first.
	const days = $derived(
		buildTimeline(data.entries, data.weighIns, data.workouts, { order: 'desc' })
	);

	const itemId = (i: TimelineItem) =>
		i.kind === 'meal' ? i.entry.id : i.kind === 'weighIn' ? i.weighIn.id : i.workout.id;
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
					{#if item.kind === 'weighIn'}
						<li>
							<a href="/poids/{item.weighIn.id}" class="weigh">
								<div class="row">
									<span class="time">{formatTime(item.at)}</span>
									<span class="type">Poids</span>
								</div>
								<p class="desc">
									{item.weighIn.weightKg.toFixed(1)} kg · {conditionSummary(item.weighIn)}
								</p>
							</a>
						</li>
					{:else if item.kind === 'workout'}
						<li>
							<a href="/sport/{item.workout.id}" class="workout">
								<div class="row">
									<span class="time">{formatTime(item.at)}</span>
									<span class="type">{WORKOUT_TYPE_LABEL[item.workout.workoutType]}</span>
								</div>
								<p class="desc">{item.workout.description}</p>
								<p class="note">
									{formatDuration(item.workout.durationMin)} · intensité {item.workout.intensity}/10{#if item.workout.feeling}
										· {item.workout.feeling}{/if}
								</p>
							</a>
						</li>
					{:else}
						<li>
							<a href="/entry/{item.entry.id}">
								<div class="row">
									<span class="time">{formatTime(item.at)}</span>
									<span class="type">{MEAL_TYPE_LABEL[item.entry.mealType]}</span>
								</div>
								{#if item.entry.description}<p class="desc">{item.entry.description}</p>{/if}
								{#if item.entry.note}<p class="note">{item.entry.note}</p>{/if}
								{#if item.entry.photos.length}
									<div class="thumbs">
										{#each item.entry.photos as photo (photo.id)}
											<img src={photo.url} alt="" />
										{/each}
									</div>
								{/if}
							</a>
						</li>
					{/if}
				{/each}
			</ul>
		</section>
	{/each}
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
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 12px;
	}
	header nav {
		display: flex;
		gap: 8px;
	}
	header .btn {
		text-decoration: none;
	}
	.empty {
		color: var(--muted);
		margin-top: 40px;
		text-align: center;
	}
	h2 {
		font-size: 0.95rem;
		color: var(--muted);
		text-transform: capitalize;
		margin: 24px 0 8px;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	li a {
		display: block;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 12px;
		text-decoration: none;
		color: var(--text);
	}
	li a.weigh {
		border-left: 3px solid var(--accent);
	}
	li a.workout {
		border-left: 3px solid #c9803a;
	}
	.row {
		display: flex;
		gap: 10px;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.time {
		font-variant-numeric: tabular-nums;
	}
	.desc {
		margin: 4px 0 0;
	}
	.note {
		margin: 4px 0 0;
		font-size: 0.9rem;
		color: var(--muted);
		font-style: italic;
	}
	.thumbs {
		display: flex;
		gap: 6px;
		margin-top: 8px;
	}
	.thumbs img {
		width: 56px;
		height: 56px;
		object-fit: cover;
		border-radius: 6px;
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
