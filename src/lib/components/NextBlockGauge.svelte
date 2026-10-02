<script lang="ts">
	import { backOut } from 'svelte/easing';
	import { reducedMotion } from '$lib/common/motion';

	/**
	 * The next block, being filled. Its outline traces round as time passes and closes
	 * at the two-minute target; inside, a dot per pending tx, in its label's colour,
	 * piles up from the bottom.
	 */
	let {
		progress,
		overdue,
		txs
	}: { progress: number; overdue: boolean; txs: { id: string; color: string }[] } = $props();

	const SIZE = 56;
	const PER_ROW = 6;
	const ROWS = 6;
	const STEP = 7.4;
	const ORIGIN = (SIZE - STEP * (PER_ROW - 1)) / 2;

	let dots = $derived(
		txs.slice(0, PER_ROW * ROWS).map((tx, i) => ({
			...tx,
			x: ORIGIN + (i % PER_ROW) * STEP,
			y: SIZE - ORIGIN - Math.floor(i / PER_ROW) * STEP
		}))
	);
	let full = $derived(txs.length > PER_ROW * ROWS);

	// Grows from its own centre. Scale only: no opacity on SVG children (see .overdue below).
	function pop(node: SVGElement) {
		node.style.transformBox = 'fill-box';
		node.style.transformOrigin = 'center';

		return {
			duration: reducedMotion ? 0 : 320,
			easing: backOut,
			css: (t: number) => `transform: scale(${t})`
		};
	}
</script>

<svg class="gauge" class:overdue viewBox="0 0 {SIZE} {SIZE}" aria-hidden="true">
	<rect class="shell" x="2" y="2" width={SIZE - 4} height={SIZE - 4} rx="11" />
	<rect
		class="time"
		x="2"
		y="2"
		width={SIZE - 4}
		height={SIZE - 4}
		rx="11"
		pathLength="100"
		stroke-dasharray="100"
		stroke-dashoffset={100 * (1 - progress)}
	/>

	{#each dots as dot (dot.id)}
		<circle
			cx={dot.x}
			cy={dot.y}
			r="2.5"
			fill={dot.color}
			transition:pop
		/>
	{/each}

	{#if full}
		<text x={SIZE - 9} y="15" class="more">+</text>
	{/if}
</svg>

<style>
	.gauge {
		flex: none;
		width: var(--gauge-size, 56px);
		height: var(--gauge-size, 56px);
		overflow: visible;
	}

	.shell {
		fill: rgb(251 92 22 / 0.06);
		stroke: rgb(255 255 255 / 0.08);
		stroke-width: 3;
	}

	.time {
		fill: none;
		stroke: var(--main-color);
		stroke-width: 3;
		stroke-linecap: round;
		transition: stroke-dashoffset 1s linear;
	}

	/* Colour, not opacity: an opacity animation on an SVG child gets its own layer, which
	   Chrome draws with a visible square edge. */
	.overdue .time {
		animation: overdue 1.4s ease-in-out infinite;
	}

	@keyframes overdue {
		0%,
		100% {
			stroke: #fbbf24;
		}
		50% {
			stroke: #fb5c16;
		}
	}

	.more {
		font-size: 11px;
		font-weight: 800;
		fill: var(--text);
	}
</style>
