import BigNumber from 'bignumber.js';
import { get } from 'svelte/store';
import { FEE_ADDRESS, SOCKET_URL } from '$lib/common/const';
import {
	collectTokenIds,
	ergoTreeToAddress,
	getAssetInfos,
	trackNetAssetTransfers,
	type Transfer
} from '$lib/common/utils';
import { mempoolFees, mempoolTxCount, mempoolTxs, nodeInfo, ready } from '$lib/store/store';

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
	/** nanoERG paid to the miner. */
	fee: number;
	/** Spends a box that went unspent for four years, claiming its storage rent. */
	storageRent: boolean;
	/** Who paid: see parties(). */
	from: Box | 'multiple';
	/** Who got paid: see parties(). */
	to: Box | 'multiple' | 'itself';
	/** Arrived after the page loaded, rather than in the first snapshot. */
	fresh: boolean;
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
let applied = false;

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

	// The tx goes in the next block, so storage rent is counted from it.
	const height = (get(nodeInfo)?.fullHeight ?? Infinity) + 1;
	const fresh = live.filter((tx) => !built.has(tx.id)).map((tx) => buildTx(tx, height, applied));
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
	mempoolFees.set(live.reduce((sum, tx) => sum + built.get(tx.id)!.fee, 0));
	ready.set(true);
	applied = true;

	if (txs.length >= BROADCAST_LIMIT) void fetchPoolSize();
}

/** A tx as the cards show it, pending or in a block of the given height. */
export function buildTx(tx: RawTx, height: number, fresh = false): MempoolTx {
	const resolve = (box: Box): Box => ({
		boxId: box.boxId,
		value: box.value,
		ergoTree: box.ergoTree,
		address: ergoTreeToAddress(box.ergoTree!),
		assets: box.assets,
		additionalRegisters: box.additionalRegisters,
		// Inputs only: the context variables say which operation a contract box ran.
		spendingProof: box.spendingProof
	});

	const resolved = { id: tx.id, inputs: tx.inputs.map(resolve), outputs: tx.outputs.map(resolve) };
	const transfers = Object.values(trackNetAssetTransfers(resolved)).filter(
		(t) => !t.amount.isZero() || !t.minted.isZero() || !t.burned.isZero()
	);

	return {
		...resolved,
		transfers,
		fee: resolved.outputs
			.filter((box) => box.address === FEE_ADDRESS)
			.reduce((sum, box) => sum + Number(box.value), 0),
		storageRent: tx.inputs.some((input) => isStorageRentSpend(input, height)),
		...parties(resolved),
		fresh
	};
}

/**
 * Who paid and who got paid, from each address's net change in ERG and every token.
 * A sender's holdings only went down; a receiver's only went up. An address that went
 * both ways (a DEX pool, an oracle contract, a minter) is a go-between. The miner fee
 * is left out. Several of either read "multiple". With no sender, the first input
 * stands in. With no receiver, the go-between the sender dealt with does (an oracle
 * operator posting a datapoint pays the oracle), and failing that the tx paid itself.
 */
function parties(tx: { inputs: Box[]; outputs: Box[] }): Pick<MempoolTx, 'from' | 'to'> {
	const net = new Map<string, { box: Box; change: Map<string, BigNumber> }>();

	const add = (box: Box, sign: 1 | -1) => {
		if (box.address === FEE_ADDRESS) return;

		const entry = net.get(box.address!) ?? { box, change: new Map() };
		const move = (tokenId: string, amount: number) =>
			entry.change.set(
				tokenId,
				(entry.change.get(tokenId) ?? new BigNumber(0)).plus(new BigNumber(amount).times(sign))
			);

		move('ERG', box.value);
		for (const asset of box.assets ?? []) move(asset.tokenId, asset.amount);
		net.set(box.address!, entry);
	};

	tx.inputs.forEach((box) => add(box, -1));
	tx.outputs.forEach((box) => add(box, 1));

	const senders: Box[] = [];
	const receivers: Box[] = [];
	const goBetweens: Box[] = [];

	for (const { box, change } of net.values()) {
		const gave = [...change.values()].some((v) => v.isNegative());
		const got = [...change.values()].some((v) => v.isPositive());

		if (gave && got) goBetweens.push(box);
		else if (gave) senders.push(box);
		else if (got) receivers.push(box);
	}

	const from = senders.length > 1 ? 'multiple' : (senders[0] ?? tx.inputs[0]);
	const fromAddress = typeof from === 'string' ? undefined : from.address;
	const others = goBetweens.filter((box) => box.address !== fromAddress);
	const pick = (boxes: Box[]) => (boxes.length > 1 ? 'multiple' : boxes[0]);

	return { from, to: pick(receivers) ?? pick(others) ?? 'itself' };
}

/**
 * The rent path: no proof, and context variable #127 naming the output that
 * recreates the box, at least four years after the box was created.
 */
function isStorageRentSpend(input: Box, height: number) {
	return (
		!input.spendingProof?.proofBytes &&
		input.spendingProof?.extension?.['127'] !== undefined &&
		height - (input.creationHeight ?? Infinity) >= STORAGE_PERIOD
	);
}

/**
 * The broadcast stops at the node's first page, so a full pool would always read 50.
 * mempool-socket's API counts the whole pool and its fees, leaving out dead txs as above.
 */
async function fetchPoolSize() {
	try {
		const res = await fetch(`${SOCKET_URL}/api/v1/mempool/stats`, {
			signal: AbortSignal.timeout(5000)
		});
		const { transactions, fees } = await res.json();
		if (Number.isFinite(transactions)) {
			mempoolTxCount.set(Math.max(transactions, get(mempoolTxs).length));
		}
		if (Number.isFinite(fees)) mempoolFees.update((shown) => Math.max(fees, shown));
	} catch {
		// Keep the count of what is shown.
	}
}
