<script lang="ts">
	import { onMount } from 'svelte';
	import { nodeInfo, mempoolTxCount, lastBlockInfo } from '$lib/store/store';
	import { nFormatter, formatTimeDifference } from '$lib/common/utils';
	import { fade } from 'svelte/transition';
	import TransactionsGrid from '$lib/components/TransactionsGrid.svelte';

	let blockHeight: number = $state(0);
	let timeSinceLastBlock: string = $state('');

	onMount(() => {
		const nodeInfoUnsubscribe = nodeInfo.subscribe((value: any) => {
			if (!value) return;

			blockHeight = value.fullHeight;
		});

		setInterval(() => {
			timeSinceLastBlock = formatTimeDifference($lastBlockInfo?.timestamp);
		}, 30);

		return () => {
			if (nodeInfoUnsubscribe) {
				nodeInfoUnsubscribe();
			}
		};
	});
</script>

<div class="p-2">
	<div in:fade|local={{ duration: 150, delay: 300 }} class="mt-12 mb-2 ps-2 md:mt-17">
		<p>Block height: {nFormatter(blockHeight, 0, false)}</p>
		{#if timeSinceLastBlock !== ''}
			<p in:fade={{ duration: 150 }}>Time since last block: {timeSinceLastBlock}</p>
		{/if}
		<p>Transactions in mempool: {nFormatter($mempoolTxCount, 0, false)}</p>
	</div>

	<TransactionsGrid />
</div>
