<script lang="ts">
	import { ERGEXPLORER_URL } from '$lib/common/const';
	import { nFormatter } from '$lib/common/utils';
	import { assetInfos } from '$lib/store/store';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import BigNumber from 'bignumber.js';

	let { asset } = $props();
	let decimals = $state(0);
	let name = $state('');
	let imageUrl = $state('');
	let link = $state('');
	let amount = $state(0);
	let type = $state('normal');

	onMount(() => {
		const assets = get(assetInfos) as {
			[key: string]: {
				id: string;
				decimals: number;
				name: string;
				tokenicon?: string;
				iconurl?: string;
				cachedurl?: string;
			};
		};

		if (asset.tokenId !== 'ERG') {
			link = `${ERGEXPLORER_URL}token/${asset.tokenId}`;
		}

		const assetInfo = assets[asset.tokenId];

		if (!assetInfo) {
			name = asset.tokenId;
			console.error('No asset info for', asset.tokenId);
			return;
		}

		decimals = assetInfo.decimals;
		name = assetInfo.name ? assetInfo.name : assetInfo.id;

		if (asset.burned.toNumber() !== 0) {
			amount = new BigNumber(asset.burned).div(10 ** decimals).toNumber();
			type = 'burn';
		} else if (asset.minted.toNumber() !== 0) {
			amount = new BigNumber(asset.minted).div(10 ** decimals).toNumber();
			type = 'mint';
		} else if (asset.amount.toNumber() !== 0) {
			amount = new BigNumber(asset.amount).div(10 ** decimals).toNumber();
		}

		if (assetInfo.iconurl) {
			imageUrl = assetInfo.iconurl ?? '';
		} else if (assetInfo.cachedurl) {
			imageUrl = assetInfo.cachedurl ?? '';
		}
	});
</script>

<div
	class="bg-form m-1 flex flex-col gap-1 rounded-sm p-2 pb-1 {type == 'burn'
		? 'border-1 border-red-500'
		: type == 'mint'
			? 'border-1 border-green-500'
			: ''}"
>
	<a target="_new" {...link && { href: link }}>
		<div class="align-center flex h-15 w-15 justify-center">
			{#if imageUrl}
				<img
					class="place-center mx-auto h-auto max-h-15 w-auto max-w-15"
					src={imageUrl}
					alt={name}
					title={name}
				/>
			{:else}
				<p title={name} class="text-dynamic h-15 w-15 overflow-hidden text-center text-ellipsis">
					{name}
				</p>
			{/if}
		</div>
		<p class="text-center text-sm">
			{nFormatter(amount)}
		</p>
	</a>
</div>

<style>
	.text-dynamic {
		font-size: clamp(0.5em, 2.5vw, 0.65em);
	}
</style>
