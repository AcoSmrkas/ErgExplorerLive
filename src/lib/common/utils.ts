import axios from 'axios';
import { get } from 'svelte/store';
import { EXPLORER_API, ERGEXPLORER_API } from '$lib/common/const';
import { mempoolTxs, tempBoxData, assetInfos, fetchingAssetData } from '$lib/store/store';
import { ErgoAddress } from '@fleet-sdk/core';

export async function getAssetInfos(ids: Array<string>) {
	const assets = get(assetInfos) as { [key: string]: unknown };
	const assetIds = Object.keys(assets as object);

	ids = ids.filter((id) => !assetIds.includes(id));

	if (ids.length == 0) return;

	fetchingAssetData.set(true);

	const response = await axios.post(`${ERGEXPLORER_API}tokens/byId`, { ids: ids });

	fetchingAssetData.set(false);

	const newData = response.data.items;

	for (const data of newData) {
		assets[data.id] = data;
	}

	assetInfos.set(assets);
}

export function collectTokenIds(transactions) {
	const tokenIds = new Set();

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

export function cleanupTempBoxData() {
	const currentBoxData = get(tempBoxData) as unknown as { [key: string]: unknown };
	const currentTransactions = get(mempoolTxs);

	const keys = Object.keys(currentBoxData);
	for (let i = keys.length - 1; i >= 0; i--) {
		const boxData = currentBoxData[i] as { boxId: string; tranactionId: string };

		if (
			!(currentTransactions as { id: string }[]).find((item) => item.id === boxData.tranactionId)
		) {
			delete currentBoxData[boxData.boxId];
		}
	}
}

export function getBoxDataById(boxId: string) {
	const currentBoxData = get(tempBoxData) as unknown as { [key: string]: unknown };

	if (currentBoxData[boxId] !== undefined) {
		return currentBoxData[boxId];
	}

	const txs = get(mempoolTxs);

	let box = null;

	for (const mTx of txs as { outputs: { boxId: string }[] }[]) {
		const outputs = mTx.outputs;
		for (const o of outputs) {
			if (o.boxId == boxId) {
				box = o;
			}
		}
	}

	return box;
}

export async function resolveBoxById(boxId: string) {
	const currentBoxData = get(tempBoxData) as unknown as { [key: string]: unknown };
	let box = null;

	try {
		console.log('Fetching data for box', boxId);
		const boxData = await axios.get(`${EXPLORER_API}boxes/${boxId}`);

		if (boxData.data) {
			box = boxData.data;
		}
	} catch {
		box = null;
	}

	if (box !== null) {
		currentBoxData[box.boxId] = box;

		tempBoxData.set(currentBoxData);
	}

	return box;
}

export function ergoTreeToAddress(ergoTree: string) {
	return ErgoAddress.fromErgoTree(ergoTree).toString();
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
