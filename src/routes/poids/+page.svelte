<script lang="ts">
	import type { PageData } from './$types';
	import { formatTime, formatDay } from '$lib/time';
	import { conditionSummary } from '$lib/ui';

	let { data }: { data: PageData } = $props();

	const trendFirst = $derived(data.weighIns.at(-1)?.weightKg);
	const trendLast = $derived(data.weighIns.at(0)?.weightKg);
	const delta = $derived(
		trendFirst !== undefined && trendLast !== undefined ? trendLast - trendFirst : null
	);
</script>

<header>
	<a class="btn" href="/">← Journal</a>
	<h1>Poids</h1>
</header>

{#if data.loadError}
	<p class="error">{data.loadError}</p>
{:else if data.weighIns.length === 0}
	<p class="empty">Aucune pesée. Touche « + » pour en ajouter une.</p>
{:else}
	{#if delta !== null && data.weighIns.length > 1}
		<p class="delta">
			{delta > 0 ? '+' : ''}{delta.toFixed(1)} kg depuis la première pesée
		</p>
	{/if}
	<ul>
		{#each data.weighIns as w (w.id)}
			<li>
				<a href="/poids/{w.id}">
					<div class="top">
						<span class="kg">{w.weightKg.toFixed(1)} kg</span>
						<span class="when"
							>{formatDay(w.measuredAt.slice(0, 10))} · {formatTime(w.measuredAt)}</span
						>
					</div>
					<span class="cond">{conditionSummary(w)}</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<a class="fab" href="/poids/add" aria-label="Ajouter une pesée">+</a>

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
	.delta {
		color: var(--muted);
		font-size: 0.9rem;
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
		gap: 10px;
	}
	.kg {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.when {
		font-size: 0.85rem;
		color: var(--muted);
		text-transform: capitalize;
	}
	.cond {
		display: inline-block;
		margin-top: 6px;
		font-size: 0.8rem;
		color: var(--muted);
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
