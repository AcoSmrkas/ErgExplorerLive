import { get } from 'svelte/store';
import { io } from 'socket.io-client';
import { socket, nodeInfo, mempoolTxs } from '$lib/store/store';
import { SOCKET_URL } from '$lib/common/const';
import { getAssetInfos, collectTokenIds } from '$lib/common/utils';
import { fetchingAssetData } from '$lib/store/store';

export function initSocket() {
	if (get(socket) !== undefined) return;

	const newSocket = io(SOCKET_URL);

	newSocket?.on('connect', () => {
		console.log('Connected to server at', SOCKET_URL);
	});

	newSocket?.on('connect_error', (error) => {
		console.error('Connection error:', error);
	});

	newSocket?.on('info', (info) => {
		nodeInfo.set(info);
	});

	newSocket?.on('mempoolTxs', async (transactions: { id: string }[]) => {
		const isFetchingAssetData = get(fetchingAssetData);

		if (isFetchingAssetData) {
			return;
		}

		const currentMempoolTxs: { id: string }[] = get(mempoolTxs) as { id: string }[];

		const currentTxIds = new Set(currentMempoolTxs.map((tx) => tx.id));
		const newTxIds = new Set(transactions.map((tx) => tx.id));

		const existingTxs = currentMempoolTxs.filter((tx) => newTxIds.has(tx.id));
		const newTxs = transactions.filter((tx) => !currentTxIds.has(tx.id));

		const allAssetIds = collectTokenIds(newTxs);

		await getAssetInfos(allAssetIds);

		mempoolTxs.set([...existingTxs, ...newTxs]);
	});

	newSocket?.onAny(() => {
		socket.set(newSocket);
	});

	socket.set(newSocket);
}
