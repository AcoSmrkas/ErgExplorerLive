<script lang="ts">
	import { onMount } from 'svelte';
	import { nodeInfo, mempoolTxs } from '$lib/store/store';
	import Transaction from '$lib/components/Transaction.svelte';
	import ChainNav from '$lib/components/ChainNav.svelte';
	import Navbar from '$lib/components/Navbar.svelte';

	let blockHeight: number = $state(0);
	let transactions = $state([]);

	onMount(() => {
		const nodeInfoUnsubscribe = nodeInfo.subscribe(
			(value: any) => (blockHeight = value.fullHeight)
		);
		const mempoolTxsUnsubscribe = mempoolTxs.subscribe((value: any) => (transactions = value));

		return () => {
			nodeInfoUnsubscribe();
			mempoolTxsUnsubscribe();
		};
	});
</script>

<Navbar />

<div class="p-2">
	<div class="mb-2 mt-19">
		<p>Block height: {blockHeight}</p>
		<p>Mempool transactions: {transactions.length}</p>
	</div>

	<div class="grid grid-cols-1 gap-3 lg:grid-cols-2 max-h-[605px] overflow-y-scroll">
		{#each transactions as transaction}
			<Transaction {transaction} />
		{/each}
	</div>

	<ChainNav />
</div>
