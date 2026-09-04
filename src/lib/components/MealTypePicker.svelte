<script lang="ts">
	import { MEAL_TYPES, type MealType } from '$lib/types';
	import { MEAL_TYPE_LABEL } from '$lib/ui';

	let { value = $bindable() }: { value: MealType } = $props();
</script>

<div class="picker">
	{#each MEAL_TYPES as mt (mt)}
		<button
			type="button"
			class:active={value === mt}
			onclick={() => (value = mt)}
			aria-pressed={value === mt}
		>
			{MEAL_TYPE_LABEL[mt]}
		</button>
	{/each}
</div>

<style>
	.picker {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
	}
	button {
		padding: 10px 4px;
		font-size: 0.85rem;
	}
	button.active {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-text);
	}
</style>
