<script lang="ts">
	import WeighInForm from '$lib/components/WeighInForm.svelte';
</script>

<header><a class="btn" href="/poids">← Poids</a></header>
<h1>Nouvelle pesée</h1>
<WeighInForm />

<style>
	header {
		padding-top: 12px;
	}
	header .btn {
		text-decoration: none;
	}
</style>
