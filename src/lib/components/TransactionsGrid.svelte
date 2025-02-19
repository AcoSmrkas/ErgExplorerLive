<script lang="ts">
	import Transaction from '$lib/components/Transaction.svelte';
	import { mempoolTxs } from '$lib/store/store';
	import { onMount } from 'svelte';

	import Grid from 'svelte-grid';
	import gridHelp from 'svelte-grid/build/helper/index.mjs';

	let transactions: Array<any> = $state([]);
	let colN = [2, 3, 4, 6, 8, 10, 13];
	let cols = [
		[350, colN[0]],
		[410, colN[1]],
		[610, colN[2]],
		[810, colN[3]],
		[1010, colN[4]],
		[1300, colN[5]],
		[5000000, colN[6]]
	];
	let items = $state([]);

	onMount(() => {
		const mempoolTxsUnsubscribe = mempoolTxs.subscribe((value: any) => {
			transactions = value;

			// transactions = {};
			// transactions['123'] = {
			// 	id: '123',
			// 	inputs: [
			// 		{
			// 			value: 1,
			// 			address: '123',
			// 			assets: [
			// 				{
			// 					tokenId: '123',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	],
			// 	outputs: [
			// 		{
			// 			value: 1000000000000,
			// 			ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
			// 			assets: [
			// 				{
			// 					tokenId: '123',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	]
			// };
			// transactions['232'] = {
			// 	id: '232',
			// 	inputs: [
			// 		{
			// 			value: 1,
			// 			address: '232',
			// 			assets: [
			// 				{
			// 					tokenId: '232',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	],
			// 	outputs: [
			// 		{
			// 			value: 10000000000,
			// 			ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
			// 			assets: [
			// 				{
			// 					tokenId: '232',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	]
			// };

			// transactions['7211'] = {
			// 	id: '7211',
			// 	inputs: [
			// 		{
			// 			value: 1,
			// 			address: '7211',
			// 			assets: [
			// 				{
			// 					tokenId: '7211',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	],
			// 	outputs: [
			// 		{
			// 			value: 10000000000,
			// 			ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
			// 			assets: [
			// 				{
			// 					tokenId: '7211',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	]
			// };
			// transactions['72111'] = {
			// 	id: '72111',
			// 	inputs: [
			// 		{
			// 			value: 1,
			// 			address: '72111',
			// 			assets: [
			// 				{
			// 					tokenId: '72111',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	],
			// 	outputs: [
			// 		{
			// 			value: 10000000000,
			// 			ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
			// 			assets: [
			// 				{
			// 					tokenId: '72111',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	]
			// };

			// transactions['72'] = {
			// 	id: '72',
			// 	inputs: [
			// 		{
			// 			value: 1,
			// 			address: '72',
			// 			assets: [
			// 				{
			// 					tokenId: '72',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	],
			// 	outputs: [
			// 		{
			// 			value: 10000000000,
			// 			ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
			// 			assets: [
			// 				{
			// 					tokenId: '72',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	]
			// };

			// transactions['77'] = {
			// 	id: '77',
			// 	inputs: [
			// 		{
			// 			value: 1,
			// 			address: '77',
			// 			assets: [
			// 				{
			// 					tokenId: '77',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	],
			// 	outputs: [
			// 		{
			// 			value: 10000000000,
			// 			ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
			// 			assets: []
			// 		}
			// 	]
			// };

			// transactions['9'] = {
			// 	id: '9',
			// 	inputs: [
			// 		{
			// 			value: 1,
			// 			address: '9',
			// 			assets: [
			// 				{
			// 					tokenId: '9',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	],
			// 	outputs: [
			// 		{
			// 			value: 10000000000,
			// 			ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
			// 			assets: []
			// 		}
			// 	]
			// };

			// transactions['2'] = {
			// 	id: '2',
			// 	inputs: [
			// 		{
			// 			value: 1,
			// 			address: '2',
			// 			assets: [
			// 				{
			// 					tokenId: '2',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	],
			// 	outputs: [
			// 		{
			// 			value: 10000000000,
			// 			ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
			// 			assets: []
			// 		}
			// 	]
			// };

			// transactions['1'] = {
			// 	id: '1',
			// 	inputs: [
			// 		{
			// 			value: 1,
			// 			address: '1',
			// 			assets: [
			// 				{
			// 					tokenId: '1',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	],
			// 	outputs: [
			// 		{
			// 			value: 10000000000,
			// 			ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
			// 			assets: []
			// 		}
			// 	]
			// };

			// transactions['6222233'] = {
			// 	id: '6222233',
			// 	inputs: [
			// 		{
			// 			value: 1,
			// 			address: '6222233',
			// 			assets: [
			// 				{
			// 					tokenId: '6222233',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	],
			// 	outputs: [
			// 		{
			// 			value: 10000000000,
			// 			ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
			// 			assets: [
			// 				{
			// 					tokenId: '6222233',
			// 					decimals: 2,
			// 					amount: 1
			// 				},
			// 				{
			// 					tokenId: '622223223',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	]
			// };

			// transactions['62'] = {
			// 	id: '62',
			// 	inputs: [
			// 		{
			// 			value: 1,
			// 			address: '62',
			// 			assets: [
			// 				{
			// 					tokenId: '62',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	],
			// 	outputs: [
			// 		{
			// 			value: 10000000000,
			// 			ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
			// 			assets: [
			// 				{
			// 					tokenId: '62',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	]
			// };

			// transactions['453'] = {
			// 	id: '453',
			// 	inputs: [
			// 		{
			// 			value: 1,
			// 			address: '453',
			// 			assets: [
			// 				{
			// 					tokenId: '453',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	],
			// 	outputs: [
			// 		{
			// 			value: 10000000000,
			// 			ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
			// 			assets: [
			// 				{
			// 					tokenId: '453',
			// 					decimals: 2,
			// 					amount: 1
			// 				},
			// 				{
			// 					tokenId: '3',
			// 					decimals: 2,
			// 					amount: 1
			// 				},
			// 				{
			// 					tokenId: '1',
			// 					decimals: 2,
			// 					amount: 1
			// 				},
			// 				{
			// 					tokenId: '13',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	]
			// };

			// transactions['443'] = {
			// 	id: '443',
			// 	inputs: [
			// 		{
			// 			value: 1,
			// 			address: '443',
			// 			assets: [
			// 				{
			// 					tokenId: '443',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	],
			// 	outputs: [
			// 		{
			// 			value: 10000000000,
			// 			ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
			// 			assets: [
			// 				{
			// 					tokenId: '443',
			// 					decimals: 2,
			// 					amount: 1
			// 				},
			// 				{
			// 					tokenId: '3',
			// 					decimals: 2,
			// 					amount: 1
			// 				},
			// 				{
			// 					tokenId: '1',
			// 					decimals: 2,
			// 					amount: 1
			// 				},
			// 				{
			// 					tokenId: '13',
			// 					decimals: 2,
			// 					amount: 1
			// 				}
			// 			]
			// 		}
			// 	]
			// };

			const container = document.getElementById('grid-container');
			const width = container ? container.clientWidth : 0;

			let col = 0;
			for (const c of cols) {
				if (width < c[0]) {
					col = c[1];
					break;
				}
			}

			items = gridHelp.adjust(generateLayout(col), col);
		});

		return () => {
			mempoolTxsUnsubscribe();
		};
	});

	function generateLayout(col: number) {
		const layout = new Array(Object.keys(transactions).length).fill(null).map(function (item, i) {
			const tx = transactions[Number(Object.keys(transactions)[i])];

			const uniqueAssets = new Map();

			tx.outputs
				.flatMap((output: { assets: any[] }) => output.assets)
				.forEach((asset: { tokenId: any }) => uniqueAssets.set(asset.tokenId, asset));

			const assetCount = uniqueAssets.size + 1;

			const maxX = col > 4 ? 4 : col;
			const calculatedH = Math.ceil(assetCount / 4);
			const calculatedW = assetCount >= maxX ? maxX : assetCount;

			item = {
				[colN[0]]: {
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false
				},
				[colN[1]]: gridHelp.item({
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false
				}),
				[colN[2]]: gridHelp.item({
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false
				}),
				[colN[3]]: gridHelp.item({
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false
				}),
				[colN[4]]: gridHelp.item({
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false
				}),
				[colN[5]]: gridHelp.item({
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false
				}),
				[colN[6]]: gridHelp.item({
					w: calculatedW > 0 ? calculatedW : 1,
					h: calculatedH > 0 ? calculatedH : 1,
					draggable: false,
					resizable: false
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
	<Grid bind:items gap={[6, 6]} rowHeight={130} let:item let:dataItem {cols} fillSpace={true}>
		<Transaction transaction={dataItem.data} />
	</Grid>
</div>
