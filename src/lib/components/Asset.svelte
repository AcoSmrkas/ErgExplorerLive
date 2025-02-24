<script lang="ts">
    import { ERGEXPLORER_URL } from '$lib/common/const';
    import { nFormatter } from '$lib/common/utils';
    import { assetInfos } from '$lib/store/store';
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import BigNumber from 'bignumber.js';
    import { ExternalLink } from 'lucide-svelte';

    // Add a new prop to indicate whether it's an input or output asset
    let { 
        asset, 
        isOnlyAsset = false, 
        assetType = 'normal' // New prop with default value
    } = $props();

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

        if (asset.amount.toNumber() !== 0) {
            amount = new BigNumber(asset.amount).div(new BigNumber(10).pow(decimals)).toNumber();
        } else if (asset.burned.toNumber() !== 0) {
            amount = new BigNumber(asset.burned).div(new BigNumber(10).pow(decimals)).toNumber();
            type = 'burn';
        } else if (asset.minted.toNumber() !== 0) {
            amount = new BigNumber(asset.minted).div(new BigNumber(10).pow(decimals)).toNumber();
            type = 'mint';
        }

        if (assetInfo.iconurl) {
            imageUrl = assetInfo.iconurl ?? '';
        } else if (assetInfo.cachedurl) {
            imageUrl = assetInfo.cachedurl ?? '';
        }
    });
</script>

<a href={link} target="_blank" class="asset-link">
    <div 
        class="asset-card 
        {type === 'burn' ? 'burn' : type === 'mint' ? 'mint' : ''} 
        {assetType === 'input' ? 'input-asset' : assetType === 'output' ? 'output-asset' : ''}"
    >
        <div class="asset-icon">
            {#if imageUrl}
                <img src={imageUrl} alt={name} class="asset-image" />
            {:else}
                <span class="asset-placeholder">{name.slice(0, 3)}</span>
            {/if}
        </div>
        <div class="asset-info">
            <div class="asset-name" title={name}>
                <span>{name.length > 10 ? name.slice(0, 10) + '...' : name}</span>
            </div>
            <div class="asset-amount">{nFormatter(amount)}</div>
        </div>
    </div>
</a>

<style>
    .asset-link {
        text-decoration: none;
        color: inherit;
        min-width: 110px;
		margin-top: -13px;
        max-width: fit-content;
        display: block;
    }

    .asset-card {
        background-color: #1e1e1e;
        height: 48px;
        padding: 4px 6px;
        display: flex;
        align-items: center;
        gap: 6px;
        border-radius: 4px;
        transition: all 0.2s ease;
    }
	.asset-card.input-asset {
        border-left: 2px solid #22c55e; /* Green for input assets */
    }

    .asset-card.output-asset {
        border-left: 2px solid #ef4444; /* Red for output assets */
    }
    .asset-card:hover {
        background-color: #252525;
    }

    .asset-card.burn {
        border-left: 2px solid #ef4444;
    }

    .asset-card.mint {
        border-left: 2px solid #22c55e;
    }

    .asset-icon {
        width: 22px;
        height: 22px;
        min-width: 22px;
        background-color: #2a2a2a;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    .asset-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .asset-placeholder {
        color: #9ca3af;
        font-size: 10px;
    }

    .asset-info {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
        padding-right: 2px;
    }

    .asset-name {
        color: white;
        font-size: 11px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
    }

    .asset-amount {
        color: #9ca3af;
        font-size: 10px;
    }

    .icon-link {
        color: #9ca3af;
        flex-shrink: 0;
    }

    .asset-loading {
        height: 48px;
        width: 110px;
        background: linear-gradient(
            90deg,
            #1e1e1e 0%,
            #252525 50%,
            #1e1e1e 100%
        );
        background-size: 200% 100%;
        animation: pulse 1.5s ease-in-out infinite;
        border-radius: 4px;
        opacity: 0.7;
    }

    @keyframes pulse {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
</style>
