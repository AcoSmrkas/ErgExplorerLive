<script lang="ts">
	import { page } from '$app/state';
	import BlockView from '$lib/components/BlockView.svelte';

	let height = $derived(Number(page.params.height));
</script>

<BlockView {height} />
