import type { Socket } from 'socket.io-client';
import { writable, type Writable } from 'svelte/store';

export const socket: Writable<Socket> = writable();
export const nodeInfo: Writable<unknown> = writable();
export const mempoolTxs: Writable<Array<unknown>> = writable([]);
export const tempBoxData: Writable<unknown> = writable({});
