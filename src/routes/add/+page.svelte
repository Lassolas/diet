<script lang="ts">
	import type { PageData } from './$types';
	import EntryForm from '$lib/components/EntryForm.svelte';

	let { data }: { data: PageData } = $props();
</script>

<header><a class="btn" href="/">← Journal</a></header>
<h1>Nouveau repas</h1>
<EntryForm initialMealType={data.initialMealType} />

<style>
	header {
		padding-top: 12px;
	}
	header .btn {
		text-decoration: none;
	}
</style>
