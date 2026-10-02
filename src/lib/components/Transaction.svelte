<script lang="ts">
	import { BigNumber } from 'bignumber.js';
	import { fade } from 'svelte/transition';
	import { ERGEXPLORER_URL } from '$lib/common/const';
	import { nFormatter } from '$lib/common/utils';
	import type { MempoolTx } from '$lib/common/mempool';
	import Box from '$lib/components/Box.svelte';
	import Asset from './Asset.svelte';
	import ErgExplorerLink from './ErgExplorerLink.svelte';
	import TxLabel from './TxLabel.svelte';

	let { transaction }: { transaction: MempoolTx } = $props();
	let showBoxDetails = $state(false);
	let showCoolBoxDetails = $state(true);
	let totalValue: BigNumber = $derived(
		transaction.outputs.reduce((total, output) => total.plus(output.value), new BigNumber(0))
	);
</script>

<a target="_new" href={`${ERGEXPLORER_URL}transactions#${transaction.id}`}>
	<div
		class="tx-container rounded-md border-1 border-[#555] p-1"
		out:fade|local={{ duration: 300 }}
	>
		<!-- Transaction Labels -->
		<TxLabel {transaction} />

		{#if !showCoolBoxDetails}
			<p>ID: <ErgExplorerLink type="transactions" value={transaction.id} /></p>
			<div class="flex">
				<span
					>Total value: {nFormatter(totalValue.dividedBy(10 ** 9).toNumber())}
					<span class="text-primary font-bold">ERG</span></span
				>

				<button class="ms-auto" onclick={() => (showBoxDetails = !showBoxDetails)}
					>Show Details</button
				>
			</div>

			{#if showBoxDetails}
				<br />

				<p>Inputs:</p>
				{#each transaction.inputs as box}
					<Box {box} />
				{/each}

				<br />

				<p>Outputs:</p>
				{#each transaction.outputs as box}
					<Box {box} />
				{/each}
			{/if}
		{:else}
			<div class="flex flex-wrap place-content-around align-start">
				{#each transaction.transfers as asset (asset.tokenId)}
					<Asset {asset} />
				{/each}
			</div>
		{/if}
	</div>
</a>
