<script lang="ts">
	import { BigNumber } from 'bignumber.js';
	import Box from '$lib/components/Box.svelte';
	import { nFormatter, resolveBoxById, getBoxDataById, ergoTreeToAddress } from '$lib/common/utils';
	import { onMount } from 'svelte';
	import ErgExplorerLink from './ErgExplorerLink.svelte';

	let { transaction } = $props();
	let thisTransaction: any = $state({});
	let showBoxDetails = $state(false);

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
	}

	onMount(async () => {
		thisTransaction = JSON.parse(JSON.stringify(transaction));

		resolveInputBoxes();
	});
</script>

<div class="m-2 border-1 p-2 break-all">
	<p>ID: <ErgExplorerLink type="transactions" value={thisTransaction.id} /></p>
	<div class="flex">
		<span>Total value: {nFormatter(totalValue.dividedBy(10 ** 9).toNumber())} ERG</span>

		<button class="ms-auto" onclick={() => (showBoxDetails = !showBoxDetails)}>Show Details</button>
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
</div>
