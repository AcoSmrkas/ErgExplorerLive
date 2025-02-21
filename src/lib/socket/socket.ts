import { get } from 'svelte/store';
import { io } from 'socket.io-client';
import { socket, nodeInfo, mempoolTxs, mempoolTxCount, ready } from '$lib/store/store';
import { SOCKET_URL } from '$lib/common/const';
import { getAssetInfos, getBoxInfos, collectTokenIds, resolveTxBoxes } from '$lib/common/utils';
import { fetchingAssetData, fetchingBoxData } from '$lib/store/store';

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

	newSocket?.on(
		'mempoolTxs',
		async (
			transactions: {
				id: string;
				inputs?: {
					boxId: string;
					assets?: { tokenId: string }[];
				}[];
				outputs?: {
					boxId: string;
					assets?: { tokenId: string }[];
				}[];
			}[]
		) => {
			console.log('Socket on', 'mempoolTxs');

			const isFetchingAssetData = get(fetchingAssetData);
			const isFetchingBoxData = get(fetchingBoxData);

			if (isFetchingAssetData || isFetchingBoxData) {
				return;
			}

			const currentMempoolTxs: { id: string }[] = get(mempoolTxs) as { id: string }[];

			const currentTxIds = new Set(currentMempoolTxs.map((tx) => tx.id));
			const newTxIds = new Set(transactions.map((tx) => tx.id));

			const existingTxs = currentMempoolTxs.filter((tx) => newTxIds.has(tx.id));
			const newTxs = transactions.filter((tx) => !currentTxIds.has(tx.id));

			const allTxs = [...existingTxs, ...newTxs];

			mempoolTxCount.set(allTxs.length);

			const allBoxIds = newTxs.flatMap((transaction) => {
				const inputBoxIds = transaction.inputs?.map((input) => input.boxId) || [];
				const outputBoxIds = transaction.outputs?.map((output) => output.boxId) || [];

				return [...inputBoxIds, ...outputBoxIds];
			});

			await getBoxInfos(allBoxIds, transactions);

			for (let i = 0; i < newTxs.length; i++) {
				newTxs[i] = await resolveTxBoxes(newTxs[i]);
			}

			const allAssetIds: string[] = collectTokenIds(newTxs);
			await getAssetInfos(allAssetIds);

			ready.set(true);

			mempoolTxs.set(allTxs);
		}
	);

	newSocket?.onAny(() => {
		socket.set(newSocket);
	});

	socket.set(newSocket);
}
