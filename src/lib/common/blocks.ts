import { get } from 'svelte/store';
import { EXPLORER_URLS } from '$lib/common/const';
import { recentBlocks, type Block } from '$lib/store/store';

// Enough to fill the chain bar on a wide screen.
const LIMIT = 16;

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
			if (newest >= (get(recentBlocks)[0]?.height ?? 0)) recentBlocks.set(items);

			if (newest < height && attempt < 3) {
				setTimeout(() => refreshBlocks(height, attempt + 1), 4000);
			}

			return;
		} catch {
			// Try the next explorer.
		}
	}
}
