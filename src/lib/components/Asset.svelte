<script lang="ts">
	import { ERGEXPLORER_URL } from '$lib/common/const';
	import { nFormatter } from '$lib/common/utils';
	import { assetInfos } from '$lib/store/store';
	import BigNumber from 'bignumber.js';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

	let { asset } = $props();
	let decimals = $state(0);
	let name = $state('');
	let imageUrl = $state('');

	onMount(() => {
		const assets = get(assetInfos) as {
			[key: string]: {
				decimals: number;
				name: string;
				tokenicon?: string;
				iconurl?: string;
				cachedurl?: string;
			};
		};
		const assetInfo = assets[asset.tokenId];

		decimals = assetInfo.decimals;
		name = assetInfo.name ? assetInfo.name : assetInfo.id.substring(0, 30);

		if (assetInfo.iconurl) {
			imageUrl = assetInfo.iconurl ?? '';
		} else if (assetInfo.cachedurl) {
			imageUrl = assetInfo.cachedurl ?? '';
		}
	});
</script>

<div class="bg-form m-1 flex flex-col gap-1 rounded-sm p-2 pb-1">
    <a target="_new" href={`${ERGEXPLORER_URL}token/${asset.tokenId}`}>
        <div class="h-15 w-15">
            {#if imageUrl}
	            <img class="mx-auto h-auto max-h-15 w-auto max-w-15" src={imageUrl} alt={name} />
            {:else}
                <p class="text-center text-sm w-15 h-15">{name}</p>
            {/if}
        </div>
	<p class="text-center text-sm">
		{nFormatter(new BigNumber(asset.amount).dividedBy(10 ** decimals).toNumber())}
	</p>
    </a>
</div>
