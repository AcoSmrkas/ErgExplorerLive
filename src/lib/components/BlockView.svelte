<script lang="ts">
	import { goto } from '$app/navigation';
	import { fetchBlock, type BlockHeader } from '$lib/common/blocks';
	import { EMISSION_ADDRESS, ERGEXPLORER_URL, FEE_ADDRESS } from '$lib/common/const';
	import { contractDetector } from '$lib/common/contracts';
	import { labelTx, nameOf } from '$lib/common/labels';
	import { buildTx, type MempoolTx } from '$lib/common/mempool';
	import { valueMoved } from '$lib/common/prices';
	import { collectTokenIds, getAssetInfos, nFormatter } from '$lib/common/utils';
	import {
		addressBook,
		ergUsd,
		labelFilter,
		nodeInfo,
		now,
		tokenPrices
	} from '$lib/store/store';
	import Filters from './Filters.svelte';
	import TxGrid from './TxGrid.svelte';

	let { height }: { height: number } = $props();

	let block = $state<{ header: BlockHeader; txs: MempoolTx[] } | null>(null);
	let status = $state<'loading' | 'ready' | 'missing' | 'error'>('loading');
	// Only the answer for the block asked for last is shown.
	let request = 0;

	async function load(h: number) {
		const mine = ++request;
		status = 'loading';
		block = null;

		if (!Number.isInteger(h) || h < 1) {
			status = 'missing';
			return;
		}

		try {
			const raw = await fetchBlock(h);
			if (mine !== request) return;
			if (!raw) {
				status = 'missing';
				return;
			}

			const txs = raw.transactions.map((tx) => buildTx(tx, h));
			// Token names, decimals and icons, before the tiles render.
			await getAssetInfos(collectTokenIds(txs));
			if (mine !== request) return;

			block = { header: raw.header, txs };
			status = 'ready';
		} catch (error) {
			console.error(`Block ${h} failed to load:`, error);
			if (mine === request) status = 'error';
		}
	}

	$effect(() => {
		load(height);
	});

	let tip = $derived($nodeInfo?.fullHeight ?? 0);

	let labelled = $derived(
		(block?.txs ?? []).map((tx) => ({ tx, label: labelTx(tx, $addressBook, $contractDetector) }))
	);
	let shown = $derived(
		$labelFilter ? labelled.filter((item) => item.label.group === $labelFilter) : labelled
	);

	// The reward goes to the miner's address: whatever the first tx pays that isn't
	// the emission contract. In a Lithos block that key is the lender whose collateral
	// the block spent, not whoever found it.
	let miner = $derived.by(() => {
		const reward = block?.txs.find((tx) =>
			tx.inputs.some((box) => box.address === EMISSION_ADDRESS)
		);
		const box = reward?.outputs.find((box) => box.address !== EMISSION_ADDRESS);
		const name = box ? nameOf(box, $addressBook, $contractDetector) : '';
		const lithos = labelled.some((item) => item.label.label === 'Lithos Genesis');

		return lithos ? `Lithos · reward to lender ${name}` : name;
	});

	let fees = $derived((block?.txs ?? []).reduce((sum, tx) => sum + tx.fee, 0) / 1e9);
	let feesUsd = $derived($ergUsd === null || fees === 0 ? null : fees * $ergUsd);

	// What users moved. The miner's reward is new coin, not anyone's payment, and the
	// fee collection would count the fees twice, so neither is in it.
	let userTxs = $derived(
		(block?.txs ?? []).filter(
			(tx) =>
				!tx.inputs.some((box) => box.address === EMISSION_ADDRESS) &&
				!tx.inputs.every((box) => box.address === FEE_ADDRESS)
		)
	);
	let moved = $derived(valueMoved(userTxs, $tokenPrices, $ergUsd));

	function ago(timestamp: number) {
		const s = Math.max(0, Math.floor(($now - timestamp) / 1000));
		if (s < 60) return `${s}s ago`;
		if (s < 3600) return `${Math.floor(s / 60)}m ago`;
		if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
		return new Date(timestamp).toLocaleDateString(undefined, { dateStyle: 'medium' });
	}

	const dateTime = (timestamp: number) =>
		new Date(timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

	// The height box follows the block shown, and goes where it is told on Enter.
	let target = $state('');
	$effect(() => {
		target = String(height);
	});

	function jump(event: SubmitEvent) {
		event.preventDefault();
		const h = Math.floor(Number(target));
		if (Number.isFinite(h) && h >= 1 && h !== height) goto(`/block/${h}`);
	}
</script>

<main class="page">
	<nav class="toolbar" aria-label="Blocks">
		<a class="back" href="/">
			<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
				<path
					d="M10 3 5 8l5 5"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			Live mempool
		</a>

		<form class="stepper" onsubmit={jump}>
			<a
				class="step"
				class:disabled={height <= 1}
				href={height > 1 ? `/block/${height - 1}` : undefined}
				aria-label="Previous block"
			>
				‹
			</a>
			<label>
				<span class="sr-only">Go to block</span>
				<input
					class="mono"
					type="text"
					inputmode="numeric"
					pattern="[0-9]*"
					autocomplete="off"
					bind:value={target}
				/>
			</label>
			<a
				class="step"
				class:disabled={tip > 0 && height >= tip}
				href={tip > 0 && height >= tip ? undefined : `/block/${height + 1}`}
				aria-label="Next block"
			>
				›
			</a>
		</form>
	</nav>

	<section class="stats" aria-label="Block summary">
		<div class="panel stat">
			<span class="label">Block</span>
			<span class="value mono">{Number.isFinite(height) ? nFormatter(height, 0, false) : '–'}</span>
			<span class="sub">{miner ? `by ${miner}` : ' '}</span>
		</div>

		<div class="panel stat">
			<span class="label">Mined</span>
			<span class="value mono">{block ? ago(block.header.timestamp) : '–'}</span>
			<span class="sub">{block ? dateTime(block.header.timestamp) : ' '}</span>
		</div>

		<div class="panel stat split">
			<div class="half">
				<span class="label">Txs</span>
				<span class="value mono">{block ? block.txs.length : '–'}</span>
				<span class="sub">in block</span>
			</div>
			<div class="half">
				<span class="label">Fees</span>
				<span class="value mono">{block ? nFormatter(fees, 4) : '–'}</span>
				<span class="sub">
					ERG<span class="usd"
						>{feesUsd === null
							? ''
							: feesUsd < 0.01
								? ' · <$0.01'
								: ` · $${nFormatter(feesUsd, 2)}`}</span
					>
				</span>
			</div>
		</div>

		<div class="panel stat" title="Between addresses, leaving out the block reward and fees">
			<span class="label">Moved</span>
			{#if !block}
				<span class="value mono">–</span>
				<span class="sub">&nbsp;</span>
			{:else if userTxs.length === 0}
				<span class="value">Empty</span>
				<span class="sub">only the miner's reward</span>
			{:else if moved.usd !== null}
				<span class="value mono">
					<span class="dollar">$</span>{nFormatter(moved.usd, moved.usd >= 100 ? 0 : 2)}
				</span>
				<span class="sub">
					{nFormatter(moved.erg, 2)} ERG{moved.tokens > 0
						? ` + ${moved.tokens} token${moved.tokens === 1 ? '' : 's'}`
						: ''}
				</span>
			{:else}
				<span class="value mono">{nFormatter(moved.erg, 2)} <small>ERG</small></span>
				<span class="sub">between addresses</span>
			{/if}
		</div>
	</section>

	<section class="txs" aria-labelledby="block-title">
		<div class="title-row">
			<h1 id="block-title">Transactions</h1>
			{#if block}
				<a
					class="explorer"
					href={`${ERGEXPLORER_URL}blocks/${block.header.id}`}
					target="_blank"
					rel="noopener"
				>
					Open on ErgExplorer
					<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
						<path
							d="M5 3h8v8M13 3 4 12"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</a>
			{/if}
		</div>

		{#if status === 'missing'}
			<div class="note">
				<p>
					{#if Number.isInteger(height) && height > tip}
						Block {nFormatter(height, 0, false)} hasn't been mined yet.
					{:else}
						There is no block at that height.
					{/if}
				</p>
				<p class="sub">
					{#if tip > 0}
						The newest is <a href={`/block/${tip}`}>{nFormatter(tip, 0, false)}</a>.
					{/if}
					Pending transactions are in the <a href="/">live mempool</a>.
				</p>
			</div>
		{:else if status === 'error'}
			<div class="note">
				<p>This block couldn't be loaded.</p>
				<p class="sub">
					No node answered. <button type="button" onclick={() => load(height)}>Try again</button>
				</p>
			</div>
		{:else}
			<Filters labels={labelled.map((item) => item.label)} />
			<TxGrid items={shown} ready={status === 'ready'} live={false} />
		{/if}
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

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: -6px;
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--muted);
		transition: color 0.2s;
	}

	.back:hover {
		color: var(--text);
	}

	.stepper {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.step {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 10px;
		font-size: 1.2rem;
		line-height: 1;
		color: var(--text);
		background: rgb(255 255 255 / 0.05);
		border: 1px solid var(--border);
		transition:
			border-color 0.2s,
			background 0.2s;
	}

	.step:hover:not(.disabled) {
		border-color: rgb(251 92 22 / 0.5);
		background: rgb(251 92 22 / 0.1);
	}

	.step.disabled {
		color: var(--faint);
		opacity: 0.5;
		cursor: default;
	}

	.stepper input {
		width: 108px;
		height: 34px;
		padding: 0 10px;
		border-radius: 10px;
		font-size: 0.85rem;
		text-align: center;
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--border);
	}

	.stepper input:focus {
		outline: none;
		border-color: rgb(251 92 22 / 0.6);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	/* The summary row matches the live page's. */
	.stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 14px 16px;
		min-width: 0;
	}

	.label {
		white-space: nowrap;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.value {
		font-size: clamp(1.25rem, 2.4vw, 1.75rem);
		font-weight: 650;
		color: var(--text);
		line-height: 1.15;
		white-space: nowrap;
	}

	.dollar {
		color: var(--main-color);
	}

	.value small {
		font-size: 0.55em;
		color: var(--main-color);
		font-weight: 700;
	}

	.sub {
		font-size: 0.75rem;
		color: var(--faint);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.split {
		flex-direction: row;
		gap: 0;
		padding: 0;
	}

	.half {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
		padding: 14px 16px;
	}

	.half + .half {
		border-left: 1px solid var(--border);
	}

	.txs {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	h1 {
		font-size: 1.35rem;
		font-weight: 750;
		letter-spacing: -0.02em;
		color: var(--text);
	}

	.explorer {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--muted);
		transition: color 0.2s;
	}

	.explorer:hover {
		color: var(--text);
	}

	.note {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 56px 16px;
		text-align: center;
		color: var(--text);
	}

	.note .sub {
		font-size: 0.85rem;
		color: var(--muted);
		white-space: normal;
	}

	.note a,
	.note button {
		color: var(--main-color);
		font-weight: 600;
	}

	@media (max-width: 900px) {
		.stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 420px) {
		.stats {
			gap: 8px;
		}

		.stat,
		.half {
			padding: 12px;
		}

		.split {
			padding: 0;
		}

		.split .value {
			font-size: 1.05rem;
		}

		.usd {
			display: none;
		}

		.label {
			letter-spacing: 0.08em;
		}

		.stepper input {
			width: 92px;
		}
	}
</style>
