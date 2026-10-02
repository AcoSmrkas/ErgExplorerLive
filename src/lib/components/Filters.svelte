<script lang="ts">
	import type { Label } from '$lib/common/labels';
	import { leaveForFilter } from '$lib/common/motion';
	import { labelFilter } from '$lib/store/store';

	let { labels }: { labels: Label[] } = $props();

	// One chip per group on screen (all mining pools together), busiest first.
	let groups = $derived.by(() => {
		const counts = new Map<string, { name: string; color: string; count: number }>();
		for (const label of labels) {
			const group = counts.get(label.group) ?? { name: label.group, color: label.color, count: 0 };
			group.count++;
			counts.set(label.group, group);
		}
		return [...counts.values()].sort((a, b) => b.count - a.count);
	});

	// A filter on a group that has left the mempool would show nothing.
	$effect(() => {
		if ($labelFilter && !groups.some((g) => g.name === $labelFilter)) {
			labelFilter.set(null);
		}
	});

	function pick(group: string | null) {
		leaveForFilter();
		labelFilter.set($labelFilter === group ? null : group);
	}
</script>

{#if groups.length > 0}
	<div class="filters" role="toolbar" aria-label="Filter transactions by type">
		<button class="chip" class:active={$labelFilter === null} onclick={() => pick(null)}>
			All <span class="count mono">{labels.length}</span>
		</button>
		{#each groups as group (group.name)}
			<button
				class="chip"
				class:active={$labelFilter === group.name}
				style="--accent: {group.color}"
				aria-pressed={$labelFilter === group.name}
				onclick={() => pick(group.name)}
			>
				<span class="dot"></span>
				{group.name}
				<span class="count mono">{group.count}</span>
			</button>
		{/each}
	</div>
{/if}

<style>
	.filters {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		scrollbar-width: none;
		padding: 2px;
		mask-image: linear-gradient(90deg, #000 92%, transparent);
	}

	.filters::-webkit-scrollbar {
		display: none;
	}

	.chip {
		--accent: var(--main-color);
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 6px 11px;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--muted);
		background: rgb(255 255 255 / 0.03);
		border: 1px solid var(--border);
		cursor: pointer;
		transition:
			color 0.2s,
			background 0.2s,
			border-color 0.2s;
	}

	.chip:hover {
		color: var(--text);
		border-color: color-mix(in oklab, var(--accent) 55%, var(--border));
	}

	.chip.active {
		color: var(--text);
		background: color-mix(in oklab, var(--accent) 16%, transparent);
		border-color: color-mix(in oklab, var(--accent) 60%, transparent);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 8px color-mix(in oklab, var(--accent) 70%, transparent);
	}

	.count {
		font-size: 0.72rem;
		color: var(--faint);
	}

	.chip.active .count {
		color: var(--muted);
	}
</style>
