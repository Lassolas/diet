<script lang="ts">
	import type { PageData } from './$types';
	import { formatTime, formatDay } from '$lib/time';
	import { WORKOUT_TYPE_LABEL, formatDuration } from '$lib/ui';

	let { data }: { data: PageData } = $props();
</script>

<header>
	<a class="btn" href="/">← Journal</a>
	<h1>Sport</h1>
</header>

{#if data.loadError}
	<p class="error">{data.loadError}</p>
{:else if data.workouts.length === 0}
	<p class="empty">Aucune séance. Touche « + » pour en ajouter une.</p>
{:else}
	<ul>
		{#each data.workouts as w (w.id)}
			<li>
				<a href="/sport/{w.id}">
					<div class="top">
						<span class="type">{WORKOUT_TYPE_LABEL[w.workoutType]}</span>
						<span class="when">{formatDay(w.startedAt.slice(0, 10))} · {formatTime(w.startedAt)}</span>
					</div>
					<p class="desc">{w.description}</p>
					<span class="meta">{formatDuration(w.durationMin)} · intensité {w.intensity}/10</span>
					{#if w.feeling}<p class="feeling">{w.feeling}</p>{/if}
				</a>
			</li>
		{/each}
	</ul>
{/if}

<a class="fab" href="/sport/add" aria-label="Ajouter une séance">+</a>

<style>
	header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-top: 12px;
	}
	header .btn {
		text-decoration: none;
	}
	.empty {
		color: var(--muted);
		margin-top: 40px;
		text-align: center;
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
	.top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
	}
	.type {
		font-weight: 600;
	}
	.when {
		font-size: 0.85rem;
		color: var(--muted);
		text-transform: capitalize;
	}
	.desc {
		margin: 6px 0 0;
	}
	.meta {
		display: inline-block;
		margin-top: 6px;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.feeling {
		margin: 4px 0 0;
		font-size: 0.9rem;
		color: var(--muted);
		font-style: italic;
	}
	.fab {
		position: fixed;
		right: max(16px, calc(50vw - 320px + 16px));
		bottom: 24px;
		width: 56px;
		height: 56px;
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-text);
		font-size: 2rem;
		line-height: 56px;
		text-align: center;
		text-decoration: none;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	}
</style>
