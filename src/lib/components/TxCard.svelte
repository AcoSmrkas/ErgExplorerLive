<script lang="ts">
	import BigNumber from 'bignumber.js';
	import { ERGEXPLORER_URL, ERG_ICON } from '$lib/common/const';
	import { contractDetector } from '$lib/common/contracts';
	import { nameOf, type Label } from '$lib/common/labels';
	import type { Box, MempoolTx } from '$lib/common/mempool';
	import { nFormatter, type Transfer } from '$lib/common/utils';
	import { addressBook, assetInfos } from '$lib/store/store';

	type AssetInfo = { id: string; name?: string; decimals?: number; iconurl?: string; cachedurl?: string };

	let { tx, label }: { tx: MempoolTx; label: Label } = $props();

	// More don't fit a card's width legibly; the rest is counted in "+N".
	const MAX_TOKENS = 2;

	let infos = $derived($assetInfos as { [tokenId: string]: AssetInfo });

	// ERG leads when it moved; otherwise the first token does.
	let primary = $derived(tx.transfers.find((t) => t.tokenId === 'ERG') ?? tx.transfers[0]);
	let tokens = $derived(tx.transfers.filter((t) => t !== primary));

	const describe = (party: Box | string) =>
		typeof party === 'string' ? party : nameOf(party, $addressBook, $contractDetector);
	const addressOf = (party: Box | string) => (typeof party === 'string' ? '' : party.address);

	let from = $derived(describe(tx.from));
	// Two addresses the book gives one name (an oracle's) are the same party.
	let to = $derived(describe(tx.to) === from && from !== 'multiple' ? 'itself' : describe(tx.to));

	function view(t: Transfer) {
		const info = infos[t.tokenId];
		const kind = !t.burned.isZero() ? 'burn' : !t.minted.isZero() ? 'mint' : 'move';
		const raw = kind === 'burn' ? t.burned : kind === 'mint' ? t.minted : t.amount;

		return {
			kind,
			amount: new BigNumber(raw).div(10 ** (info?.decimals ?? 0)).toNumber(),
			name: info?.name || `${t.tokenId.slice(0, 6)}…`,
			icon: t.tokenId === 'ERG' ? ERG_ICON : info?.iconurl || info?.cachedurl || ''
		};
	}

	let lead = $derived(primary ? view(primary) : undefined);
</script>

<a
	class="card"
	class:fresh={tx.fresh}
	href={`${ERGEXPLORER_URL}transactions/${tx.id}`}
	target="_blank"
	rel="noopener"
	style="--accent: {label.color}"
	aria-label="{label.label} transaction {tx.id}"
>
	<div class="top">
		<span class="tag" title={label.label}><span class="dot"></span>{label.label}</span>
		<!-- Enough of the id to find a tx by; the full id is in the tooltip and on ErgExplorer. -->
		<span class="txid mono" title={tx.id}>
			<span>{tx.id.slice(0, 4)}<span class="wide">{tx.id.slice(4, 6)}</span>…{tx.id.slice(-4)}</span>
			<svg class="go" viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
				<path
					d="M5 3h8v8M13 3 4 12"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</span>
	</div>

	{#if lead}
		<div class="lead">
			{#if lead.icon}
				<img src={lead.icon} alt="" loading="lazy" />
			{:else}
				<span class="glyph">{lead.name.slice(0, 2)}</span>
			{/if}
			<span class="amount mono {lead.kind}">
				{lead.kind === 'mint' ? '+' : lead.kind === 'burn' ? '−' : ''}{nFormatter(lead.amount)}
			</span>
			<span class="unit" title={lead.name}>{lead.name}</span>
		</div>
	{/if}

	{#if tokens.length > 0}
		<div class="tokens">
			{#each tokens.slice(0, MAX_TOKENS) as token (token.tokenId)}
				{@const t = view(token)}
				<span class="token {t.kind}" title="{t.kind === 'move' ? '' : `${t.kind}ed `}{t.name}">
					{#if t.icon}
						<img src={t.icon} alt="" loading="lazy" />
					{/if}
					<span class="mono">
						{t.kind === 'mint' ? '+' : t.kind === 'burn' ? '−' : ''}{nFormatter(t.amount)}
					</span>
					<span class="token-name">{t.name}</span>
				</span>
			{/each}
			{#if tokens.length > MAX_TOKENS}
				<span class="more mono">+{tokens.length - MAX_TOKENS}</span>
			{/if}
		</div>
	{/if}

	<div class="route">
		<span class="who" class:vague={typeof tx.from === 'string'} title={addressOf(tx.from)}>
			{from}
		</span>
		<span class="arrow" aria-hidden="true">→</span>
		<span class="who" class:vague={to === 'itself' || to === 'multiple'} title={addressOf(tx.to)}>
			{to}
		</span>
	</div>
</a>

<style>
	.card {
		--accent: var(--main-color);
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 10px;
		height: 100%;
		padding: 12px 14px 12px;
		border-radius: 16px;
		background: linear-gradient(180deg, var(--surface-2), var(--surface));
		border: 1px solid var(--border);
		box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.03);
		overflow: hidden;
		transition:
			transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
			border-color 0.25s,
			box-shadow 0.25s;
	}

	/* A wash of the label's colour along the top edge. */
	.card::before {
		content: '';
		position: absolute;
		inset: 0 0 auto 0;
		height: 56px;
		background: linear-gradient(
			180deg,
			color-mix(in oklab, var(--accent) 13%, transparent),
			transparent
		);
		pointer-events: none;
	}

	.card:hover {
		transform: translateY(-3px);
		border-color: color-mix(in oklab, var(--accent) 55%, var(--border));
		box-shadow:
			0 14px 34px -16px color-mix(in oklab, var(--accent) 60%, transparent),
			inset 0 1px 0 rgb(255 255 255 / 0.05);
	}

	/* A tx that arrived while watching rings once in its label's colour. Opacity only,
	   on its own layer, so it doesn't repaint the card. */
	.card.fresh::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		box-shadow: inset 0 0 0 2px var(--accent);
		opacity: 0;
		pointer-events: none;
		animation: arrive-ring 1.8s ease-out;
	}

	@keyframes arrive-ring {
		0% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	.top {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		min-width: 0;
		padding: 3px 9px 3px 8px;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 650;
		color: color-mix(in oklab, var(--accent) 55%, white);
		background: color-mix(in oklab, var(--accent) 16%, transparent);
		border: 1px solid color-mix(in oklab, var(--accent) 32%, transparent);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.dot {
		flex: none;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 8px var(--accent);
	}

	.txid {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.68rem;
		color: var(--faint);
		white-space: nowrap;
		transition: color 0.2s;
	}

	.card:hover .txid {
		color: var(--text);
	}

	.go {
		flex: none;
		opacity: 0.5;
		transition: opacity 0.2s;
	}

	.card:hover .go {
		opacity: 1;
	}

	.lead {
		display: flex;
		align-items: center;
		gap: 9px;
		min-width: 0;
	}

	.lead img,
	.glyph {
		flex: none;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		object-fit: contain;
	}

	.glyph {
		display: grid;
		place-items: center;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--text);
		background: var(--border-strong);
	}

	.amount {
		font-size: 1.35rem;
		font-weight: 650;
		color: var(--text);
		white-space: nowrap;
	}

	.unit {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mint {
		color: #4ade80;
	}

	.burn {
		color: #f87171;
	}

	.tokens {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
	}

	/* Only a token's name gives way when space runs out: its amount and the "+N" stay whole. */
	.token {
		flex: 0 1 auto;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		min-width: 0;
		overflow: hidden;
		padding: 3px 8px 3px 4px;
		border-radius: 999px;
		font-size: 0.72rem;
		color: var(--text);
		background: rgb(255 255 255 / 0.05);
		border: 1px solid rgb(255 255 255 / 0.06);
		white-space: nowrap;
	}

	.token img {
		flex: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		object-fit: contain;
	}

	.token.mint {
		border-color: rgb(74 222 128 / 0.35);
	}

	.token.burn {
		border-color: rgb(248 113 113 / 0.35);
	}

	.token .mono {
		flex: none;
	}

	.token-name {
		min-width: 0;
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.more {
		flex: none;
		font-size: 0.72rem;
		color: var(--muted);
	}

	.route {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: auto;
		padding-top: 9px;
		border-top: 1px dashed rgb(255 255 255 / 0.07);
		font-size: 0.72rem;
		color: var(--muted);
		min-width: 0;
	}

	.who {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* "multiple" and "itself" read as words, not names. */
	.vague {
		font-style: italic;
		color: var(--faint);
	}

	.arrow {
		flex: none;
		color: color-mix(in oklab, var(--accent) 70%, white);
	}

	@media (max-width: 520px) {
		.card {
			padding: 10px 11px;
			gap: 8px;
		}

		.amount {
			font-size: 1.15rem;
		}

		.lead img {
			width: 24px;
			height: 24px;
		}

		.route {
			gap: 4px;
			font-size: 0.66rem;
		}

		/* A narrow card puts the id under a label that doesn't leave it room. */
		.top {
			flex-wrap: wrap;
			row-gap: 5px;
		}

		.txid {
			font-size: 0.62rem;
		}

		.txid .wide,
		.go {
			display: none;
		}
	}
</style>
