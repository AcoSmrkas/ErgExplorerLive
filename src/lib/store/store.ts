import type { Socket } from 'socket.io-client';
import { writable, type Writable } from 'svelte/store';
import type { MempoolTx } from '$lib/common/mempool';

export const ready: Writable<boolean> = writable(false);
export const socket: Writable<Socket> = writable();
export const lastBlockInfo: Writable<{
	timestamp: number;
}> = writable();
export const nodeInfo: Writable<{
	fullHeight: number;
	bestFullHeaderId: string;
}> = writable();
export const mempoolTxCount: Writable<number> = writable(0);
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
