<script lang="ts">
	import { onMount } from 'svelte';
	import { nodeInfo, mempoolTxs } from '$lib/store/store';
	import { nFormatter } from '$lib/common/utils';
	import ChainNav from '$lib/components/ChainNav.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import TransactionsGrid from '$lib/components/TransactionsGrid.svelte';

	let blockHeight: number = $state(0);

	onMount(() => {
		const nodeInfoUnsubscribe = nodeInfo.subscribe(
			(value: any) => (blockHeight = value.fullHeight)
		);

		return () => {
			nodeInfoUnsubscribe();
		};
	});
</script>

<Navbar />

<div class="p-2">
	<div class="mt-12 mb-2 ps-2 md:mt-17">
		<p>Block height: {nFormatter(blockHeight, 0, false)}</p>
		<p>Transactions in mempool: {nFormatter($mempoolTxs.length, 0, false)}</p>
	</div>

	<TransactionsGrid />

	<ChainNav />
</div>
