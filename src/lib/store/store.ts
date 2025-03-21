import type { Socket } from 'socket.io-client';
import { writable, type Writable } from 'svelte/store';

export const ready: Writable<boolean> = writable(false);
export const socket: Writable<Socket> = writable();
export const lastBlockInfo: Writable<unknown> = writable();
export const nodeInfo: Writable<unknown> = writable();
export const mempoolTxCount: Writable<number> = writable(0);
export const mempoolTxs: Writable<Array<unknown>> = writable([]);
export const tempBoxData: Writable<unknown> = writable({});
export const assetInfos: Writable<unknown> = writable({
	ERG: {
		id: 'ERG',
		tokenId: 'ERG',
		name: 'ERG',
		iconurl: 'https://ergexplorer.com/images/logo-new.png',
		decimals: 9
	}
});
export const fetchingAssetData: Writable<boolean> = writable(false);
export const fetchingBoxData: Writable<boolean> = writable(false);
export const addressBook: Writable<Map<unknown, unknown>> = writable(new Map());
