<script lang="ts">
	import { nodeInfo } from '$lib/store/store';
	import { onMount } from 'svelte';
	import { nFormatter } from '$lib/common/utils';
	import { fly } from 'svelte/transition';

	let containerWidth: number = $state(0);
	let container: Element;

	const getNumBlocks = (width: number) => {
		if (width < 290) return 1;
		if (width < 450) return 2;
		if (width < 620) return 3;
		if (width < 800) return 4;
		if (width < 1150) return 5;
		return 7;
	};

	let numBlocks = $derived(getNumBlocks(containerWidth));

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			containerWidth = entries[0].contentRect.width;
		});

		resizeObserver.observe(container);
		return () => resizeObserver.disconnect();
	});
</script>

<div
	bind:this={container}
	in:fly={{ y: 200, duration: 300, delay: 500 }}
	class="fixed bottom-0 left-0 w-full bg-[#333] p-3 md:p-6"
>
	<div class="flex items-center justify-center gap-8">
		{#each Array(numBlocks) as _, i}
			<div class="flex items-center">
				<!-- Connecting dots -->
				{#if i < numBlocks}
					<div class="chain-box me-8 flex gap-2">
						{#if i === numBlocks - 1}
							<!-- Animated dots for the last connection -->
							<div class="animated-dot bg-primary h-1.5 w-1.5 rounded-full"></div>
							<div class="animated-dot bg-primary h-1.5 w-1.5 rounded-full"></div>
							<div class="animated-dot bg-primary h-1.5 w-1.5 rounded-full"></div>
						{:else if i === 0}
							<!-- Static dots for other connections -->
							<div class="h-1.5 w-1.5 rounded-full bg-gray-600"></div>
							<div class="h-1.5 w-1.5 rounded-full bg-gray-500"></div>
							<div class="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
						{:else}
							<!-- Static dots for other connections -->
							<div class="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
							<div class="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
							<div class="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
						{/if}
					</div>
				{/if}

				<!-- Block -->
				<a {...i == numBlocks - 1 && { href: '/mempool' }}>
					<div
						class="chain-box flex h-15 w-15 items-center justify-center rounded-lg text-[0.6rem] {i ===
						numBlocks - 1
							? 'pulsing-box bg-primary text-gray-100'
							: 'bg-gray-200 text-gray-900'} {numBlocks > 2
							? 'md:h-18 md:w-18 md:text-[0.7rem]'
							: ''}"
					>
						{nFormatter($nodeInfo?.fullHeight - numBlocks + i + 2, 0, false)}
					</div>
				</a>
			</div>
		{/each}
	</div>
</div>

<style>
	@keyframes loadingDot {
		0%,
		80%,
		100% {
			opacity: 0.2;
			transform: scale(0.8);
		}
		40% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.animated-dot:nth-child(1) {
		animation: loadingDot 1.15s infinite ease-in-out both;
	}
	.animated-dot:nth-child(2) {
		animation: loadingDot 1.15s infinite ease-in-out both;
		animation-delay: 0.2s;
	}
	.animated-dot:nth-child(3) {
		animation: loadingDot 1.15s infinite ease-in-out both;
		animation-delay: 0.4s;
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(251, 92, 22, 0.7);
		}
		100% {
			box-shadow: 0 0 15px 15px rgba(251, 92, 22, 0);
		}
	}

	.pulsing-box {
		animation: pulse 1.15s infinite ease-out;
	}

	.chain-box {
		transition: all 0.15s ease;
	}

	.chain-box:hover {
		scale: 1.05;
	}
</style>
