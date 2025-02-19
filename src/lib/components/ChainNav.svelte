<script lang="ts">
	import { nodeInfo } from '$lib/store/store';
	import { onMount } from 'svelte';
	import { nFormatter } from '$lib/common/utils';

	let containerWidth: number = 0;
	let container: Element;

	const getNumBlocks = (width: number) => {
		if (width < 420) return 2;
		if (width < 640) return 3;
		if (width < 800) return 4;
		if (width < 1024) return 5;
		return 7;
	};

	$: numBlocks = getNumBlocks(containerWidth);

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			containerWidth = entries[0].contentRect.width;
		});

		resizeObserver.observe(container);
		return () => resizeObserver.disconnect();
	});
</script>

<div bind:this={container} class="fixed bottom-0 left-0 w-full bg-[#333] p-3 md:p-6">
	<div class="flex items-center justify-center gap-8">
		{#each Array(numBlocks) as _, i}
			<div class="flex items-center">
				<!-- Block -->
				<div
					class="flex h-15 w-15 items-center justify-center rounded-lg text-[0.6rem] {i ===
					numBlocks - 1
						? 'pulsing-box bg-primary text-gray-100'
						: 'bg-gray-200 text-gray-900'} {numBlocks > 2
						? 'md:h-18 md:w-18 md:text-[0.7rem]'
						: ''}"
				>
					{nFormatter($nodeInfo.fullHeight - numBlocks + i + 2, 0, false)}
				</div>

				<!-- Connecting dots -->
				{#if i < numBlocks - 1}
					<div class="ms-7 flex gap-2">
						{#if i === numBlocks - 2}
							<!-- Animated dots for the last connection -->
							<div class="animated-dot bg-primary h-1.5 w-1.5 rounded-full"></div>
							<div class="animated-dot bg-primary h-1.5 w-1.5 rounded-full"></div>
							<div class="animated-dot bg-primary h-1.5 w-1.5 rounded-full"></div>
						{:else}
							<!-- Static dots for other connections -->
							<div class="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
							<div class="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
							<div class="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
						{/if}
					</div>
				{/if}
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
</style>
