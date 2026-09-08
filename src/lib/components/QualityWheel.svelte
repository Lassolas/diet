<script lang="ts">
	import { untrack } from 'svelte';
	import { sleepQualityEmoji, sleepQualityColor } from '$lib/ui';
	import { SLEEP_QUALITY_STEP } from '$lib/types';

	let { value = $bindable() }: { value: number } = $props();

	const STEP = SLEEP_QUALITY_STEP;
	const ITEM = 44; // px per row; keep in sync with CSS
	// Rendered top → bottom: 100 % (best) at the top, 0 % at the bottom —
	// scroll up for a better night.
	const values = Array.from({ length: 100 / STEP + 1 }, (_, i) => 100 - i * STEP);
	const domIndex = (v: number) => (100 - v) / STEP;
	const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v / STEP) * STEP));

	let track = $state<HTMLDivElement>();
	/** Value last emitted by a user scroll — lets the sync effect ignore it. */
	let fromScroll = NaN;
	let programmatic = false;

	function scrollToValue(v: number, smooth: boolean) {
		if (!track) return;
		programmatic = true;
		track.scrollTo({ top: domIndex(v) * ITEM, behavior: smooth ? 'smooth' : 'auto' });
		setTimeout(() => (programmatic = false), smooth ? 320 : 60);
	}

	// Initial position + react to value changes from outside (the ± buttons).
	$effect(() => {
		const v = value;
		if (v === fromScroll) return;
		untrack(() => scrollToValue(v, false));
	});

	let timer: ReturnType<typeof setTimeout>;
	function onScroll() {
		if (programmatic || !track) return;
		clearTimeout(timer);
		timer = setTimeout(() => {
			if (!track) return;
			const idx = Math.max(0, Math.min(values.length - 1, Math.round(track.scrollTop / ITEM)));
			const v = values[idx];
			fromScroll = v;
			if (v !== value) value = v;
			scrollToValue(v, true); // settle exactly on the row
		}, 90);
	}

	function nudge(dir: number) {
		const next = clamp(value + dir * STEP);
		if (next !== value) value = next;
	}
	function onKey(e: KeyboardEvent) {
		const map: Record<string, number> = { ArrowUp: 1, ArrowDown: -1, PageUp: 4, PageDown: -4 };
		if (e.key in map) {
			e.preventDefault();
			nudge(map[e.key]);
		}
	}
</script>

<div class="wheel" style="--q:{sleepQualityColor(value)}">
	<div class="rail" aria-hidden="true"></div>

	<div
		class="track"
		bind:this={track}
		onscroll={onScroll}
		onkeydown={onKey}
		role="spinbutton"
		tabindex="0"
		aria-valuenow={value}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuetext="{value} %"
		aria-label="Qualité du sommeil en pourcentage"
	>
		<div class="pad"></div>
		{#each values as v (v)}
			<div class="row" class:sel={v === value}>
				<span class="emo">{sleepQualityEmoji(v)}</span>
				<span class="pct">{v} %</span>
			</div>
		{/each}
		<div class="pad"></div>
	</div>
	<div class="band" aria-hidden="true"></div>

	<div class="steps">
		<button type="button" onclick={() => nudge(1)} aria-label="Meilleure qualité">+</button>
		<button type="button" onclick={() => nudge(-1)} aria-label="Moins bonne qualité">−</button>
	</div>
</div>

<style>
	.wheel {
		display: grid;
		grid-template-columns: 8px 1fr 40px;
		column-gap: 10px;
		align-items: center;
		position: relative;
	}
	.rail {
		align-self: stretch;
		height: 176px;
		border-radius: 4px;
		background: linear-gradient(
			to bottom,
			hsl(134 55% 47%),
			hsl(69 55% 47%),
			hsl(4 55% 47%)
		);
	}
	.track {
		height: 220px; /* 5 rows */
		overflow-y: scroll;
		scroll-snap-type: y mandatory;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
	}
	.track::-webkit-scrollbar {
		display: none;
	}
	.pad {
		height: 88px; /* 2 rows */
	}
	.row {
		height: 44px;
		display: flex;
		align-items: center;
		gap: 10px;
		scroll-snap-align: center;
		color: var(--muted);
	}
	.row .emo {
		font-size: 1.1rem;
		filter: grayscale(0.5);
		opacity: 0.6;
	}
	.row .pct {
		font-variant-numeric: tabular-nums;
		font-size: 1rem;
	}
	.row.sel {
		color: var(--text);
	}
	.row.sel .emo {
		font-size: 1.5rem;
		filter: none;
		opacity: 1;
	}
	.row.sel .pct {
		font-weight: 700;
		font-size: 1.3rem;
	}
	.band {
		position: absolute;
		left: 18px;
		right: 50px;
		top: 88px;
		height: 44px;
		border-top: 2px solid var(--q);
		border-bottom: 2px solid var(--q);
		background: color-mix(in srgb, var(--q) 14%, transparent);
		pointer-events: none;
	}
	.steps {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.steps button {
		height: 40px;
		font-size: 1.4rem;
		line-height: 1;
		padding: 0;
	}
</style>
