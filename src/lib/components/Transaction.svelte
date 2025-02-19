<script lang="ts">
	import { BigNumber } from 'bignumber.js';
	import {
		nFormatter,
		getBoxDataById,
		ergoTreeToAddress,
		trackNetAssetTransfers
	} from '$lib/common/utils';
	import { onMount } from 'svelte';
	import Box from '$lib/components/Box.svelte';
	import Asset from './Asset.svelte';
	import SmallLoading from '$lib/components/SmallLoading.svelte';
	import ErgExplorerLink from './ErgExplorerLink.svelte';
	import { fade } from 'svelte/transition';
	import { ERGEXPLORER_URL } from '$lib/common/const';

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
		const proxyTx = JSON.parse(JSON.stringify(transaction));

		for (let i = 0; i < proxyTx.outputs.length; i++) {
			let output = proxyTx.outputs[i];

			proxyTx.outputs[i].address = ergoTreeToAddress(output.ergoTree);
		}

		for (let i = 0; i < proxyTx.inputs.length; i++) {
			let input = proxyTx.inputs[i];

			const boxData = getBoxDataById(input.boxId);

			if (boxData) {
				proxyTx.inputs[i] = boxData;
			}
		}

		thisTransaction = proxyTx;

		setTimeout(updateAssets, 0);
	});

	function updateAssets() {
		assets = trackNetAssetTransfers(thisTransaction);
	}

	onMount(async () => {
		thisTransaction = JSON.parse(JSON.stringify(transaction));
	});
</script>

<a target="_new" href={`${ERGEXPLORER_URL}transactions/${thisTransaction.id}`}>
	<div
		class="tx-container flex flex-wrap place-content-around gap-y-7 rounded-md border-1 border-[#555] p-2"
		out:fade|local={{ duration: 300 }}
	>
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
		{:else}
			{#if Object.keys(assets).length > 0}
				{#each Object.entries(assets) as [tokenId, asset]}
					<Asset {asset} />
				{/each}
			{:else}
				<SmallLoading />
			{/if}
		{/if}
	</div>
</a>
