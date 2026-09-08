<script lang="ts">
	import type { PageData } from './$types';
	import { formatTime, formatDay } from '$lib/time';
	import { formatDuration, sleepQualityEmoji } from '$lib/ui';

	let { data }: { data: PageData } = $props();

	const durationMin = (s: { bedAt: string; wakeAt: string }) =>
		Math.round((Date.parse(s.wakeAt) - Date.parse(s.bedAt)) / 60000);
</script>

<header>
	<a class="btn" href="/">← Journal</a>
	<h1>Dodo</h1>
</header>

{#if data.loadError}
	<p class="error">{data.loadError}</p>
{:else if data.sleeps.length === 0}
	<p class="empty">Aucun dodo enregistré. Touche « + » pour commencer.</p>
{:else}
	<ul>
		{#each data.sleeps as s (s.id)}
			<li>
				<a href="/dodo/{s.id}">
					<div class="top">
						<span class="q">{sleepQualityEmoji(s.quality)} {s.quality} %</span>
						<span class="when">{formatDay(s.wakeAt.slice(0, 10))}</span>
					</div>
					<p class="times">
						{formatTime(s.bedAt)} → {formatTime(s.wakeAt)} · {formatDuration(durationMin(s))}
					</p>
					{#if s.note}<p class="note">{s.note}</p>{/if}
				</a>
			</li>
		{/each}
	</ul>
{/if}

<a class="fab" href="/dodo/add" aria-label="Ajouter un dodo">+</a>

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
		border-left: 3px solid #6d5aab;
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
	.q {
		font-weight: 600;
	}
	.when {
		font-size: 0.85rem;
		color: var(--muted);
		text-transform: capitalize;
	}
	.times {
		margin: 6px 0 0;
		font-variant-numeric: tabular-nums;
	}
	.note {
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
