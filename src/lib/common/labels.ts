import { EMISSION_ADDRESS, FEE_ADDRESS } from '$lib/common/const';
import type { ContractDetector } from '$lib/common/contracts';
import type { Box, MempoolTx } from '$lib/common/mempool';
import { shortAddress } from '$lib/common/utils';

export type AddressBook = Map<string, { name: string; type: string }>;
/** What a tx is shown as: its own name, and the group it is filtered and coloured by. */
export type Label = { label: string; group: string; color: string };

const GROUP_COLORS: { [group: string]: string } = {
	'Storage Rent': '#f43f5e',
	Transfers: '#8b8b94',
	'Mining pools': '#f59e0b',
	Exchanges: '#2dd4bf',
	Oracles: '#60a5fa',
	DEX: '#f472b6',
	Bridge: '#fb923c',
	Lending: '#4ade80',
	Mixer: '#a78bfa',
	Memes: '#e879f9',
	Services: '#c084fc',
	Contracts: '#818cf8'
};

// Matched against the name first, in this order.
const KEYWORD_GROUPS: [string, string][] = [
	['oracle', 'Oracles'],
	['sigusd', 'Oracles'],
	['dex', 'DEX'],
	['spectrum', 'DEX'],
	['crux', 'DEX'],
	['lithos', 'DEX'],
	['rosen', 'Bridge'],
	['duckpool', 'Lending'],
	['mixer', 'Mixer']
];

// Then by the address book's type.
const TYPE_GROUPS: { [type: string]: string } = {
	Exchange: 'Exchanges',
	'Mining pool': 'Mining pools',
	Meme: 'Memes',
	Service: 'Services',
	// Named by a contract template rather than by the address book
	Contract: 'Contracts',
	Transfer: 'Transfers',
	'Storage Rent': 'Storage Rent'
};

function labelled(label: string, type?: string): Label {
	const lower = label.toLowerCase();
	const group =
		KEYWORD_GROUPS.find(([key]) => lower.includes(key))?.[1] ??
		(type && TYPE_GROUPS[type]) ??
		'Services';

	return { label, group, color: GROUP_COLORS[group] };
}

const EXCLUDED_LABELS = ['Ergo Platform (Miner Fee)'];

// Txs that move one of these tokens (in and out, for the mixer) or touch one of these
// addresses get this label before anything else.
const SPECIAL = [
	{
		tokens: ['1a6a8c16e4b1cc9d73d03183565cfb8e79dd84198cb66beeed7d3463e0da2b98'],
		both: true,
		label: 'Mixer'
	},
	{
		addresses: [
			'AucEQEJ3Y5Uhmu4o8dsrHy28nRTgX5sVtXvjpMTqdMQzBR3uRVcvCFbv7SeGuPhQ16AXBP7XWdMShDdhRy4cayZgxHSkdAVuTiZRvj6WCfmhXJ4LY2E46CytRAnkiYubCdEroUUX2niMLhjNmDUn4KmXWSrKngrfGwHSaD8RJUMEp5AGADaChRU6kAnh9nstkDN3'
		],
		tokens: ['011d3364de07e5a26f0c4eef0852cddb387039a921b7154ef3cab22c6eda887f'],
		label: 'SigUSD Oracle'
	},
	{
		addresses: [
			'2Eit2LFRqu2Mo33z3pYTJRHNCNzNQ51TP2C7dZhBWYB7eCYDNpJy3gjXAJbr3fUtKaZLDQTSw4uZG5sgWWpTmbNQHKxjP2Z3zCqxhaJeLc6tHXQzBop9dHSvFaiGkFZj7RjMvrWnHHA79zpgvwYAKmeRRquAcJV2jsGc8Uvdf3gEpueLPUfRLKHwfqVZsyPheMWfgbUpLRP1zCZRrDRmz9DshmMD5VjxGHtvrWZwxGe3KYNZUis8pixkpMfXVggXJvc57Xig3RxZ3fT2AAuhYeGrzjH74dj44FtyCVa3veMXXDpimkL2qGQ7vnd1Uh6dw5z1KGmJUkbwtoBdq5m9Zcg1mrvTqhk2pE1MM1K4Ax7hgANjWmBXn2nx6cyxUyji1nPKzJdWxYCC7PhRdRqC9mfFxnNg8CJPsyFaTj2FxxAe1bDhL6QaQ9ac4tgUXfG5tKMukdzDJ4o3ibvwTxXffiA2V9kpHo2PNXGTVkvLS7TAqe9xNJN9sqqC9DXYJsTvEQsbbF3WUb8bcYuGk4K4ftdBWEiC6kNKFeqvn6D5uyD5Kf3G1diaPqVbxuoQ6qMEPXgRiRQB5ANJHBxB9HxX186JmKVkRbx3qxzar35aaStHzbzDjPvgvBjhkFcUVRg8DnuHpaXPw83z6FQDC9MCJAhGao4kQvgh7HtMufLZtuZjaMNnE8SVwm87yQBEh4NtyqTGvG'
		],
		tokens: ['34529f875cad2bf58c5ffb4a9056d26c590f0c35f77958a68dcdb4aa39b437aa'],
		label: 'Rosen Bridge Binance test'
	},
	{
		tokens: ['1d7857a82d2f3d00d58cbd3b6ad337c98b6aa5e1021a17deb7527e0c3c148be7'],
		label: 'Duckpools'
	},
	{
		tokens: ['272a4aeba6d1596ee0405b13fa223074077fd31f2d519fcd2f7b1656596db029'],
		label: 'Babel fee',
		type: 'Service'
	},
	{
		tokens: ['35f826497f8eadf5b46f768485cec175c35c11360b4821ea92bbbe855777b55c'],
		label: 'Duckpool rsADA'
	}
];

// Rosen Bridge boxes carry the wrapped token of the chain they bridge to.
const BRIDGE_TOKENS: { [tokenId: string]: string } = {
	'8a94d71b4a08058327fa8372aa69d95c337536c6577c31c8d994169a041e5fc0': 'Ergo',
	f5985c64c1aa8f08569dc77a046f65f92947abaa9ccd530aead033eece23496e: 'Ethereum',
	ddb335d2b4f3764ddeae8411a14bec97f94d0057628bb96f98da9d95e74d02bc: 'Cardano',
	'33477693d6be5bbd3a4cd786fbff5e6444449c191ab08e681aaaa87fc192772c': 'Binance',
	'30e4392fc439fce9948da124efddb8779fe179eef5a5d6196e249b75ee64defc': 'BTC'
};

const hasToken = (boxes: Box[], tokenId: string) =>
	boxes.some((box) => box.assets?.some((asset) => asset.tokenId === tokenId));

/**
 * The one label a tx is shown with: a block's own txs, storage rent, then the special
 * cases above, then the address book, then the contracts ErgExplorer knows by
 * template, then "Transfer".
 */
export function labelTx(
	tx: MempoolTx,
	book: AddressBook,
	detectContract: ContractDetector | null
): Label {
	// Every block opens with the miner's reward and usually ends with the miner
	// collecting the fees. Both only appear in blocks, never in the mempool.
	if (tx.inputs.some((box) => box.address === EMISSION_ADDRESS)) {
		return labelled('Block reward', 'Mining pool');
	}
	if (tx.inputs.every((box) => box.address === FEE_ADDRESS)) {
		return labelled('Miner fees', 'Mining pool');
	}

	if (tx.storageRent) return labelled('Storage Rent', 'Storage Rent');

	const boxes = [...tx.inputs, ...tx.outputs];

	for (const special of SPECIAL) {
		const byToken = special.tokens?.some((tokenId) =>
			special.both
				? hasToken(tx.inputs, tokenId) && hasToken(tx.outputs, tokenId)
				: hasToken(boxes, tokenId)
		);
		const byAddress = special.addresses?.some((address) =>
			boxes.some((box) => box.address === address)
		);

		if (byToken || byAddress) return labelled(special.label, special.type);
	}

	// A Sky Harbor listing: an output to its address carrying a price in R4.
	const skyHarbor = tx.outputs.some(
		(box) => book.get(box.address!)?.name === 'Sky Harbor' && box.additionalRegisters?.R4
	);
	if (skyHarbor) return labelled('Sky Harbor', 'Service');

	const chain = boxes
		.flatMap((box) => box.assets ?? [])
		.map((asset) => BRIDGE_TOKENS[asset.tokenId])
		.findLast(Boolean);

	for (const box of boxes) {
		// Nearly every tx pays the miner fee, and the book names that address plain
		// "Ergo Platform", so it would label every tx.
		if (box.address === FEE_ADDRESS) continue;

		const entry = book.get(box.address!);
		if (!entry || EXCLUDED_LABELS.includes(entry.name)) continue;

		let label = entry.name;
		if (entry.name === 'Rosen Bridge' && chain) label = `Rosen Bridge (${chain})`;
		if (entry.name === 'Ergo Platform') label = 'P2P';
		else if (entry.name === 'Spectrum Finance') label = 'Dex Trade';

		return labelled(label, entry.type);
	}

	if (detectContract) {
		for (const box of boxes) {
			const label = box.ergoTree ? detectContract(box.ergoTree) : null;
			if (label) return labelled(label, 'Contract');
		}
	}

	return labelled('Transfer', 'Transfer');
}

/** What to call an address: its address book name, its contract, or the address shortened. */
export function nameOf(box: Box, book: AddressBook, detectContract: ContractDetector | null) {
	// The book calls both plain "Ergo Platform".
	if (box.address === EMISSION_ADDRESS) return 'Emission';
	if (box.address === FEE_ADDRESS) return 'Miner fees';

	const entry = book.get(box.address!);
	if (entry) return entry.name;

	const contract = detectContract && box.ergoTree ? detectContract(box.ergoTree) : null;

	return contract ?? shortAddress(box.address!);
}
