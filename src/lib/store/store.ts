import type { Socket } from 'socket.io-client';
import { readable, writable, type Writable } from 'svelte/store';
import type { MempoolTx } from '$lib/common/mempool';

export type Block = {
	id: string;
	height: number;
	timestamp: number;
	transactionsCount: number;
	miner: { address: string; name: string };
};

export const socket: Writable<Socket> = writable();
export const connected: Writable<boolean> = writable(false);
/** The label group the grid shows only, or null for every tx. */
export const labelFilter: Writable<string | null> = writable(null);
export const ready: Writable<boolean> = writable(false);
export const lastBlockInfo: Writable<{
	timestamp: number;
}> = writable();
export const nodeInfo: Writable<{
	fullHeight: number;
	bestFullHeaderId: string;
}> = writable();
export const recentBlocks: Writable<Block[]> = writable([]);
export const mempoolTxCount: Writable<number> = writable(0);
/** nanoERG the pending txs pay in miner fees. */
export const mempoolFees: Writable<number> = writable(0);
/** Dollars per ERG, once known. */
export const ergUsd: Writable<number | null> = writable(null);
/** Price in ERG of one whole token, for tokens with real liquidity. */
export const tokenPrices: Writable<Map<string, { priceErg: number; decimals: number }>> = writable(
	new Map()
);
export const mempoolTxs: Writable<MempoolTx[]> = writable([]);
export const assetInfos: Writable<unknown> = writable({
	ERG: {
		id: 'ERG',
		tokenId: 'ERG',
		name: 'ERG',
		iconurl: 'https://ergexplorer.com/images/logo-new.png',
		decimals: 9
	}
});
export const addressBook: Writable<Map<string, { name: string; type: string; urltype: string }>> =
	writable(new Map());

/** The current time, ticking every second, for every "ago" and timer on the page. */
export const now = readable(Date.now(), (set) => {
	const timer = setInterval(() => set(Date.now()), 1000);
	return () => clearInterval(timer);
});
