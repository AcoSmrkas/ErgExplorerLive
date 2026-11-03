import { ErgoAddress, Network } from '@fleet-sdk/core';
import { get } from 'svelte/store';
import { EXPLORER_URLS, NODE_URLS } from '$lib/common/const';
import { refreshLithosHeights } from '$lib/common/lithos';
import type { RawTx } from '$lib/common/mempool';
import { nodeInfo, recentBlocks, type Block } from '$lib/store/store';

// Enough to fill the chain bar on a wide screen; scrolling back loads more, a page at a time.
const LIMIT = 16;
// Blocks kept once scrolled back, so a long scroll doesn't grow the bar without end.
const MAX_BLOCKS = 500;

/**
 * Puts blocks into the chain bar by height, newest first: a block replaces the one it
 * has at that height and the rest stay, so neither a late answer nor a page that stops
 * below the node's tip drops a block.
 */
function addBlocks(incoming: Block[]) {
	if (incoming.length === 0) return;

	recentBlocks.update((current) => {
		const byHeight = new Map(current.map((block) => [block.height, block]));
		for (const block of incoming) byHeight.set(block.height, block);
		return [...byHeight.values()].sort((a, b) => b.height - a.height).slice(0, MAX_BLOCKS);
	});

	const blocks = get(recentBlocks);
	void refreshLithosHeights(blocks[blocks.length - 1].height);
}

/** Heights from the tip down to the oldest block in the bar that it has no block for. */
function missingHeights(tip: number) {
	const blocks = get(recentBlocks);
	const have = new Set(blocks.map((block) => block.height));
	const oldest = blocks[blocks.length - 1]?.height ?? tip - LIMIT + 1;
	const missing: number[] = [];

	for (let height = tip; height >= oldest && missing.length < LIMIT; height--) {
		if (!have.has(height)) missing.push(height);
	}

	return missing;
}

/** The newest page of blocks from the first explorer that answers, or null. */
async function latestFromExplorer(): Promise<Block[] | null> {
	for (const base of EXPLORER_URLS) {
		try {
			const res = await fetch(`${base}/api/v1/blocks?limit=${LIMIT}`, {
				signal: AbortSignal.timeout(6000)
			});
			if (res.ok) return (await res.json()).items;
		} catch {
			// Try the next explorer.
		}
	}

	return null;
}

/** A block as the chain bar shows it, built from a node, or null when no node has it. */
async function blockFromNode(height: number): Promise<Block | null> {
	for (const base of NODE_URLS) {
		try {
			const options = { signal: AbortSignal.timeout(6000) };

			const ids: string[] = await (await fetch(`${base}/blocks/at/${height}`, options)).json();
			if (ids.length === 0) continue;

			const [header, body] = await Promise.all(
				['header', 'transactions'].map(async (part) => {
					const res = await fetch(`${base}/blocks/${ids[0]}/${part}`, options);
					if (!res.ok) throw new Error(`HTTP ${res.status}`);
					return res.json();
				})
			);

			const address = ErgoAddress.fromPublicKey(header.powSolutions.pk, Network.Mainnet).toString();

			return {
				id: header.id,
				height: header.height,
				timestamp: header.timestamp,
				transactionsCount: body.transactions.length,
				// The explorer names a miner it doesn't know by the end of its address.
				miner: { address, name: address.slice(-8) }
			};
		} catch {
			// Try the next node.
		}
	}

	return null;
}

/**
 * The latest blocks, for the chain bar. An explorer can be blocks behind our node, so
 * the blocks it doesn't have yet are read from the node, and it is asked again later.
 */
export async function refreshBlocks(height: number, attempt = 0) {
	// A newer block came in since: its refresh covers this one too.
	if ((get(nodeInfo)?.fullHeight ?? height) > height) return;

	const page = await latestFromExplorer();
	if (page) addBlocks(page);

	const missing = missingHeights(height);
	if (missing.length === 0) return;

	addBlocks((await Promise.all(missing.map(blockFromNode))).filter((block) => block !== null));

	if (missingHeights(height).length > 0 && attempt < 6) {
		setTimeout(() => refreshBlocks(height, attempt + 1), 5000);
	}
}

/**
 * The page of blocks before the oldest one in the chain bar. Resolves false when there is
 * nothing older to load (genesis reached, or every explorer failed).
 */
export async function loadOlderBlocks(): Promise<boolean> {
	const blocks = get(recentBlocks);
	const oldest = blocks[blocks.length - 1]?.height;
	if (!oldest || oldest <= 1 || blocks.length >= MAX_BLOCKS) return false;

	// The explorer pages back from its newest block, normally ours. One block of overlap
	// (filtered out below) leaves no gap when the explorer is a block behind.
	const offset = blocks[0].height - oldest;

	for (const base of EXPLORER_URLS) {
		try {
			const res = await fetch(`${base}/api/v1/blocks?offset=${offset}&limit=${LIMIT}`, {
				signal: AbortSignal.timeout(6000)
			});
			if (!res.ok) continue;

			const current = get(recentBlocks);
			const before = current[current.length - 1]?.height ?? oldest;
			const older = ((await res.json()).items as Block[]).filter((block) => block.height < before);
			if (older.length === 0) return false;

			addBlocks(older);
			return true;
		} catch {
			// Try the next explorer.
		}
	}

	return false;
}

export type BlockHeader = {
	id: string;
	parentId: string;
	height: number;
	timestamp: number;
};

/**
 * A block with every tx in it, each input carrying its full box, from an indexed
 * node: the same shape the socket sends for pending txs. null when no node has a
 * block at that height, i.e. it hasn't been mined yet.
 */
export async function fetchBlock(
	height: number
): Promise<{ header: BlockHeader; transactions: RawTx[] } | null> {
	const tip = get(nodeInfo)?.fullHeight;
	if (tip && height > tip) return null;

	let lastError: unknown = null;

	for (const base of NODE_URLS) {
		try {
			const options = { signal: AbortSignal.timeout(15000) };

			const ids: string[] = await (await fetch(`${base}/blocks/at/${height}`, options)).json();
			// Our node started from a snapshot and has no old blocks: ask the next one.
			if (ids.length === 0) continue;

			// The first id is the block on the best chain.
			const res = await fetch(`${base}/blockchain/block/byHeaderId/${ids[0]}`, options);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);

			return await res.json();
		} catch (error) {
			// Try the next node.
			lastError = error;
		}
	}

	if (lastError) throw lastError;
	return null;
}
