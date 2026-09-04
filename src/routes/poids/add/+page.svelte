<script lang="ts">
	import type { PageData } from './$types';
	import WeighInForm from '$lib/components/WeighInForm.svelte';

	let { data }: { data: PageData } = $props();
</script>

<header><a class="btn" href="/poids">← Poids</a></header>
<h1>Nouvelle pesée</h1>
<WeighInForm lastWeightKg={data.lastWeightKg} />

<style>
	header {
		padding-top: 12px;
	}
	header .btn {
		text-decoration: none;
	}
</style>
