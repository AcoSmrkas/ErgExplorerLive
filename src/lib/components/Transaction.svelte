<script lang="ts">
	import { BigNumber } from 'bignumber.js';
	import { fade } from 'svelte/transition';
	import { ERGEXPLORER_URL } from '$lib/common/const';
	import { onMount } from 'svelte';
	import { nFormatter, resolveTxBoxes, trackNetAssetTransfers } from '$lib/common/utils';
	import Box from '$lib/components/Box.svelte';
	import Asset from './Asset.svelte';
	import SmallLoading from '$lib/components/SmallLoading.svelte';
	import ErgExplorerLink from './ErgExplorerLink.svelte';
	import TxLabel from './TxLabel.svelte';

	let { transaction } = $props();
	let thisTransaction: any = $state({});
	let showBoxDetails = $state(false);
	let showCoolBoxDetails = $state(true);
	let assets: { [key: string]: { tokenId: string; decimals: number; amount: any; name?: string } } =
		$state({});
	let totalValue: BigNumber = $derived(
		transaction.outputs.reduce(
			(total: BigNumber, output: any) => total.plus(output.value),
			new BigNumber(0)
		)
	);

	$effect(() => {
		setTimeout(updateAssets, 0);
	});

	function updateAssets() {
		const proxyTx = resolveTxBoxes(transaction);

		assets = {};
		const uniqueAssets = trackNetAssetTransfers(proxyTx);
		Object.values(uniqueAssets).forEach((item) => {
			if (
				item.amount.toNumber() !== 0 ||
				item.burned.toNumber() !== 0 ||
				item.minted.toNumber() !== 0
			) {
				assets[item.tokenId] = item;
			}
		});

		thisTransaction = proxyTx;
	}

	onMount(() => {
		thisTransaction = JSON.parse(JSON.stringify(transaction));
	});
</script>

<a target="_new" href={`${ERGEXPLORER_URL}transactions#${thisTransaction.id}`}>
	<div
		class="tx-container rounded-md border-1 border-[#555] p-1"
		out:fade|local={{ duration: 300 }}
	>
		<!-- Transaction Labels -->
		<TxLabel {transaction} />

		{#if !showCoolBoxDetails}
			<p>ID: <ErgExplorerLink type="transactions" value={thisTransaction.id} /></p>
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
				{#each thisTransaction.inputs as box}
					<Box {box} />
				{/each}

				<br />

				<p>Outputs:</p>
				{#each thisTransaction.outputs as box}
					<Box {box} />
				{/each}
			{/if}
		{:else if Object.keys(assets).length > 0}
			<div class="flex flex-wrap place-content-around">
				{#each Object.entries(assets) as [tokenId, asset]}
					<Asset {asset} />
				{/each}
			</div>
		{:else}
			<SmallLoading />
		{/if}
	</div>
</a>
