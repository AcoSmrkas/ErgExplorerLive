<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { initSocket } from '$lib/socket/socket';
	import { fetchAddressBook } from '$lib/common/utils';
	import { loadContractTemplates } from '$lib/common/contracts';
	import { loadPrices } from '$lib/common/prices';
	import Header from '$lib/components/Header.svelte';
	import ChainBar from '$lib/components/ChainBar.svelte';

	let { children } = $props();

	onMount(() => {
		initSocket();
		fetchAddressBook();
		loadContractTemplates();
		loadPrices();
	});
</script>

<Header />

{@render children()}

<ChainBar />
