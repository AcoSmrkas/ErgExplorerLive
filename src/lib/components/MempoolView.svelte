<script lang="ts">
	import { contractDetector } from '$lib/common/contracts';
	import { labelTx } from '$lib/common/labels';
	import { addressBook, labelFilter, mempoolTxs, ready } from '$lib/store/store';
	import Filters from './Filters.svelte';
	import Stats from './Stats.svelte';
	import TxGrid from './TxGrid.svelte';

	// Labelled once here; the filter chips and the cards both use it.
	let labelled = $derived(
		$mempoolTxs.map((tx) => ({ tx, label: labelTx(tx, $addressBook, $contractDetector) }))
	);
	let shown = $derived(
		$labelFilter ? labelled.filter((item) => item.label.group === $labelFilter) : labelled
	);
</script>

<main class="page">
	<Stats txs={labelled.map((item) => ({ id: item.tx.id, color: item.label.color }))} />

	<section class="mempool" aria-labelledby="mempool-title">
		<h1 id="mempool-title">Mempool</h1>

		<Filters labels={labelled.map((item) => item.label)} />

		<TxGrid items={shown} ready={$ready} />
	</section>
</main>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 22px;
		max-width: 1480px;
		margin: 0 auto;
		padding: 20px 16px calc(var(--chain-height) + 28px);
	}

	.mempool {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	h1 {
		font-size: 1.35rem;
		font-weight: 750;
		letter-spacing: -0.02em;
		color: var(--text);
	}
</style>
