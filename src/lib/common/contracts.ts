import { writable, type Writable } from 'svelte/store';

/** Names the contract an ErgoTree belongs to, or null when it matches no known template. */
export type ContractDetector = (ergoTree: string) => string | null;

// The templates are ErgExplorer's, so contracts get the same names here as on every
// ErgExplorer page. To pick up new ones, copy ErgExplorer's
// app/scripts/addresses/{constants,transaction-analyzer}.js over $lib/contracts/ and
// keep the three header lines.
export const contractDetector: Writable<ContractDetector | null> = writable(null);

/** The templates are some 200 kB, so they load in their own chunk after the first tiles. */
export async function loadContractTemplates() {
	try {
		const { detectContractFromErgotree } = await import('$lib/contracts/transaction-analyzer.js');

		// The same contracts recur in most txs, and each lookup tries every template.
		const labels = new Map<string, string | null>();

		contractDetector.set((ergoTree) => {
			let label = labels.get(ergoTree);

			if (label === undefined) {
				label = detectContractFromErgotree(ergoTree) as string | null;
				if (labels.size >= 5000) labels.clear();
				labels.set(ergoTree, label);
			}

			return label;
		});
	} catch (error) {
		console.error('Contract templates failed to load:', error);
	}
}
