import BigNumber from 'bignumber.js';
import { ERGEXPLORER_API } from '$lib/common/const';
import type { MempoolTx } from '$lib/common/mempool';
import { ergUsd, tokenPrices } from '$lib/store/store';

// A token's price only counts with at least this much ERG in its pools; a thin pool's
// price is easy to push around and would swamp the total.
const MIN_LIQUIDITY_ERG = 1000;
const REFRESH_MS = 5 * 60_000;

async function getJson(path: string) {
	const res = await fetch(`${ERGEXPLORER_API}${path}`, { signal: AbortSignal.timeout(15000) });
	if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
	return res.json();
}

async function refresh() {
	try {
		const [erg, tokens] = await Promise.all([
			getJson('tokens/getErgPrice'),
			getJson('tokens/getTokenPrices')
		]);

		const usd = Number(erg?.items?.[0]?.value);
		if (Number.isFinite(usd) && usd > 0) ergUsd.set(usd);

		const prices = new Map<string, { priceErg: number; decimals: number }>();
		for (const token of tokens?.items ?? []) {
			if (token.liquidity_erg >= MIN_LIQUIDITY_ERG && token.price_erg > 0) {
				prices.set(token.id, { priceErg: token.price_erg, decimals: token.decimals });
			}
		}
		tokenPrices.set(prices);
	} catch (error) {
		// The ERG total still shows; dollars come back with the next refresh.
		console.error('Price lookup failed:', error);
	}
}

/** ERG/USD and token prices from ErgExplorer's API, refreshed every five minutes. */
export function loadPrices() {
	refresh();
	setInterval(refresh, REFRESH_MS);
}

/**
 * What txs send to other addresses: ERG, plus the tokens that have a price (valued in
 * ERG). Minted and burned tokens aren't moved, so they don't count.
 */
export function valueMoved(
	txs: MempoolTx[],
	prices: Map<string, { priceErg: number; decimals: number }>,
	usdPerErg: number | null
) {
	let erg = new BigNumber(0);
	let tokenErg = 0;
	let tokens = 0;

	for (const tx of txs) {
		for (const t of tx.transfers) {
			if (t.tokenId === 'ERG') {
				erg = erg.plus(t.amount);
				continue;
			}

			const price = prices.get(t.tokenId);
			if (!price || t.amount.isZero()) continue;

			tokenErg += t.amount.div(10 ** price.decimals).toNumber() * price.priceErg;
			tokens++;
		}
	}

	const ergMoved = erg.div(1e9).toNumber();
	return {
		erg: ergMoved,
		tokens,
		usd: usdPerErg === null ? null : (ergMoved + tokenErg) * usdPerErg
	};
}
