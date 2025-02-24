<!-- CombinedNav.svelte -->
<script lang="ts">
    import { nodeInfo, mempoolTxCount, mempoolTxs, assetInfos } from '$lib/store/store';
    import { onMount } from 'svelte';
    import { nFormatter, resolveTxBoxes, trackNetAssetTransfers } from '$lib/common/utils';
    import BigNumber from 'bignumber.js';
    import { Volume2, VolumeX } from 'lucide-svelte';
    import { transactionManager } from '$lib/utils/TransactionManager';

    let blockTime = $state(0);
    let ergPrice = $state(0);
    let topToken = $state({ tokenId: '', amount: new BigNumber(0), name: '', decimals: 0 });
    let soundEnabled = $state(true);
    let intervalId: number;
    
    let formattedTime = $derived(`${Math.floor(blockTime / 60)}:${(blockTime % 60).toString().padStart(2, '0')}`);

    // Calculate top traded token from mempool transactions
    $effect(() => {
        if ($mempoolTxs && $assetInfos) {
            const tokenVolumes = new Map();
            
            $mempoolTxs.forEach(tx => {
                const proxyTx = resolveTxBoxes(tx);
                const uniqueAssets = trackNetAssetTransfers(proxyTx);
                
                Object.values(uniqueAssets).forEach(asset => {
                    if (asset.tokenId === 'ERG') return;
                    
                    const currentAmount = tokenVolumes.get(asset.tokenId) || new BigNumber(0);
                    const transferAmount = asset.amount || new BigNumber(0);
                    tokenVolumes.set(asset.tokenId, currentAmount.plus(transferAmount.abs()));
                });
            });

            let maxVolume = new BigNumber(0);
            let maxTokenId = '';

            tokenVolumes.forEach((volume, tokenId) => {
                if (volume.isGreaterThan(maxVolume)) {
                    maxVolume = volume;
                    maxTokenId = tokenId;
                }
            });

            if (maxTokenId && $assetInfos[maxTokenId]) {
                const assetInfo = $assetInfos[maxTokenId];
                topToken = {
                    tokenId: maxTokenId,
                    amount: maxVolume,
                    name: assetInfo.name || assetInfo.id,
                    decimals: assetInfo.decimals
                };
            }
        }
    });

    function toggleSound() {
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
            transactionManager.resumeProcessing();
        } else {
            transactionManager.pauseProcessing();
        }
    }

    // Fetch ERG price
    async function fetchErgPrice() {
        try {
            const response = await fetch('https://api.ergexplorer.com/tokens/getErgPrice');
            const data = await response.json();
            if (data?.items?.[0]?.value) {
                ergPrice = parseFloat(data.items[0].value);
            }
        } catch (error) {
            console.error('Error fetching ERG price:', error);
        }
    }

    onMount(() => {
        intervalId = setInterval(() => {
            blockTime += 1;
        }, 1000);

        fetchErgPrice();
        const priceInterval = setInterval(fetchErgPrice, 300000);

        return () => {
            clearInterval(intervalId);
            clearInterval(priceInterval);
        };
    });

    // Reset timer when new block arrives
    $effect(() => {
        if ($nodeInfo?.fullHeight) {
            blockTime = 0;
        }
    });

    const formatHashrate = (difficulty: number) => {
        const hashrate = difficulty / 120.0;
        if (hashrate < 1e3) return `${hashrate.toFixed(2)} H/s`;
        if (hashrate < 1e6) return `${(hashrate/1e3).toFixed(2)} KH/s`;
        if (hashrate < 1e9) return `${(hashrate/1e6).toFixed(2)} MH/s`;
        if (hashrate < 1e12) return `${(hashrate/1e9).toFixed(2)} GH/s`;
        if (hashrate < 1e15) return `${(hashrate/1e12).toFixed(2)} TH/s`;
        return `${(hashrate/1e15).toFixed(2)} PH/s`;
    };
</script>

<footer class="fixed bottom-0 left-0 w-full bg-[#333] py-2 px-4">
    <div class="max-w-screen-2xl mx-auto">
        <div class="flex flex-wrap items-center justify-between gap-2">
            <!-- Logo and Live Indicator -->
            <div class="flex items-center gap-2">
                <img
                    class="h-6 w-auto"
                    src="https://ergexplorer.com/images/logo.png"
                    alt="Logo"
                />
                <div class="flex items-center gap-1">
                    <div class="chain-box flex gap-1">
                        <div class="animated-dot h-1 w-1 rounded-full bg-primary"></div>
                        <div class="animated-dot h-1 w-1 rounded-full bg-primary"></div>
                        <div class="animated-dot h-1 w-1 rounded-full bg-primary"></div>
                    </div>
                    <span class="text-[10px] text-gray-400 hidden sm:inline">Live</span>
                </div>
            </div>

            <!-- Responsive Stats Grid -->
            <div class="grid grid-cols-3 sm:grid-cols-5 gap-2 items-center">
                <!-- Block Info -->
                <div class="flex flex-col items-center text-center">
                    <span class="text-[10px] text-gray-400">Block</span>
                    <span class="text-sm font-semibold text-primary">
                        #{nFormatter($nodeInfo?.fullHeight || 0, 0, false)}
                        <span class="text-[10px] text-gray-400 hidden sm:inline">({formattedTime})</span>
                    </span>
                </div>

                <!-- Network Stats -->
                <div class="flex flex-col items-center text-center">
                    <span class="text-[10px] text-gray-400">Network</span>
                    <span class="text-sm font-semibold text-primary">
                        {formatHashrate($nodeInfo?.difficulty || 0)}
                    </span>
                </div>

                <!-- Mempool Stats -->
                <div class="flex flex-col items-center text-center">
                    <span class="text-[10px] text-gray-400">Mempool</span>
                    <span class="text-sm font-semibold text-primary">
                        {nFormatter($mempoolTxCount || 0, 0, false)} tx
                    </span>
                </div>

                <!-- Top Traded Token (Hidden on small screens) -->
                {#if topToken.name}
                <div class="flex-col items-center text-center hidden sm:flex">
                    <span class="text-[10px] text-gray-400">Most Active</span>
                    <span class="text-sm font-semibold text-primary">
                        {topToken.name.length > 10 ? `${topToken.name.slice(0, 10)}...` : topToken.name}
                    </span>
                </div>
                {/if}

                <!-- Market Info -->
                <div class="flex flex-col items-center text-center">
                    <span class="text-[10px] text-gray-400">ERG Price</span>
                    <span class="text-sm font-semibold text-primary">${ergPrice.toFixed(3)}</span>
                </div>
            </div>

            <!-- Sound Control -->
            <div class="flex items-center">
                <button 
                    class="rounded-lg bg-[#1e1e1e] p-2 transition-colors hover:bg-[#2a2a2a]"
                    on:click={toggleSound}
                >
                    {#if soundEnabled}
                        <Volume2 size={20} class="text-primary" />
                    {:else}
                        <VolumeX size={20} class="text-gray-400" />
                    {/if}
                </button>
            </div>
        </div>
    </div>
</footer>

<style>
    /* Existing animations remain the same */
    @keyframes loadingDot {
        0%, 80%, 100% {
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

    .chain-box {
        transition: all 0.15s ease;
    }
</style>