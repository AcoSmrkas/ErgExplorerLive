<script lang="ts">
	import { onMount } from 'svelte';
	import { nodeInfo, mempoolTxCount } from '$lib/store/store';
	import { nFormatter } from '$lib/common/utils';
	import TransactionsGrid from '$lib/components/TransactionsGrid.svelte';

	let blockHeight: number = $state(0);

	onMount(() => {
		const nodeInfoUnsubscribe = nodeInfo.subscribe((value: any) => {
			if (!value) return;

			blockHeight = value.fullHeight;
		});

		return () => {
			if (nodeInfoUnsubscribe) {
				nodeInfoUnsubscribe();
			}
		};
	});
</script>

<div class="p-2">

	<TransactionsGrid />
</div>
