<script lang="ts">
	import { BigNumber } from 'bignumber.js';
	import { nFormatter, resolveBoxById, getBoxDataById, ergoTreeToAddress } from '$lib/common/utils';
	import { onMount } from 'svelte';
	import Box from '$lib/components/Box.svelte';
	import Asset from './Asset.svelte';
	import ErgExplorerLink from './ErgExplorerLink.svelte';
	import { fade, fly } from 'svelte/transition';

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

	async function resolveInputBoxes() {
		const proxyTx = JSON.parse(JSON.stringify(transaction));

		for (let i = 0; i < thisTransaction.inputs.length; i++) {
			let input = thisTransaction.inputs[i];

			const boxData = await resolveBoxById(input.boxId);

			if (boxData) {
				thisTransaction.inputs[i] = boxData;
			}
		}

		thisTransaction = proxyTx;

		updateAssets();
	}

	function updateAssets() {
		assets = thisTransaction.outputs
			.flatMap((output: { assets: any }) => output.assets)
			.reduce(
				(
					acc: { [x: string]: { tokenId: string; decimals: number; amount: any } },
					{ tokenId, decimals, amount }: any
				) => {
					if (!acc[tokenId]) {
						acc[tokenId] = { tokenId, decimals, amount: 0 };
					}
					acc[tokenId].amount += amount;
					return acc;
				},
				{}
			);

		const newAssets = {
			ERG: {
				tokenId: 'ERG',
				decimals: 9,
				amount: new BigNumber(0)
			},
			...assets
		};

		assets = newAssets;

		assets['ERG'] = {
			name: 'ERG',
			tokenId: 'ERG',
			decimals: 9,
			amount: thisTransaction.outputs.reduce(
				(total: BigNumber, output: any) => total.plus(output.value),
				new BigNumber(0)
			)
		};
	}

	onMount(async () => {
		thisTransaction = JSON.parse(JSON.stringify(transaction));

		resolveInputBoxes();
	});
</script>

<div
	class="tx-container flex flex-wrap place-content-around gap-y-7 rounded-md border-1 border-[#555] p-2"
	in:fly|local={{ y: 100, duration: 300 }}
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
		{#each Object.entries(assets) as [tokenId, asset]}
			<Asset {asset} />
		{/each}
	{/if}
</div>
