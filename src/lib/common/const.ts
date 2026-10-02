export const SOCKET_URL = 'https://socket.ergexplorer.com';
export const ERGEXPLORER_URL = 'https://ergexplorer.com/';
export const ERGEXPLORER_API = 'https://api.ergexplorer.com/';
export const ERG_ICON = 'https://ergexplorer.com/images/logo-new.png';

// Our chain gateway: serves only sources at the chain tip.
const CHAIN_GATEWAY = 'https://chain.mewfinance.com';

// Node APIs, in order: the gateway, then public indexed nodes for when it gives no answer.
export const NODE_URLS = [
	`${CHAIN_GATEWAY}/node`,
	'https://node.sigmaspace.io',
	'https://node.ergopool.io'
];

// Explorer APIs, in the same order.
export const EXPLORER_URLS = [`${CHAIN_GATEWAY}/explorer`, 'https://api.ergoplatform.com'];

export const FEE_ADDRESS =
	'2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe';

// Ergo aims for a block every two minutes.
export const BLOCK_TARGET_MS = 120_000;
