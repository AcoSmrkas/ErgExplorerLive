<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { ERGEXPLORER_URL } from '$lib/common/const';
	import { land, reducedMotion } from '$lib/common/motion';
	import { nFormatter } from '$lib/common/utils';
	import { addressBook, mempoolTxCount, nodeInfo, now, recentBlocks } from '$lib/store/store';

	// Oldest on the left, so the chain grows toward the next block.
	let blocks = $derived([...$recentBlocks].reverse());

	// The next-block slot flashes when a block lands.
	let flash = $state(false);
	let lastHeight = 0;
	$effect(() => {
		const height = $nodeInfo?.fullHeight ?? 0;
		if (lastHeight && height > lastHeight) {
			flash = true;
			setTimeout(() => (flash = false), 900);
		}
		lastHeight = height;
	});

	function ago(timestamp: number) {
		const s = Math.max(0, Math.floor(($now - timestamp) / 1000));
		if (s < 60) return `${s}s ago`;
		if (s < 3600) return `${Math.floor(s / 60)}m ago`;
		return `${Math.floor(s / 3600)}h ago`;
	}

</script>

<footer class="chain" aria-label="Latest blocks">
	<div class="inner">
		<div class="blocks">
			{#each blocks as block, i (block.height)}
				<a
					class="block"
					class:newest={i === blocks.length - 1}
					href={`${ERGEXPLORER_URL}blocks/${block.id}`}
					target="_blank"
					rel="noopener"
					title="Mined by {$addressBook.get(block.miner.address)?.name ?? block.miner.name}"
					animate:flip={{ duration: reducedMotion ? 0 : 500 }}
					in:land
					out:fade={{ duration: 200 }}
				>
					<span class="height mono">{nFormatter(block.height, 0, false)}</span>
					<span class="meta">
						<b class="mono">{block.transactionsCount}</b>
						{block.transactionsCount === 1 ? 'tx' : 'txs'}
					</span>
					<span class="meta faint">{ago(block.timestamp)}</span>
				</a>
			{/each}
		</div>

		<div id="next-block" class="next" class:flash>
			<span class="next-label">Next block</span>
			<span class="height mono">
				{$nodeInfo ? nFormatter($nodeInfo.fullHeight + 1, 0, false) : '…'}
			</span>
			<span class="meta"><b class="mono">{$mempoolTxCount}</b> pending</span>
		</div>
	</div>
</footer>

<style>
	.chain {
		position: fixed;
		inset: auto 0 0 0;
		z-index: 30;
		height: var(--chain-height);
		background: rgb(15 15 17 / 0.95);
		border-top: 1px solid rgb(255 255 255 / 0.06);
	}

	.inner {
		display: flex;
		align-items: center;
		gap: 22px;
		height: 100%;
		/* The chain runs in from the left edge of the screen; the next-block slot lines up
		   with the right edge of the page content (1480px wide). */
		padding: 0 max(16px, calc((100vw - 1480px) / 2 + 16px)) 0 16px;
	}

	.blocks {
		flex: 1;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 22px;
		min-width: 0;
		height: 100%;
		overflow: hidden;
		mask-image: linear-gradient(90deg, transparent, #000 12%);
	}

	.block,
	.next {
		position: relative;
		flex: none;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 2px;
		width: 118px;
		height: 72px;
		padding: 0 12px;
		border-radius: 14px;
	}

	.block {
		background: linear-gradient(160deg, #2a2a30, #1c1c20);
		border: 1px solid var(--border-strong);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.07),
			0 6px 18px -10px rgb(0 0 0 / 0.8);
		transition:
			transform 0.2s,
			border-color 0.2s;
	}

	.block:hover {
		transform: translateY(-3px);
		border-color: rgb(251 92 22 / 0.6);
	}

	/* The link to the block before it. */
	.block::after {
		content: '';
		position: absolute;
		right: -22px;
		top: 50%;
		width: 22px;
		border-top: 2px dotted var(--border-strong);
	}

	.block.newest {
		border-color: rgb(251 92 22 / 0.45);
		background: linear-gradient(160deg, #3a2419, #1f1a18);
	}

	.block.newest::after {
		border-color: rgb(251 92 22 / 0.7);
	}

	.height {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--text);
	}

	.meta {
		font-size: 0.7rem;
		color: var(--muted);
	}

	.meta b {
		font-weight: 650;
		color: var(--text);
	}

	.faint {
		color: var(--faint);
	}

	.next {
		border: 1.5px dashed rgb(251 92 22 / 0.7);
		background: rgb(251 92 22 / 0.07);
	}

	/* The glow breathes by opacity on its own layer; animating box-shadow repainted every frame. */
	.next::before {
		content: '';
		position: absolute;
		inset: -2px;
		z-index: -1;
		border-radius: 15px;
		box-shadow: 0 0 26px -2px rgb(251 92 22 / 0.5);
		opacity: 0;
		animation: breathe 2.4s ease-in-out infinite;
	}

	.next-label {
		font-size: 0.62rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--main-color);
	}

	@keyframes breathe {
		50% {
			opacity: 1;
		}
	}

	.next.flash {
		animation: slam 0.9s cubic-bezier(0.2, 0.9, 0.3, 1.3);
	}

	.next.flash::before {
		animation: flare 0.9s ease-out;
	}

	@keyframes slam {
		35% {
			transform: scale(1.08);
		}
	}

	@keyframes flare {
		0% {
			opacity: 1;
			transform: scale(1.15);
		}
		100% {
			opacity: 0;
			transform: scale(1);
		}
	}

	@media (max-width: 520px) {
		.inner,
		.blocks {
			gap: 14px;
		}

		.block,
		.next {
			width: 92px;
			height: 64px;
			padding: 0 9px;
		}

		.block::after {
			right: -14px;
			width: 14px;
		}

		.height {
			font-size: 0.8rem;
		}
	}
</style>
