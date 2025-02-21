<script lang="ts">
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/mempool');
		console.log('wa');
	});
</script>

<div class="p-2">
	<div class="mt-12 mb-2 ps-2 md:mt-17">
		<h1>Welcome!</h1>
	</div>
</div>
