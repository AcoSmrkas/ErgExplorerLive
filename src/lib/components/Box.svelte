<script lang="ts">
	import ErgExplorerLink from '$lib/components/ErgExplorerLink.svelte';
	import { onMount } from 'svelte';

	let { box } = $props();

	onMount(() => {});
</script>

<p>ID: <ErgExplorerLink type={'boxes'} value={box.boxId} /></p>
<p>Address: <ErgExplorerLink type={'addresses'} value={box.address} trunc={30} /></p>
