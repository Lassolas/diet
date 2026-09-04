<script lang="ts">
	import type { PageData } from './$types';
	import { formatTime, formatDay } from '$lib/time';
	import { MEAL_TYPE_LABEL } from '$lib/ui';
	import type { MealEntry } from '$lib/types';

	let { data }: { data: PageData } = $props();

	const days = $derived.by(() => {
		const groups: { date: string; entries: MealEntry[] }[] = [];
		for (const entry of data.entries) {
			const date = entry.eatenAt.slice(0, 10);
			const last = groups.at(-1);
			if (last?.date === date) last.entries.push(entry);
			else groups.push({ date, entries: [entry] });
		}
		return groups;
	});
</script>

<header>
	<h1>Journal</h1>
	<nav>
		<a class="btn" href="/poids">Poids</a>
		<a class="btn" href="/report">Rapport</a>
	</nav>
</header>

{#if data.loadError}
	<p class="error">{data.loadError}</p>
{:else if data.entries.length === 0}
	<p class="empty">Aucun repas enregistré. Touche « + » pour commencer.</p>
{:else}
	{#each days as day (day.date)}
		<section>
			<h2>{formatDay(day.date)}</h2>
			<ul>
				{#each day.entries as entry (entry.id)}
					<li>
						<a href="/entry/{entry.id}">
							<div class="row">
								<span class="time">{formatTime(entry.eatenAt)}</span>
								<span class="type">{MEAL_TYPE_LABEL[entry.mealType]}</span>
							</div>
							{#if entry.description}<p class="desc">{entry.description}</p>{/if}
							{#if entry.note}<p class="note">{entry.note}</p>{/if}
							{#if entry.photos.length}
								<div class="thumbs">
									{#each entry.photos as photo (photo.id)}
										<img src={photo.url} alt="" />
									{/each}
								</div>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
{/if}

<a class="fab" href="/add" aria-label="Ajouter un repas">+</a>

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
