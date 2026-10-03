<script lang="ts">
	import { ERGEXPLORER_URL } from '$lib/common/const';
	import { connected } from '$lib/store/store';

	// Before the first connection there is nothing to reconnect to.
	let wasConnected = $state(false);
	$effect(() => {
		if ($connected) wasConnected = true;
	});
</script>

<header class="header">
	<div class="inner">
		<a href="/" class="brand" aria-label="Erg Explorer Live">
			<img src="https://ergexplorer.com/images/logo.png" alt="" width="36" height="36" />
			<span class="name">Erg Explorer</span>
			<!-- Doubles as the connection status: amber until the socket (re)connects. -->
			<span class="live" class:offline={!$connected} aria-live="polite">
				<span class="dot"></span>
				{$connected ? 'LIVE' : wasConnected ? 'RECONNECTING' : 'CONNECTING'}
			</span>
		</a>

		<div class="actions">
			<a class="explorer" href={ERGEXPLORER_URL} target="_blank" rel="noopener">
				<span class="hidden sm:inline">Open</span> ErgExplorer
				<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
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
		</div>
	</div>
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 30;
		background: rgb(15 15 17 / 0.94);
		border-bottom: 1px solid rgb(255 255 255 / 0.05);
	}

	.inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		max-width: 1480px;
		margin: 0 auto;
		padding: 10px 16px;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.brand img {
		width: 36px;
		height: 36px;
	}

	.name {
		font-weight: 700;
		font-size: 1.05rem;
		letter-spacing: -0.01em;
		color: var(--text);
		white-space: nowrap;
	}

	.live {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 3px 9px;
		border-radius: 999px;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		color: var(--main-color);
		background: rgb(251 92 22 / 0.12);
		border: 1px solid rgb(251 92 22 / 0.35);
	}

	.dot {
		position: relative;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--main-color);
	}

	/* Pulses by transform and opacity, which the compositor animates without repainting. */
	.dot::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: var(--main-color);
		animation: beat 1.6s ease-out infinite;
	}

	@keyframes beat {
		from {
			transform: scale(1);
			opacity: 0.7;
		}
		to {
			transform: scale(3.2);
			opacity: 0;
		}
	}

	.live.offline {
		color: #fbbf24;
		background: rgb(251 191 36 / 0.1);
		border-color: rgb(251 191 36 / 0.35);
	}

	.live.offline .dot,
	.live.offline .dot::after {
		background: #fbbf24;
	}

	.explorer {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 12px;
		border-radius: 10px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text);
		background: rgb(255 255 255 / 0.05);
		border: 1px solid var(--border);
		transition:
			border-color 0.2s,
			background 0.2s;
	}

	.explorer:hover {
		border-color: rgb(251 92 22 / 0.5);
		background: rgb(251 92 22 / 0.1);
	}

	@media (max-width: 520px) {
		.name {
			display: none;
		}
	}
</style>
