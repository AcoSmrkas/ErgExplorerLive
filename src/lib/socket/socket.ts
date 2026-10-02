import { get } from 'svelte/store';
import { io } from 'socket.io-client';
import { socket, nodeInfo, lastBlockInfo, connected } from '$lib/store/store';
import { SOCKET_URL } from '$lib/common/const';
import { getBlockTimestamp } from '$lib/common/chain';
import { refreshBlocks } from '$lib/common/blocks';
import { onMempool } from '$lib/common/mempool';

export function initSocket() {
	if (get(socket) !== undefined) return;

	const newSocket = io(SOCKET_URL);

	newSocket?.on('connect', () => {
		console.log('Connected to server at', SOCKET_URL);
		connected.set(true);
	});

	newSocket?.on('disconnect', () => {
		connected.set(false);
	});

	newSocket?.on('connect_error', (error) => {
		console.error('Connection error:', error);
	});

	newSocket?.on('info', async (info) => {
		const lastInfo = get(nodeInfo);

		nodeInfo.set(info);

		if (!lastInfo || info.fullHeight > lastInfo.fullHeight) {
			refreshBlocks(info.fullHeight);

			const timestamp = await getBlockTimestamp(info.bestFullHeaderId);

			// A newer block may have come in while this one's header was fetched.
			if (get(nodeInfo).bestFullHeaderId === info.bestFullHeaderId) {
				lastBlockInfo.set({ timestamp });
			}
		}
	});

	newSocket?.on('mempoolTxs', onMempool);

	newSocket?.onAny(() => {
		socket.set(newSocket);
	});

	socket.set(newSocket);
}
