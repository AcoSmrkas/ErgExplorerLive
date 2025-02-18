import { get } from 'svelte/store';
import { io } from 'socket.io-client';
import { socket, nodeInfo, mempoolTxs } from '$lib/store/store';
import { SOCKET_URL } from '$lib/common/const';

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

	newSocket?.on('mempoolTxs', (transactions) => {
		mempoolTxs.set(transactions);
	});

	newSocket?.onAny(() => {
		socket.set(newSocket);
	});

	socket.set(newSocket);
}
