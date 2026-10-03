<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { BLOCK_TARGET_MS } from '$lib/common/const';
	import { valueMoved } from '$lib/common/prices';
	import { nFormatter } from '$lib/common/utils';
	import NextBlockGauge from './NextBlockGauge.svelte';
	import {
		addressBook,
		ergUsd,
		lastBlockInfo,
		mempoolFees,
		mempoolTxCount,
		mempoolTxs,
		nodeInfo,
		now,
		recentBlocks,
		tokenPrices
	} from '$lib/store/store';

	/** Pending txs with their label colours, for the gauge. */
	let { txs }: { txs: { id: string; color: string }[] } = $props();

	// Numbers count to their new value; the first value is shown as is.
	function counter(value: () => number) {
		const tween = new Tween(0, { duration: 650, easing: cubicOut });
		$effect(() => {
			const target = value();
			tween.set(target, tween.current === 0 ? { duration: 0 } : undefined);
		});
		return tween;
	}

	const height = counter(() => $nodeInfo?.fullHeight ?? 0);
	const pending = counter(() => $mempoolTxCount);
	// What the pending txs pay the next miner.
	let fees = $derived($mempoolFees / 1e9);
	const feesShown = counter(() => fees);
	let feesUsd = $derived($ergUsd === null || fees === 0 ? null : fees * $ergUsd);

	let motion = $derived(valueMoved($mempoolTxs, $tokenPrices, $ergUsd));
	const ergShown = counter(() => motion.erg);
	const usdShown = counter(() => motion.usd ?? 0);

	let elapsed = $derived($lastBlockInfo ? Math.max(0, $now - $lastBlockInfo.timestamp) : 0);
	let progress = $derived(Math.min(elapsed / BLOCK_TARGET_MS, 1));
	let overdue = $derived(elapsed > BLOCK_TARGET_MS);

	let latest = $derived(
		$recentBlocks[0]?.height === $nodeInfo?.fullHeight ? $recentBlocks[0] : undefined
	);
	let miner = $derived(
		latest ? ($addressBook.get(latest.miner.address)?.name ?? latest.miner.name) : ''
	);

	function clock(ms: number) {
		const s = Math.floor(ms / 1000);
		return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
	}

</script>

<section class="stats" aria-label="Network status">
	<div class="panel stat">
		<span class="label">Block height</span>
		<span class="value mono">{nFormatter(Math.round(height.current), 0, false)}</span>
		<span class="sub">
			{#if latest}
				{latest.transactionsCount}
				{latest.transactionsCount === 1 ? 'tx' : 'txs'} · by {miner}
			{:else}
				&nbsp;
			{/if}
		</span>
	</div>

	<div class="panel stat timer" class:overdue>
		<NextBlockGauge {progress} {overdue} {txs} />
		<div class="timer-text">
			<span class="label">Last block</span>
			<span class="value mono">{$lastBlockInfo ? clock(elapsed) : '–:––'}</span>
			<span class="sub">ago · avg 2:00</span>
		</div>
	</div>

	<div class="panel stat split">
		<div class="half">
			<span class="label">Pending</span>
			<span class="value mono">{nFormatter(Math.round(pending.current), 0, false)}</span>
			<span class="sub">waiting</span>
		</div>
		<div class="half">
			<span class="label">Fees</span>
			<span class="value mono">{nFormatter(feesShown.current, 4)}</span>
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

	<div class="panel stat">
		<span class="label">In motion</span>
		{#if motion.usd !== null}
			<span class="value mono">
				<span class="dollar">$</span>{nFormatter(usdShown.current, usdShown.current >= 100 ? 0 : 2)}
			</span>
			<span class="sub">
				{nFormatter(motion.erg, 2)} ERG{motion.tokens > 0
					? ` + ${motion.tokens} token${motion.tokens === 1 ? '' : 's'}`
					: ''}
			</span>
		{:else}
			<span class="value mono">{nFormatter(ergShown.current, 2)} <small>ERG</small></span>
			<span class="sub">between addresses</span>
		{/if}
	</div>
</section>

<style>
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

	/* Two numbers side by side, under one panel. */
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

	.timer {
		flex-direction: row;
		align-items: center;
		gap: 14px;
	}

	.timer-text {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
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

		.timer {
			gap: 10px;
			--gauge-size: 40px;
		}

		.label {
			letter-spacing: 0.08em;
		}
	}
</style>
