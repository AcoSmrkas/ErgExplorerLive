<script lang="ts">
	import Loading from './Loading.svelte';
	import Transaction from '$lib/components/Transaction.svelte';
	import { mempoolTxs, ready } from '$lib/store/store';
	import type { MempoolTx } from '$lib/common/mempool';
	import { onMount } from 'svelte';

	import Grid from '$lib/svelte-grid/index.svelte';
	import gridHelp from '$lib/svelte-grid/utils/helper';
	import { fade } from 'svelte/transition';

	const ROW_ASSETS = 4;

	let container: Element | null = null;
	let transactions: MempoolTx[] = $state([]);
	let colN = [1, 2, 3, 4, 6, 8, 10, 13];
	let cols = [
		[200, colN[0]],
		[350, colN[1]],
		[410, colN[2]],
		[610, colN[3]],
		[810, colN[4]],
		[1010, colN[5]],
		[1300, colN[6]],
		[5000000, colN[7]]
	];
	let items = $state([]);

	onMount(() => {
		container = document.getElementById('grid-container');

		const mempoolTxsUnsubscribe = mempoolTxs.subscribe((value) => {
			transactions = value;
			updateLayout();
		});

		const resizeObserver = new ResizeObserver(() => {
			updateLayout();
		});

		if (container) {
			resizeObserver.observe(container);
		}

		return () => {
			resizeObserver.disconnect();
			mempoolTxsUnsubscribe();
		};
	});

	function updateLayout() {
		const width = container ? container.clientWidth : 0;

		let col = 0;
		for (const c of cols) {
			if (width < c[0]) {
				col = c[1];
				break;
			}
		}

		items = gridHelp.adjust(generateLayout(col), col);
	}

	function generateLayout(col: number) {
		const rowAssets = col > 4 ? ROW_ASSETS + 1 : ROW_ASSETS;
		const maxX = Math.min(col, rowAssets);

		return transactions.map((tx) => {
			const assetCount = tx.transfers.length;
			const size = {
				w: Math.max(1, Math.min(assetCount, maxX)),
				h: Math.max(1, Math.ceil(assetCount / rowAssets)),
				draggable: false,
				resizable: false,
				customDragger: false,
				customResizer: false
			};

			return {
				...Object.fromEntries(colN.map((n) => [n, gridHelp.item(size)])),
				id: tx.id,
				data: tx
			};
		});
	}
</script>

<div id="grid-container" class="h-[68vh] max-h-[68vh] overflow-y-scroll">
	{#if $ready}
		<Grid
			bind:items
			gap={[6, 6]}
			headerHeight={36}
			rowHeight={110}
			let:dataItem
			{cols}
			fillSpace={true}
		>
			<Transaction transaction={dataItem.data} />
		</Grid>
	{:else}
		<div class="loading-holder h-full" out:fade|local={{ duration: 200 }}>
			<Loading />
		</div>
	{/if}
</div>
