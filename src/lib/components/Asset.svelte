<script lang="ts">
	import { ERGEXPLORER_URL } from '$lib/common/const';
	import { nFormatter, type Transfer } from '$lib/common/utils';
	import { assetInfos } from '$lib/store/store';
	import BigNumber from 'bignumber.js';

	type AssetInfo = {
		id: string;
		decimals: number;
		name: string;
		tokenicon?: string;
		iconurl?: string;
		cachedurl?: string;
	};

	let { asset }: { asset: Transfer } = $props();

	// Reactive, so a tile rendered before its token's info arrived picks it up later.
	let assetInfo = $derived(($assetInfos as { [key: string]: AssetInfo })[asset.tokenId]);
	let decimals = $derived(assetInfo?.decimals ?? 0);
	let name = $derived(assetInfo ? assetInfo.name || assetInfo.id : asset.tokenId);
	let imageUrl = $derived(assetInfo?.iconurl || assetInfo?.cachedurl || '');
	let link = $derived(asset.tokenId !== 'ERG' ? `${ERGEXPLORER_URL}token/${asset.tokenId}` : '');
	let type = $derived(
		!asset.burned.isZero() ? 'burn' : !asset.minted.isZero() ? 'mint' : 'normal'
	);
	let amount = $derived(
		new BigNumber(type === 'burn' ? asset.burned : type === 'mint' ? asset.minted : asset.amount)
			.div(10 ** decimals)
			.toNumber()
	);
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
