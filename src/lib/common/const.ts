export const SOCKET_URL = 'https://socket.ergexplorer.com';
export const ERGEXPLORER_URL = 'https://ergexplorer.com/';
export const ERGEXPLORER_API = 'https://api.ergexplorer.com/';

// Node APIs, in order: our chain gateway (only sources at the chain tip), then public
// indexed nodes for when it gives no answer.
export const NODE_URLS = [
	'https://chain.mewfinance.com/node',
	'https://node.sigmaspace.io',
	'https://node.ergopool.io'
];
