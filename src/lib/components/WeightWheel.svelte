<script lang="ts">
	import { untrack } from 'svelte';

	let {
		value = $bindable(),
		min = 20,
		max = 400,
		step = 0.1,
		span = 30
	}: {
		value: number;
		min?: number;
		max?: number;
		step?: number;
		/** kg above and below the starting value that the wheel covers. */
		span?: number;
	} = $props();

	const ITEM = 40; // px per row; keep in sync with CSS
	const round1 = (n: number) => Math.round(n * 10) / 10;

	function buildValues(centre: number): number[] {
		const lo = Math.max(min, round1(centre - span));
		const hi = Math.min(max, round1(centre + span));
		const out: number[] = [];
		for (let v = lo; v <= hi + 1e-9; v += step) out.push(round1(v));
		return out;
	}

	let values = $state(untrack(() => buildValues(value ?? 70)));
	let track = $state<HTMLDivElement>();

	const indexOf = (v: number) => {
		let best = 0;
		let bestD = Infinity;
		for (let i = 0; i < values.length; i++) {
			const d = Math.abs(values[i] - v);
			if (d < bestD) (bestD = d), (best = i);
		}
		return best;
	};

	/** value last pushed out by a user scroll — lets the sync effect ignore it.
	 *  Starts as NaN so the first effect run does the initial positioning. */
	let fromScroll = NaN;
	let programmatic = false;

	function scrollToValue(v: number, smooth: boolean) {
		if (!track) return;
		programmatic = true;
		track.scrollTo({ top: indexOf(v) * ITEM, behavior: smooth ? 'smooth' : 'auto' });
		setTimeout(() => (programmatic = false), smooth ? 320 : 60);
	}

	// Initial position + react to value changes that come from outside (the ±
	// buttons, the paired input in the form).
	$effect(() => {
		const v = value;
		if (v === fromScroll) return;
		untrack(() => {
			if (v < values[0] || v > values[values.length - 1]) values = buildValues(v);
			scrollToValue(v, false);
		});
	});

	let timer: ReturnType<typeof setTimeout>;
	function onScroll() {
		if (programmatic || !track) return;
		clearTimeout(timer);
		timer = setTimeout(() => {
			if (!track) return;
			const idx = Math.max(0, Math.min(values.length - 1, Math.round(track.scrollTop / ITEM)));
			fromScroll = values[idx];
			if (values[idx] !== value) value = values[idx];
			scrollToValue(values[idx], true); // settle exactly on the row
		}, 90);
	}

	function nudge(steps: number) {
		const next = round1(Math.min(max, Math.max(min, value + steps * step)));
		if (next === value) return;
		value = next;
	}

	function onKey(e: KeyboardEvent) {
		const map: Record<string, number> = { ArrowUp: 1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
		if (e.key in map) (e.preventDefault(), nudge(map[e.key]));
	}
</script>

<div class="wheel">
	<button type="button" class="step" onclick={() => nudge(-1)} aria-label="Moins 0,1 kg">−</button>

	<div
		class="track"
		bind:this={track}
		onscroll={onScroll}
		onkeydown={onKey}
		role="spinbutton"
		tabindex="0"
		aria-valuenow={value}
		aria-valuemin={min}
		aria-valuemax={max}
		aria-label="Poids en kilogrammes"
	>
		<div class="pad"></div>
		{#each values as v (v)}
			<div class="row" class:sel={v === value}>{v.toFixed(1)}</div>
		{/each}
		<div class="pad"></div>
	</div>
	<div class="band" aria-hidden="true"></div>

	<button type="button" class="step" onclick={() => nudge(1)} aria-label="Plus 0,1 kg">+</button>
</div>

<style>
	.wheel {
		display: grid;
		grid-template-columns: 48px 1fr 48px;
		align-items: center;
		gap: 8px;
		position: relative;
	}
	.step {
		height: 48px;
		font-size: 1.5rem;
		line-height: 1;
		padding: 0;
	}
	.track {
		height: 200px; /* 5 rows */
		overflow-y: scroll;
		scroll-snap-type: y mandatory;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
		text-align: center;
		position: relative;
	}
	.track::-webkit-scrollbar {
		display: none;
	}
	.pad {
		height: 80px; /* 2 rows */
	}
	.row {
		height: 40px;
		line-height: 40px;
		scroll-snap-align: center;
		font-variant-numeric: tabular-nums;
		color: var(--muted);
		font-size: 1.05rem;
	}
	.row.sel {
		color: var(--text);
		font-weight: 700;
		font-size: 1.35rem;
	}
	.band {
		position: absolute;
		left: 48px;
		right: 48px;
		top: 80px;
		height: 40px;
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
		pointer-events: none;
	}
</style>
