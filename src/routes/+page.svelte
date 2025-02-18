<script lang="ts">
	import { onMount } from 'svelte';
	import { nodeInfo, mempoolTxs } from '$lib/store/store';
	import Transaction from '$lib/components/Transaction.svelte';

	let height = $state(0);
	let transactions = $state([]);

	onMount(() => {
		const nodeInfoUnsubscribe = nodeInfo.subscribe((value: any) => (height = value.fullHeight));
		const mempoolTxsUnsubscribe = mempoolTxs.subscribe((value: any) => (transactions = value));

		return () => {
			nodeInfoUnsubscribe();
			mempoolTxsUnsubscribe();
		};
	});
</script>

<div>
	<p>Current height: {height}</p>
	<p>Current mempool transactions: {transactions.length}</p>

	<div class="grid grid-cols-2">
		{#each transactions as transaction}
			<Transaction {transaction} />
		{/each}
	</div>
</div>
