import { NODE_URLS } from '$lib/common/const';

/**
 * When a block was mined, from its header. Never later than now, so a miner clock
 * running ahead doesn't make the "time since last block" count down. Now when no
 * node answers.
 */
export async function getBlockTimestamp(headerId: string): Promise<number> {
	for (const base of NODE_URLS) {
		try {
			const res = await fetch(`${base}/blocks/${headerId}/header`, {
				signal: AbortSignal.timeout(5000)
			});
			if (!res.ok) continue;

			const header = await res.json();
			if (Number.isFinite(header?.timestamp)) return Math.min(header.timestamp, Date.now());
		} catch {
			// Try the next node.
		}
	}

	return Date.now();
}
