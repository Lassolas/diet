<script lang="ts">
	import type { PageData } from './$types';
	import WorkoutForm from '$lib/components/WorkoutForm.svelte';

	let { data }: { data: PageData } = $props();
</script>

<header><a class="btn" href="/sport">← Sport</a></header>
<h1>Nouvelle séance</h1>
<WorkoutForm autostartVoice={data.autostartVoice} />

<style>
	header {
		padding-top: 12px;
	}
	header .btn {
		text-decoration: none;
	}
</style>
