<script lang="ts">
	import { resolveTxBoxes } from '$lib/common/utils';
	import { addressBook } from '$lib/store/store';
	import { onMount } from 'svelte';

	// Constants
	const EXCLUDED_LABELS = ['Ergo Platform (Miner Fee)'];

	// Special transaction configurations
	const SPECIAL_CONFIG = {
		MIXERS: {
			tokens: ['1a6a8c16e4b1cc9d73d03183565cfb8e79dd84198cb66beeed7d3463e0da2b98'],
			label: 'Mixer',
			style: 'bg-purple-500/70'
		},
		SIGUSD_ORACLE: {
			addresses: [
				'AucEQEJ3Y5Uhmu4o8dsrHy28nRTgX5sVtXvjpMTqdMQzBR3uRVcvCFbv7SeGuPhQ16AXBP7XWdMShDdhRy4cayZgxHSkdAVuTiZRvj6WCfmhXJ4LY2E46CytRAnkiYubCdEroUUX2niMLhjNmDUn4KmXWSrKngrfGwHSaD8RJUMEp5AGADaChRU6kAnh9nstkDN3'
			],
			tokens: ['011d3364de07e5a26f0c4eef0852cddb387039a921b7154ef3cab22c6eda887f'],
			label: 'SigUSD Oracle',
			style: 'bg-blue-500/70'
		},
		Rosen_Bridge_Binance_test: {
			addresses: [
				'2Eit2LFRqu2Mo33z3pYTJRHNCNzNQ51TP2C7dZhBWYB7eCYDNpJy3gjXAJbr3fUtKaZLDQTSw4uZG5sgWWpTmbNQHKxjP2Z3zCqxhaJeLc6tHXQzBop9dHSvFaiGkFZj7RjMvrWnHHA79zpgvwYAKmeRRquAcJV2jsGc8Uvdf3gEpueLPUfRLKHwfqVZsyPheMWfgbUpLRP1zCZRrDRmz9DshmMD5VjxGHtvrWZwxGe3KYNZUis8pixkpMfXVggXJvc57Xig3RxZ3fT2AAuhYeGrzjH74dj44FtyCVa3veMXXDpimkL2qGQ7vnd1Uh6dw5z1KGmJUkbwtoBdq5m9Zcg1mrvTqhk2pE1MM1K4Ax7hgANjWmBXn2nx6cyxUyji1nPKzJdWxYCC7PhRdRqC9mfFxnNg8CJPsyFaTj2FxxAe1bDhL6QaQ9ac4tgUXfG5tKMukdzDJ4o3ibvwTxXffiA2V9kpHo2PNXGTVkvLS7TAqe9xNJN9sqqC9DXYJsTvEQsbbF3WUb8bcYuGk4K4ftdBWEiC6kNKFeqvn6D5uyD5Kf3G1diaPqVbxuoQ6qMEPXgRiRQB5ANJHBxB9HxX186JmKVkRbx3qxzar35aaStHzbzDjPvgvBjhkFcUVRg8DnuHpaXPw83z6FQDC9MCJAhGao4kQvgh7HtMufLZtuZjaMNnE8SVwm87yQBEh4NtyqTGvG'
			],
			tokens: ['34529f875cad2bf58c5ffb4a9056d26c590f0c35f77958a68dcdb4aa39b437aa'],
			label: ' Rosen Bridge Binance test',
			style: 'bg-orange-500/70'
		},
		DUCKPOOL_BORROW: {
			tokens: ['1d7857a82d2f3d00d58cbd3b6ad337c98b6aa5e1021a17deb7527e0c3c148be7'],
			label: 'Duckpools',
			style: 'bg-green-500/70'
		},
		BABEL_FEE: {
			tokens: ['272a4aeba6d1596ee0405b13fa223074077fd31f2d519fcd2f7b1656596db029'],
			label: 'Babel fee ',
			style: 'bg-green-500/70'
		},
		DUCKPOOL_RSADA: {
			tokens: ['35f826497f8eadf5b46f768485cec175c35c11360b4821ea92bbbe855777b55c'],
			label: 'Duckpool rsADA',
			style: 'bg-pink-500/70'
		}
	};

	let { transaction } = $props();
	let thisTransaction: any = $state({});

	let txLabels: Array<{ label: string; style: string }> = $state([]);
	let addressBookAddresses = $state(new Map());

	function updateLabels() {
		const proxyTx = resolveTxBoxes(transaction);

		// Determine transaction labels and store them
		txLabels = determineTransactionLabels(proxyTx);

		// Store labels on the transaction object for easier access
		proxyTx.txLabels = txLabels;

		thisTransaction = proxyTx;
	}

	function determineTransactionLabels(tx: any): { label: string; style: string }[] {
		const labels = [];

		// Check special configurations first
		Object.entries(SPECIAL_CONFIG).forEach(([key, config]) => {
			let shouldAdd = false;

			// Check if the transaction matches special token configurations
			if (config.tokens && checkForSpecialTokens(tx, config.tokens, key === 'MIXERS')) {
				shouldAdd = true;
			}

			// Check if the transaction matches special address configurations
			if (
				'addresses' in config &&
				config.addresses &&
				checkForSpecialAddress(tx, config.addresses)
			) {
				shouldAdd = true;
			}

			// If the transaction matches the special configuration, add the label
			if (shouldAdd) {
				labels.push({
					label: config.label,
					style: config.style
				});
			}
		});

		// Then check address book labels
		const addressBookLabels = determineAddressBookLabels(tx);
		if (addressBookLabels.length > 0) {
			labels.push(...addressBookLabels);
		}

		// If no labels were found, add a default transfer label
		if (labels.length === 0) {
			const defaultLabel = {
				label: 'Transfer',
				style: 'bg-gray-500/30'
			};
			labels.push(defaultLabel);
		}

		// Store labels on the transaction object itself for easier access
		tx.txLabels = labels;

		// Return the labels (first label will be displayed in the UI)
		return labels;
	}

	function checkForSpecialTokens(tx: any, tokenList: string[], requireBothInputOutput = false) {
		return tokenList.some((tokenId) => {
			const hasInInputs = tx.inputs.some((input: { assets: any[] }) =>
				input.assets?.some((asset) => asset.tokenId === tokenId)
			);
			const hasInOutputs = tx.outputs.some((output: { assets: { tokenId: string }[] }) =>
				output.assets?.some((asset: { tokenId: string }) => asset.tokenId === tokenId)
			);
			return requireBothInputOutput ? hasInInputs && hasInOutputs : hasInInputs || hasInOutputs;
		});
	}

	function checkForSpecialAddress(tx: any, addressList: string[]) {
		return addressList.some((address) => {
			const isInInputs = tx.inputs.some((input: { address: string }) => input.address === address);
			const isInOutputs = tx.outputs.some(
				(output: { address: string }) => output.address === address
			);
			return isInInputs || isInOutputs;
		});
	}

	function determineAddressBookLabels(tx: any) {
		const labels = new Set();
		const seenAddresses = new Set();

		const customStyles = {
			gold: 'bg-yellow-500/70',
			mew: 'bg-purple-500/70',
			duckpool: 'bg-yellow-500/70',
			dex: 'bg-pink-500/70',
			rosen: 'bg-orange-500/70',
			sigusd: 'bg-blue-500/70',
			default: 'bg-gray-500/30'
		};

		function getCustomStyle(label: string): string {
			const lowerLabel = label.toLowerCase();

			for (const [key, style] of Object.entries(customStyles)) {
				if (lowerLabel.includes(key)) return style;
			}

			return customStyles.default;
		}

		// Add Sky Harbor price label if applicable
		const skyharbourPrice = extractSkyharbourPrice(tx);
		if (skyharbourPrice) {
			labels.add({
				label: `Sky Harbor`,
				style: 'bg-blue-500/70'
			});
		}

		const bridgeTokens = {
			'8a94d71b4a08058327fa8372aa69d95c337536c6577c31c8d994169a041e5fc0': 'Ergo',
			f5985c64c1aa8f08569dc77a046f65f92947abaa9ccd530aead033eece23496e: 'Ethereum',
			ddb335d2b4f3764ddeae8411a14bec97f94d0057628bb96f98da9d95e74d02bc: 'Cardano',
			'33477693d6be5bbd3a4cd786fbff5e6444449c191ab08e681aaaa87fc192772c': 'Binance',
			'30e4392fc439fce9948da124efddb8779fe179eef5a5d6196e249b75ee64defc': 'BTC'
		};

		let chainName = '';
		[...tx.inputs, ...tx.outputs].forEach((box) => {
			if (box.assets) {
				box.assets.forEach((asset: { tokenId: string }) => {
					if (bridgeTokens[asset.tokenId as keyof typeof bridgeTokens]) {
						if (asset.tokenId in bridgeTokens) {
							chainName = bridgeTokens[asset.tokenId as keyof typeof bridgeTokens];
						}
					}
				});
			}
		});

		[...tx.inputs, ...tx.outputs].forEach((box) => {
			if (!seenAddresses.has(box.address)) {
				seenAddresses.add(box.address);
				const addressInfo = addressBookAddresses.get(box.address);

				if (addressInfo && !EXCLUDED_LABELS.includes(addressInfo.name)) {
					let label = addressInfo.name;
					if (addressInfo.name === 'Rosen Bridge' && chainName) {
						label = `${addressInfo.name} (${chainName})`;
					}
					if (addressInfo.name === 'Ergo Platform') {
						label = `P2P`;
					} else if (addressInfo.name === 'Spectrum Finance') {
						label = 'Dex Trade';
					}

					const style = getCustomStyle(label);

					labels.add({
						label,
						style
					});
				}
			}
		});

		return Array.from(labels) as { label: string; style: string }[];
	}

	function extractSkyharbourPrice(transaction: any): string | null {
		// Look for outputs with Sky Harbor address
		const skyharbourOutput = transaction.outputs.find((output: any) => {
			const addressInfo = addressBookAddresses.get(output.address);
			return addressInfo && addressInfo.name === 'Sky Harbor';
		});

		if (skyharbourOutput && skyharbourOutput.additionalRegisters) {
			// Check if R4 register exists and contains the price
			const r4 = skyharbourOutput.additionalRegisters.R4;

			if (r4) {
				try {
					// Convert using Math.pow
					const priceInErg = Number(r4) / Math.pow(10, 9);

					return priceInErg.toFixed(2);
				} catch (error) {
					console.error('Error parsing Sky Harbor price:', error, 'R4 value:', r4);
				}
			}
		}
		return null;
	}

	onMount(() => {
		const addressBookUnsub = addressBook.subscribe((newAddressBook) => {
			addressBookAddresses.clear();
			Object.entries(newAddressBook).forEach(([key, value]) => {
				addressBookAddresses.set(key, value);
			});
		});

		updateLabels();

		return () => {
			addressBookUnsub();
		};
	});
</script>

{#if txLabels.length > 0}
	{#each txLabels.slice(0, 1) as label}
		<div class="label-header {label.style} w-full">
			{label.label}
		</div>
	{/each}
{:else}
	<div class="label-header default-label w-full">
		<span class="label-text">Transfer</span>
	</div>
{/if}

<style>
	.label-header {
		font-size: 11px;
		font-weight: 500;
		padding: 4px 6px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-radius: 4px;
		max-height: 20px;
		color: #fff;
		margin-bottom: 2px;
		white-space: nowrap; /* Prevent text from wrapping */
		overflow: hidden; /* Hide overflowing text */
		text-overflow: ellipsis; /* Show "..." when text is too long */
		width: 100%; /* Set a fixed width */
	}
</style>
