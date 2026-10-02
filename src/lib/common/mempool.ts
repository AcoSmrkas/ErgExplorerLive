import { get } from 'svelte/store';
import { SOCKET_URL } from '$lib/common/const';
import {
	collectTokenIds,
	ergoTreeToAddress,
	getAssetInfos,
	trackNetAssetTransfers,
	type Transfer
} from '$lib/common/utils';
import { mempoolTxCount, mempoolTxs, nodeInfo, ready } from '$lib/store/store';

export type Box = {
	boxId: string;
	value: number;
	ergoTree?: string;
	address?: string;
	assets?: { tokenId: string; amount: number }[];
	additionalRegisters?: Record<string, string>;
	creationHeight?: number;
	spendingProof?: { proofBytes: string | null; extension?: Record<string, string> };
};

/** A tx as the socket sends it: the node's pool entry, inputs resolved where the node could. */
export type RawTx = { id: string; inputs: Box[]; outputs: Box[] };

export type MempoolTx = {
	id: string;
	inputs: Box[];
	outputs: Box[];
	/** Net movement of ERG and each token, without the zero ones. */
	transfers: Transfer[];
	/** Spends a box that went unspent for four years, claiming its storage rent. */
	storageRent: boolean;
};

// The socket sends at most the node's first page of the pool.
const BROADCAST_LIMIT = 50;

// A box unspent for this many blocks (four years) may be spent by anyone, who takes
// the storage rent from it and recreates the rest.
const STORAGE_PERIOD = 1_051_200;

// Each tx is built once: nothing about it changes while it is pending.
const built = new Map<string, MempoolTx>();

let pending: RawTx[] | null = null;
let running = false;

/**
 * Takes a snapshot of the pool from the socket. Snapshots that arrive while one is
 * being applied replace each other, and only the newest is applied next.
 */
export function onMempool(txs: RawTx[]) {
	pending = txs;
	if (!running) void drain();
}

async function drain() {
	running = true;
	while (pending) {
		const txs = pending;
		pending = null;
		try {
			await apply(txs);
		} catch (error) {
			console.error('Mempool update failed:', error);
		}
	}
	running = false;
}

async function apply(txs: RawTx[]) {
	// The node resolves every input of a live tx, from the UTXO set or another pending
	// tx. One it can't resolve was spent by a block since, so the tx will never confirm
	// and waits for the node's cleanup. mempool-socket's API and ErgExplorer hide these too.
	const live = txs.filter((tx) => tx.inputs.every((input) => input.ergoTree));

	const fresh = live.filter((tx) => !built.has(tx.id)).map(build);
	// Token names, decimals and icons, before the new tiles render.
	await getAssetInfos(collectTokenIds(fresh));
	for (const tx of fresh) built.set(tx.id, tx);

	const liveIds = new Set(live.map((tx) => tx.id));
	for (const id of built.keys()) {
		if (!liveIds.has(id)) built.delete(id);
	}

	// Tiles already on screen keep their place, and new ones go at the end.
	const shown = get(mempoolTxs).filter((tx) => liveIds.has(tx.id));
	const shownIds = new Set(shown.map((tx) => tx.id));
	const added = live.filter((tx) => !shownIds.has(tx.id)).map((tx) => built.get(tx.id)!);

	mempoolTxs.set([...shown, ...added]);
	mempoolTxCount.set(live.length);
	ready.set(true);

	if (txs.length >= BROADCAST_LIMIT) void fetchPoolSize();
}

function build(tx: RawTx): MempoolTx {
	const resolve = (box: Box): Box => ({
		boxId: box.boxId,
		value: box.value,
		ergoTree: box.ergoTree,
		address: ergoTreeToAddress(box.ergoTree!),
		assets: box.assets,
		additionalRegisters: box.additionalRegisters
	});

	const resolved = { id: tx.id, inputs: tx.inputs.map(resolve), outputs: tx.outputs.map(resolve) };
	const transfers = Object.values(trackNetAssetTransfers(resolved)).filter(
		(t) => !t.amount.isZero() || !t.minted.isZero() || !t.burned.isZero()
	);

	return { ...resolved, transfers, storageRent: tx.inputs.some(isStorageRentSpend) };
}

/**
 * The rent path: no proof, and context variable #127 naming the output that
 * recreates the box. The tx goes in the next block, so the age is counted from it.
 */
function isStorageRentSpend(input: Box) {
	const height = (get(nodeInfo)?.fullHeight ?? Infinity) + 1;

	return (
		!input.spendingProof?.proofBytes &&
		input.spendingProof?.extension?.['127'] !== undefined &&
		height - (input.creationHeight ?? Infinity) >= STORAGE_PERIOD
	);
}

/**
 * The broadcast stops at the node's first page, so a full pool would always read 50.
 * mempool-socket's API counts the whole pool, leaving out dead txs as above.
 */
async function fetchPoolSize() {
	try {
		const res = await fetch(`${SOCKET_URL}/api/v1/mempool/stats`, {
			signal: AbortSignal.timeout(5000)
		});
		const { transactions } = await res.json();
		if (Number.isFinite(transactions)) {
			mempoolTxCount.set(Math.max(transactions, get(mempoolTxs).length));
		}
	} catch {
		// Keep the count of what is shown.
	}
}
