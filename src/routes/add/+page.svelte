<script lang="ts">
	import EntryForm from '$lib/components/EntryForm.svelte';
</script>

<header><a class="btn" href="/">← Journal</a></header>
<h1>Nouveau repas</h1>
<EntryForm />

<style>
	header {
		padding-top: 12px;
	}
	header .btn {
		text-decoration: none;
	}
</style>
