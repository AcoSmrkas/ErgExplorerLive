<script lang="ts">
	import Transaction from '$lib/components/Transaction.svelte';
	import { mempoolTxs } from '$lib/store/store';
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

	let mockTransactions: any = {};
	mockTransactions['123'] = {
		id: '123',
		inputs: [
			{
				value: 1,
				address: '123',
				assets: [
					{
						tokenId: '123',
						decimals: 2,
						amount: 1
					}
				]
			}
		],
		outputs: [
			{
				value: 1000000000000,
				ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
				assets: [
					{
						tokenId: '123',
						decimals: 2,
						amount: 1
					}
				]
			}
		]
	};
	mockTransactions['232'] = {
		id: '232',
		inputs: [
			{
				value: 1,
				address: '232',
				assets: [
					{
						tokenId: '232',
						decimals: 2,
						amount: 1
					}
				]
			}
		],
		outputs: [
			{
				value: 10000000000,
				ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
				assets: [
					{
						tokenId: '232',
						decimals: 2,
						amount: 1
					}
				]
			}
		]
	};

	mockTransactions['7211'] = {
		id: '7211',
		inputs: [
			{
				value: 1,
				address: '7211',
				assets: [
					{
						tokenId: '7211',
						decimals: 2,
						amount: 1
					}
				]
			}
		],
		outputs: [
			{
				value: 10000000000,
				ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
				assets: [
					{
						tokenId: '7211',
						decimals: 2,
						amount: 1
					}
				]
			}
		]
	};
	mockTransactions['72111'] = {
		id: '72111',
		inputs: [
			{
				value: 1,
				address: '72111',
				assets: [
					{
						tokenId: '72111',
						decimals: 2,
						amount: 1
					}
				]
			}
		],
		outputs: [
			{
				value: 10000000000,
				ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
				assets: [
					{
						tokenId: '72111',
						decimals: 2,
						amount: 1
					}
				]
			}
		]
	};

	mockTransactions['72'] = {
		id: '72',
		inputs: [
			{
				value: 1,
				address: '72',
				assets: [
					{
						tokenId: '72',
						decimals: 2,
						amount: 1
					}
				]
			}
		],
		outputs: [
			{
				value: 10000000000,
				ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
				assets: [
					{
						tokenId: '72',
						decimals: 2,
						amount: 1
					}
				]
			}
		]
	};

	mockTransactions['77'] = {
		id: '77',
		inputs: [
			{
				value: 1,
				address: '77',
				assets: [
					{
						tokenId: '77',
						decimals: 2,
						amount: 1
					}
				]
			}
		],
		outputs: [
			{
				value: 10000000000,
				ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
				assets: []
			}
		]
	};

	mockTransactions['9'] = {
		id: '9',
		inputs: [
			{
				value: 1,
				address: '9',
				assets: [
					{
						tokenId: '9',
						decimals: 2,
						amount: 1
					}
				]
			}
		],
		outputs: [
			{
				value: 10000000000,
				ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
				assets: []
			}
		]
	};

	mockTransactions['2'] = {
		id: '2',
		inputs: [
			{
				value: 1,
				address: '2',
				assets: [
					{
						tokenId: '2',
						decimals: 2,
						amount: 1
					}
				]
			}
		],
		outputs: [
			{
				value: 10000000000,
				ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
				assets: []
			}
		]
	};

	mockTransactions['1'] = {
		id: '1',
		inputs: [
			{
				value: 1,
				address: '1',
				assets: [
					{
						tokenId: '1',
						decimals: 2,
						amount: 1
					}
				]
			}
		],
		outputs: [
			{
				value: 10000000000,
				ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
				assets: []
			}
		]
	};

	mockTransactions['6222233'] = {
		id: '6222233',
		inputs: [
			{
				value: 1,
				address: '6222233',
				assets: [
					{
						tokenId: '6222233',
						decimals: 2,
						amount: 1
					}
				]
			}
		],
		outputs: [
			{
				value: 10000000000,
				ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
				assets: [
					{
						tokenId: '6222233',
						decimals: 2,
						amount: 1
					},
					{
						tokenId: '622223223',
						decimals: 2,
						amount: 1
					}
				]
			}
		]
	};

	mockTransactions['62'] = {
		id: '62',
		inputs: [
			{
				value: 1,
				address: '62',
				assets: [
					{
						tokenId: '62',
						decimals: 2,
						amount: 1
					}
				]
			}
		],
		outputs: [
			{
				value: 10000000000,
				ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
				assets: [
					{
						tokenId: '62',
						decimals: 2,
						amount: 1
					}
				]
			}
		]
	};

	mockTransactions['453'] = {
		id: '453',
		inputs: [
			{
				value: 1,
				address: '453',
				assets: [
					{
						tokenId: '453',
						decimals: 2,
						amount: 1
					}
				]
			}
		],
		outputs: [
			{
				value: 10000000000,
				ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
				assets: [
					{
						tokenId: '453',
						decimals: 2,
						amount: 1
					},
					{
						tokenId: '3',
						decimals: 2,
						amount: 1
					},
					{
						tokenId: '1',
						decimals: 2,
						amount: 1
					},
					{
						tokenId: '13',
						decimals: 2,
						amount: 1
					}
				]
			}
		]
	};

	mockTransactions['443'] = {
		id: '443',
		inputs: [
			{
				value: 1,
				address: '443',
				assets: [
					{
						tokenId: '443',
						decimals: 2,
						amount: 1
					}
				]
			}
		],
		outputs: [
			{
				value: 10000000000,
				ergoTree: '0008cd03c59160fe57f73399d829835398712bfa5681d8708e8e3b29a197205808af8548',
				assets: [
					{
						tokenId: '443',
						decimals: 2,
						amount: 1
					},
					{
						tokenId: '3',
						decimals: 2,
						amount: 1
					},
					{
						tokenId: '1',
						decimals: 2,
						amount: 1
					},
					{
						tokenId: '13',
						decimals: 2,
						amount: 1
					}
				]
			}
		]
	};
	const mockTxKeys = Object.keys(mockTransactions);

	function handleKeydown(event) {
		if (event.key === 'd') {
			const tkeys = Object.keys(transactions);
			const key = mockTxKeys[tkeys.length];
			transactions[key] = mockTransactions[key];
		}

		if (event.key === 'a') {
			const tkeys = Object.keys(transactions);
			const key = mockTxKeys[tkeys.length - 1];
			delete transactions[key];
		}
	}

	onMount(() => {
		container = document.getElementById('grid-container');

		window.addEventListener('keydown', handleKeydown);

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
			window.removeEventListener('keydown', handleKeydown);
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
			const assetCount = Object.values(uniqueAssets).filter((item) =>
			item.amount.toNumber() !== 0
			|| item.burned.toNumber() !== 0
			|| item.minted.toNumber() !== 0
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
	<Grid bind:items gap={[6, 6]} rowHeight={130} let:item let:dataItem {cols} fillSpace={true}>
		<Transaction transaction={dataItem.data} />
	</Grid>
</div>
