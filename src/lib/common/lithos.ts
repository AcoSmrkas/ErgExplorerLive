import { writable, type Writable } from 'svelte/store';
import { EXPLORER_URLS } from '$lib/common/const';

// Lithos, the mining pool run by contracts: a block becomes a Lithos block by spending a
// lender's collateral box, and each one leaves a proof-of-spend box at its own height,
// under the queue contract with one collateral token and nothing but R4.
const QUEUE_TREE =
	'1b3903040004000e201ddb641b785e9ac9baf455f64932295e48cbbf4aadc9645f74065d58d09cdc47d1938cb2db6308b2a4730000730100017302';
const COLLATERAL_TOKEN = 'a8a790e784e93ac0e68649181ae3d251e84fb5c741624100e7e945ae1e82dc98';

// The explorer's box search indexes contracts by the SHA-256 of their template.
const QUEUE_TEMPLATE_HASH = 'db686aa7db208ce69f0088e66b731e3cd16a0f58332ccaad9b67bcb0555ea98d';

type SearchedBox = {
	ergoTree: string;
	settlementHeight: number;
	assets: { tokenId: string; amount: number }[];
	additionalRegisters: Record<string, unknown>;
};

/** Heights of recent Lithos blocks, for the chain bar. */
export const lithosHeights: Writable<Set<number>> = writable(new Set());

const isProofOfSpend = (box: SearchedBox) =>
	box.ergoTree === QUEUE_TREE &&
	box.assets.length === 1 &&
	box.assets[0].tokenId === COLLATERAL_TOKEN &&
	Number(box.assets[0].amount) === 1 &&
	Object.keys(box.additionalRegisters ?? {}).join() === 'R4';

/**
 * Finds the Lithos blocks from minHeight up. The search lists matches oldest first
 * whatever order is asked for, so the newest are read from the end: one request for
 * the count, one for the last page.
 */
export async function refreshLithosHeights(minHeight: number) {
	const body = JSON.stringify({
		ergoTreeTemplateHash: QUEUE_TEMPLATE_HASH,
		assets: [COLLATERAL_TOKEN]
	});

	for (const base of EXPLORER_URLS) {
		try {
			const search = async (offset: number, limit: number) => {
				const res = await fetch(
					`${base}/api/v1/boxes/search?offset=${offset}&limit=${limit}`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body,
						signal: AbortSignal.timeout(6000)
					}
				);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				return (await res.json()) as { items: SearchedBox[]; total: number };
			};

			const { total } = await search(0, 1);
			const start = Math.max(0, total - 100);
			const { items } = total > 0 ? await search(start, total - start) : { items: [] };

			lithosHeights.set(
				new Set(
					items
						.filter((box) => isProofOfSpend(box) && box.settlementHeight >= minHeight)
						.map((box) => box.settlementHeight)
				)
			);

			return;
		} catch {
			// Try the next explorer.
		}
	}
}
