<script lang="ts">
	import type { PageData } from './$types';
	import SleepForm from '$lib/components/SleepForm.svelte';

	let { data }: { data: PageData } = $props();
</script>

<header><a class="btn" href="/dodo">← Dodo</a></header>
<h1>Nouveau dodo</h1>
<SleepForm autostartVoice={data.autostartVoice} />

<style>
	header {
		padding-top: 12px;
	}
	header .btn {
		text-decoration: none;
	}
</style>
