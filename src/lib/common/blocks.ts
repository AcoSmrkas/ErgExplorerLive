import { get } from 'svelte/store';
import { EXPLORER_URLS, NODE_URLS } from '$lib/common/const';
import { refreshLithosHeights } from '$lib/common/lithos';
import type { RawTx } from '$lib/common/mempool';
import { nodeInfo, recentBlocks, type Block } from '$lib/store/store';

// Enough to fill the chain bar on a wide screen; scrolling back loads more, a page at a time.
const LIMIT = 16;
// Blocks kept once scrolled back, so a long scroll doesn't grow the bar without end.
const MAX_BLOCKS = 500;

/** Keeps the blocks older than the fresh page, so a refresh doesn't drop what was scrolled back to. */
function merge(fresh: Block[], kept: Block[]) {
	const oldest = fresh[fresh.length - 1]?.height ?? Infinity;
	return [...fresh, ...kept.filter((block) => block.height < oldest)].slice(0, MAX_BLOCKS);
}

/**
 * The latest blocks, for the chain bar. An explorer can be a block behind our node, so
 * when it doesn't have the block the node just announced yet, it is asked again shortly.
 */
export async function refreshBlocks(height: number, attempt = 0) {
	for (const base of EXPLORER_URLS) {
		try {
			const res = await fetch(`${base}/api/v1/blocks?limit=${LIMIT}`, {
				signal: AbortSignal.timeout(6000)
			});
			if (!res.ok) continue;

			const items: Block[] = (await res.json()).items;
			const newest = items[0]?.height ?? 0;

			// An answer that arrives after a newer one doesn't roll the bar back.
			if (newest >= (get(recentBlocks)[0]?.height ?? 0)) {
				const blocks = merge(items, get(recentBlocks));
				recentBlocks.set(blocks);
				void refreshLithosHeights(blocks[blocks.length - 1]?.height ?? newest);
			}

			if (newest < height && attempt < 3) {
				setTimeout(() => refreshBlocks(height, attempt + 1), 4000);
			}

			return;
		} catch {
			// Try the next explorer.
		}
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

			const merged = [...current, ...older].slice(0, MAX_BLOCKS);
			recentBlocks.set(merged);
			void refreshLithosHeights(merged[merged.length - 1].height);
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
