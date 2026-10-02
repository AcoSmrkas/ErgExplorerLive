import BigNumber from 'bignumber.js';
import { get } from 'svelte/store';
import { ERGEXPLORER_API } from '$lib/common/const';
import { assetInfos, addressBook } from '$lib/store/store';
import { ErgoAddress } from '@fleet-sdk/core';

type TransferBox = {
	address?: string;
	value?: number;
	assets?: { tokenId: string; amount: number; decimals?: number }[];
};

export type Transfer = {
	id: string;
	tokenId: string;
	decimals: number;
	amount: BigNumber;
	minted: BigNumber;
	burned: BigNumber;
};

export function trackNetAssetTransfers(thisTransaction: {
	inputs: TransferBox[];
	outputs: TransferBox[];
}) {
	// Step 1: Create maps to track assets by address and total amounts
	const inputsByAddress = new Map<string, Map<string, BigNumber>>();
	const outputsByAddress = new Map<string, Map<string, BigNumber>>();
	const totalInputsByToken = new Map<string, BigNumber>();
	const totalOutputsByToken = new Map<string, BigNumber>();
	const assetDecimals = new Map<string, number>();

	// Track ERG specially
	assetDecimals.set('ERG', 9);

	// Step 2: Process inputs
	thisTransaction.inputs.forEach((input) => {
		const address = input.address;
		if (!address) return;

		if (!inputsByAddress.has(address)) {
			inputsByAddress.set(address, new Map<string, BigNumber>());
		}
		const addressAssets = inputsByAddress.get(address)!;

		// Process ERG
		if (input.value !== undefined) {
			const tokenId = 'ERG';
			const amount = new BigNumber(input.value);

			// Update address-specific tracking
			const currentAmount = addressAssets.get(tokenId) || new BigNumber(0);
			addressAssets.set(tokenId, currentAmount.plus(amount));

			// Update total tracking
			const currentTotal = totalInputsByToken.get(tokenId) || new BigNumber(0);
			totalInputsByToken.set(tokenId, currentTotal.plus(amount));
		}

		// Process other assets
		if (input.assets) {
			input.assets.forEach((asset) => {
				if (!asset.tokenId) return;

				// Store decimals info
				if (asset.decimals !== undefined && !assetDecimals.has(asset.tokenId)) {
					assetDecimals.set(asset.tokenId, asset.decimals);
				}

				const amount = new BigNumber(asset.amount || 0);

				// Update address-specific tracking
				const currentAmount = addressAssets.get(asset.tokenId) || new BigNumber(0);
				addressAssets.set(asset.tokenId, currentAmount.plus(amount));

				// Update total tracking
				const currentTotal = totalInputsByToken.get(asset.tokenId) || new BigNumber(0);
				totalInputsByToken.set(asset.tokenId, currentTotal.plus(amount));
			});
		}
	});

	// Step 3: Process outputs
	thisTransaction.outputs.forEach((output) => {
		const address = output.address;
		if (!address) return;

		if (!outputsByAddress.has(address)) {
			outputsByAddress.set(address, new Map<string, BigNumber>());
		}
		const addressAssets = outputsByAddress.get(address)!;

		// Process ERG
		if (output.value !== undefined) {
			const tokenId = 'ERG';
			const amount = new BigNumber(output.value);

			// Update address-specific tracking
			const currentAmount = addressAssets.get(tokenId) || new BigNumber(0);
			addressAssets.set(tokenId, currentAmount.plus(amount));

			// Update total tracking
			const currentTotal = totalOutputsByToken.get(tokenId) || new BigNumber(0);
			totalOutputsByToken.set(tokenId, currentTotal.plus(amount));
		}

		// Process other assets
		if (output.assets) {
			output.assets.forEach((asset) => {
				if (!asset.tokenId) return;

				// Store decimals info
				if (asset.decimals !== undefined && !assetDecimals.has(asset.tokenId)) {
					assetDecimals.set(asset.tokenId, asset.decimals);
				}

				const amount = new BigNumber(asset.amount || 0);

				// Update address-specific tracking
				const currentAmount = addressAssets.get(asset.tokenId) || new BigNumber(0);
				addressAssets.set(asset.tokenId, currentAmount.plus(amount));

				// Update total tracking
				const currentTotal = totalOutputsByToken.get(asset.tokenId) || new BigNumber(0);
				totalOutputsByToken.set(asset.tokenId, currentTotal.plus(amount));
			});
		}
	});

	// Step 4: Calculate transfers between different addresses
	const transferredAssets: { [tokenId: string]: Transfer } = {};

	// First, identify all tokens in the transaction
	const allTokens = new Set<string>();
	totalInputsByToken.forEach((_, tokenId) => allTokens.add(tokenId));
	totalOutputsByToken.forEach((_, tokenId) => allTokens.add(tokenId));

	// For each token, calculate transfers, minting and burning
	allTokens.forEach((tokenId) => {
		const totalInputAmount = totalInputsByToken.get(tokenId) || new BigNumber(0);
		const totalOutputAmount = totalOutputsByToken.get(tokenId) || new BigNumber(0);

		// Initialize tracking for this token
		transferredAssets[tokenId] = {
			id: tokenId,
			tokenId,
			decimals: assetDecimals.get(tokenId) || 0,
			amount: new BigNumber(0),
			minted: new BigNumber(0),
			burned: new BigNumber(0)
		};

		// Check for minting and burning
		if (totalOutputAmount.isGreaterThan(totalInputAmount)) {
			// Tokens were minted
			transferredAssets[tokenId].minted = totalOutputAmount.minus(totalInputAmount);
		} else if (totalInputAmount.isGreaterThan(totalOutputAmount)) {
			// Tokens were burned
			transferredAssets[tokenId].burned = totalInputAmount.minus(totalOutputAmount);
		}

		// Calculate transfers between different addresses
		let transferredAmount = new BigNumber(0);

		// For each address in outputs
		outputsByAddress.forEach((outputAssets, address) => {
			// Skip if this address doesn't have this token
			if (!outputAssets.has(tokenId)) return;

			// Get amounts for this token
			const outputAmount = outputAssets.get(tokenId)!;
			const inputAmount =
				inputsByAddress.has(address) && inputsByAddress.get(address)!.has(tokenId)
					? inputsByAddress.get(address)!.get(tokenId)!
					: new BigNumber(0);

			// Calculate amount received from other addresses
			const receivedFromOthers = outputAmount.isGreaterThan(inputAmount)
				? outputAmount.minus(inputAmount)
				: new BigNumber(0);

			transferredAmount = transferredAmount.plus(receivedFromOthers);
		});

		// Account for minted tokens to avoid double counting
		if (transferredAmount.isGreaterThan(0) && transferredAssets[tokenId].minted.isGreaterThan(0)) {
			// Ensure we don't count minted tokens as transfers
			transferredAmount = BigNumber.max(
				transferredAmount.minus(transferredAssets[tokenId].minted),
				new BigNumber(0)
			);
		}

		transferredAssets[tokenId].amount = transferredAmount;
	});

	return transferredAssets;
}

export async function getAssetInfos(ids: Array<string>) {
	const assets = get(assetInfos) as { [key: string]: unknown };

	ids = ids.filter((id) => !(id in assets));

	if (ids.length == 0) return;

	try {
		const response = await fetch(`${ERGEXPLORER_API}tokens/byId`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ ids: ids }),
			signal: AbortSignal.timeout(10000)
		});
		const newData = (await response.json()).items;

		for (const data of newData) {
			assets[data.id] = data;
		}

		assetInfos.set(assets);
	} catch (error) {
		// Tiles show token ids, and pick the names up when a later lookup succeeds.
		console.error('Token info lookup failed:', error);
	}
}

export function collectTokenIds(
	transactions: {
		inputs?: { assets?: { tokenId: string }[] }[];
		outputs?: { assets?: { tokenId: string }[] }[];
	}[]
): string[] {
	const tokenIds = new Set<string>();

	transactions.forEach((tx) => {
		// Process inputs
		tx.inputs
			?.flatMap((input) => input.assets || [])
			.forEach((asset) => asset.tokenId && tokenIds.add(asset.tokenId));

		// Process outputs
		tx.outputs
			?.flatMap((output) => output.assets || [])
			.forEach((asset) => asset.tokenId && tokenIds.add(asset.tokenId));
	});

	return Array.from(tokenIds);
}

export function truncateAddress(address: string, len: number) {
	return `${address.substring(0, len)}...${address.substring(address.length - len)}`;
}

export function shortAddress(address: string) {
	return address.length > 12 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

// The same contracts (DEX pools, oracles, bots) recur in most txs, and decoding is the
// slow part of building one.
const addresses = new Map<string, string>();

export function ergoTreeToAddress(ergoTree: string) {
	let address = addresses.get(ergoTree);

	if (address === undefined) {
		try {
			address = ErgoAddress.fromErgoTree(ergoTree).toString();
		} catch {
			// Still groups the tx's boxes by script for the transfer totals.
			address = ergoTree;
		}

		if (addresses.size >= 5000) addresses.clear();
		addresses.set(ergoTree, address);
	}

	return address;
}

function getDecimals(value: string | number, additional = 1): number {
	if (typeof value === 'string' && value.includes('e-')) {
		const eIndex = value.indexOf('e-');
		return parseInt(value.substr(eIndex + 2));
	}

	let valueStr = value.toString();

	if (Number(value) < 0) {
		valueStr = Math.abs(Number(value)).toString();
	}

	let decimals = 2;
	const valueParts = valueStr.split('.');
	if (valueParts.length > 1) {
		const realSmall = valueParts[1].split('-');
		if (realSmall.length > 1) {
			decimals = parseInt(realSmall[1]) + 1;
		} else {
			for (let j = 0; j < valueParts[1].length; j++) {
				if (valueParts[1][j] !== '0') {
					decimals = j + additional;

					if (valueParts[1].length > j + 1 && valueParts[1][j + 1] !== '0') {
						decimals++;
					}

					break;
				}
			}
		}
	} else {
		decimals = 2;
	}

	if (decimals < 2) {
		decimals = 2;
	}

	return decimals;
}

export function nFormatter(
	num: number,
	decimals: number = -1,
	short: boolean = true
): string | number {
	let digits = getDecimals(num);

	const lookup: { value: number; symbol: string }[] = [
		{ value: 1, symbol: '' },
		// { value: 1e3, symbol: "k" },
		{ value: 1e6, symbol: 'M' },
		{ value: 1e9, symbol: 'B' },
		{ value: 1e12, symbol: 'T' },
		{ value: 1e15, symbol: 'P' },
		{ value: 1e18, symbol: 'E' }
	];

	if (num > 10) {
		digits = 2;
	}

	if (decimals > -1) {
		digits = decimals;
	}

	let minimumFractionDigits = 2;
	if (digits < minimumFractionDigits) {
		minimumFractionDigits = digits;
	}

	const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
	const item = lookup
		.slice()
		.reverse()
		.find(function (item) {
			return num >= item.value;
		});

	return item && short
		? (num / item.value)
				.toLocaleString('en-US', {
					maximumFractionDigits: digits,
					minimumFractionDigits: minimumFractionDigits
				})
				.replace(rx, '$1') + item.symbol
		: num.toLocaleString('en-US', {
				maximumFractionDigits: digits,
				minimumFractionDigits: minimumFractionDigits
			});
}

export function formatTimeDifference(unixTimestamp: number) {
	if (!unixTimestamp) return '';

	// Get the current time in milliseconds
	const now = Date.now();

	// Calculate the difference in milliseconds
	const diffMs = Math.abs(now - unixTimestamp);

	// Calculate minutes, seconds, and milliseconds
	const minutes = Math.floor(diffMs / 60000);
	const seconds = Math.floor((diffMs % 60000) / 1000);
	const milliseconds = diffMs % 1000;

	// Format minutes and seconds to always have two digits
	const formattedMinutes = String(minutes).padStart(2, '0');
	const formattedSeconds = String(seconds).padStart(2, '0');
	const formattedMilliseconds = String(milliseconds).padStart(2, '0').substring(0, 2);

	// Return the formatted time difference
	return `${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
}

export async function fetchAddressBook() {
	try {
		const PAGE_SIZE = 300;
		const newAddressBook = new Map();
		let offset = 0;
		let hasMore = true;

		while (hasMore) {
			const response = await fetch(
				`https://api.ergexplorer.com/addressbook/getAddresses?offset=${offset}&limit=${PAGE_SIZE}&type=all&order=nameAsc&testnet=0`
			);
			const data = await response.json();

			if (!data || !data.items || data.items.length === 0) {
				hasMore = false;
				continue;
			}

			data.items.forEach(
				(item: { address: unknown; name: unknown; type: unknown; urltype: unknown }) => {
					newAddressBook.set(item.address, {
						name: item.name,
						type: item.type,
						urltype: item.urltype
					});
				}
			);

			if (data.items.length < PAGE_SIZE) {
				hasMore = false;
			}

			offset += PAGE_SIZE;
		}

		addressBook.set(newAddressBook);

		console.log('📖 Address book loaded with', newAddressBook.size, 'entries');
	} catch (error) {
		console.error('Error fetching address book:', error);
	}
}
