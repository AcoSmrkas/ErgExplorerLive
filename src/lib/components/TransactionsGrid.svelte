<script lang="ts">
	import Loading from './Loading.svelte';
	import Transaction from '$lib/components/Transaction.svelte';
	import { mempoolTxs, ready } from '$lib/store/store';
	import { trackNetAssetTransfers, resolveTxBoxes } from '$lib/common/utils';
	import { onMount } from 'svelte';

	import Grid from 'svelte-grid';
	import gridHelp from 'svelte-grid/build/helper/index.mjs';

	let container: Element | null = null;
	let transactions: Array<any> = $state([]);
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

		const mempoolTxsUnsubscribe = mempoolTxs.subscribe((value: any) => {
			transactions = value;
			updateLayout();
		});

		const resizeObserver = new ResizeObserver((entries) => {
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
		const layout = new Array(Object.keys(transactions).length).fill(null).map(function (item, i) {
			const tx = transactions[Number(Object.keys(transactions)[i])];
			const proxyTx = resolveTxBoxes(tx);

			const uniqueAssets = trackNetAssetTransfers(proxyTx);
			const assetCount = Object.values(uniqueAssets).filter(
				(item) =>
					item.amount.toNumber() !== 0 ||
					item.burned.toNumber() !== 0 ||
					item.minted.toNumber() !== 0
			).length;

			const maxX = col > 4 ? 4 : col;
			const calculatedH = Math.ceil(assetCount / 4);
			const calculatedW = assetCount >= maxX ? maxX : assetCount;

			item = {
				[colN[0]]: {
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false,
					customDragger: false,
					customResizer: false
				},
				[colN[1]]: gridHelp.item({
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false,
					customDragger: false,
					customResizer: false
				}),
				[colN[2]]: gridHelp.item({
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false,
					customDragger: false,
					customResizer: false
				}),
				[colN[3]]: gridHelp.item({
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false,
					customDragger: false,
					customResizer: false
				}),
				[colN[4]]: gridHelp.item({
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false,
					customDragger: false,
					customResizer: false
				}),
				[colN[5]]: gridHelp.item({
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false,
					customDragger: false,
					customResizer: false
				}),
				[colN[6]]: gridHelp.item({
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false,
					customDragger: false,
					customResizer: false
				}),
				[colN[7]]: gridHelp.item({
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false,
					customDragger: false,
					customResizer: false
				}),
				id: tx.id,
				data: tx
			};

			return item;
		});

		return layout;
	}
</script>

<div id="grid-container" class="h-[69vh] max-h-[69vh] overflow-y-scroll">
	{#if $ready}
		<Grid bind:items gap={[6, 6]} rowHeight={130} let:item let:dataItem {cols} fillSpace={true}>
			<Transaction transaction={dataItem.data} />
		</Grid>
	{:else}
		<Loading height={'full'} />
	{/if}
</div>
