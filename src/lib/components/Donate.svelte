<script lang="ts">
	import { onMount } from 'svelte';
	import { DONATION_ADDRESS, ERGEXPLORER_URL } from '$lib/common/const';
	import { reducedMotion } from '$lib/common/motion';

	// Pink, red with a lub-dub heartbeat on hover, like the footer heart on ergexplorer.com. Now and
	// then it beats on its own and a small heart floats up out of it: on one page in six a few seconds
	// after it loads, and on a page left open about every three minutes.
	let beating = $state(false);

	onMount(() => {
		if (reducedMotion) return;

		const beat = (chance: number) => {
			if (!document.hidden && Math.random() < chance) beating = true;
		};

		const first = setTimeout(beat, 3000 + Math.random() * 5000, 1 / 6);
		const every = setInterval(beat, 20000, 1 / 9);

		return () => {
			clearTimeout(first);
			clearInterval(every);
		};
	});

	// The floating heart's own animationend bubbles here too, so only the beat itself ends it.
	function ended(e: AnimationEvent) {
		if (e.animationName.endsWith('heartbeat')) beating = false;
	}
</script>

<a
	class="donate"
	href="{ERGEXPLORER_URL}addresses/{DONATION_ADDRESS}"
	target="_blank"
	rel="noopener"
	aria-label="Donate"
>
	<span class="hidden sm:inline">Donate</span>
	<span class="heart" class:beating aria-hidden="true" onanimationend={ended}>&hearts;</span>
</a>

<style>
	.donate {
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

	.donate:hover {
		border-color: rgb(255 59 92 / 0.5);
		background: rgb(255 59 92 / 0.1);
	}

	.heart {
		position: relative;
		display: inline-block;
		font-size: 0.95rem;
		line-height: 1;
		color: pink;
		transition: color 0.3s ease;
	}

	.donate:hover .heart,
	.heart.beating {
		color: #ff3b5c;
		animation: heartbeat 1.2s ease-in-out infinite;
	}

	.heart.beating {
		animation-iteration-count: 2;
	}

	.heart.beating::after {
		content: '\2665';
		position: absolute;
		top: 0;
		left: 50%;
		font-size: 0.7em;
		pointer-events: none;
		animation: heart-float 1.8s ease-out forwards;
	}

	@keyframes heartbeat {
		0%,
		45%,
		100% {
			transform: scale(1);
		}
		12% {
			transform: scale(1.3);
		}
		24% {
			transform: scale(1.05);
		}
		34% {
			transform: scale(1.22);
		}
	}

	@keyframes heart-float {
		from {
			opacity: 0.9;
			transform: translate(-50%, 0);
		}
		to {
			opacity: 0;
			transform: translate(-10%, -1.6em) scale(0.8);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.donate:hover .heart,
		.heart.beating {
			animation: none;
		}

		.heart.beating::after {
			display: none;
		}
	}
</style>
