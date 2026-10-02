<script lang="ts">
	import { flip } from 'svelte/animate';
	import type { Label } from '$lib/common/labels';
	import type { MempoolTx } from '$lib/common/mempool';
	import { arrive, intoBlock, reducedMotion } from '$lib/common/motion';
	import TxCard from './TxCard.svelte';

	let { items, ready }: { items: { tx: MempoolTx; label: Label }[]; ready: boolean } = $props();
</script>

<div class="grid">
	{#each items as item, index (item.tx.id)}
		<div
			class="cell"
			animate:flip={{ duration: reducedMotion ? 0 : 480 }}
			in:arrive={{ index, first: !item.tx.fresh }}
			out:intoBlock={{ index }}
		>
			<TxCard tx={item.tx} label={item.label} />
		</div>
	{/each}

	{#if !ready}
		{#each Array.from({ length: 12 }, (_, i) => i) as i (i)}
			<div class="skeleton" style="animation-delay: {i * 90}ms"></div>
		{/each}
	{/if}
</div>

{#if ready && items.length === 0}
	<div class="empty">
		<div class="pulse" aria-hidden="true"></div>
		<p>The mempool is empty.</p>
		<p class="sub">New transactions will appear here the moment they are broadcast.</p>
	</div>
{/if}

<style>
	.grid {
		position: relative;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(232px, 1fr));
		gap: 12px;
	}

	.cell {
		min-width: 0;
	}

	.skeleton {
		height: 150px;
		border-radius: 16px;
		border: 1px solid var(--border);
		background: linear-gradient(
				100deg,
				transparent 30%,
				rgb(255 255 255 / 0.045) 50%,
				transparent 70%
			)
			0 0 / 300% 100%,
			var(--surface);
		animation: shimmer 1.6s linear infinite;
	}

	@keyframes shimmer {
		from {
			background-position: 150% 0;
		}
		to {
			background-position: -150% 0;
		}
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 64px 16px;
		text-align: center;
		color: var(--text);
	}

	.empty .sub {
		font-size: 0.85rem;
		color: var(--muted);
	}

	.pulse {
		width: 14px;
		height: 14px;
		margin-bottom: 14px;
		border-radius: 50%;
		background: var(--main-color);
		animation: ping 1.8s ease-out infinite;
	}

	@keyframes ping {
		0% {
			box-shadow: 0 0 0 0 rgb(251 92 22 / 0.6);
		}
		100% {
			box-shadow: 0 0 0 26px rgb(251 92 22 / 0);
		}
	}

	@media (max-width: 520px) {
		.grid {
			grid-template-columns: repeat(auto-fill, minmax(156px, 1fr));
			gap: 8px;
		}
	}
</style>
