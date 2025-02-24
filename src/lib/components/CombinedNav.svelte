<!-- CombinedNav.svelte -->
<script lang="ts">
    import { nodeInfo, mempoolTxCount, mempoolTxs, assetInfos } from '$lib/store/store';
    import { onMount } from 'svelte';
    import { nFormatter, resolveTxBoxes, trackNetAssetTransfers } from '$lib/common/utils';
    import BigNumber from 'bignumber.js';

    import { transactionManager } from '$lib/utils/TransactionManager';
    import { speechManager } from '$lib/utils/SpeechManager';
    import { Volume2, VolumeX, Mic, MicOff, BarChart4 } from 'lucide-svelte';

    let speechEnabled = $state(true);
    let mobileExpanded = $state(false);

    function toggleSpeech() {
        speechEnabled = !speechEnabled;
        if (!speechEnabled) {
            speechManager.stop();
        }
    }

    function toggleMobileMenu() {
        mobileExpanded = !mobileExpanded;
    }

    let blockTime = $state(0);
    let ergPrice = $state(0);
    let totalValue = $state(new BigNumber(0));
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

<div class="fixed bottom-0 left-0 w-full bg-[#333] p-2 sm:p-3 z-50">
    <!-- Mobile View -->
    <div class="flex lg:hidden items-center justify-between">
        <div class="flex items-center gap-2">
            <a href="/" class="flex items-center">
                <img
                    class="h-7 w-auto"
                    src="https://ergexplorer.com/images/logo.png"
                    alt="Logo"
                />
            </a>
            <div class="flex items-center">
                <div class="chain-box flex gap-1 mr-1">
                    <div class="animated-dot h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <div class="animated-dot h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <div class="animated-dot h-1.5 w-1.5 rounded-full bg-primary"></div>
                </div>
                <span class="text-xs text-gray-400">Live</span>
            </div>
        </div>
        
        <!-- Primary Stats (Always Visible on Mobile) -->
        <div class="flex gap-2">
            <!-- Block Info -->
            <div class="flex items-center rounded-lg bg-[#1e1e1e] p-1.5">
                <div class="flex flex-col items-center">
                    <span class="text-[10px] text-gray-400">Block</span>
                    <span class="text-sm font-semibold text-primary">
                        #{nFormatter($nodeInfo?.fullHeight || 0, 0, false)}
                    </span>
                </div>
            </div>

            <!-- ERG Price -->
            <div class="flex items-center rounded-lg bg-[#1e1e1e] p-1.5">
                <div class="flex flex-col items-center">
                    <span class="text-[10px] text-gray-400">ERG</span>
                    <span class="text-sm font-semibold text-primary">
                        ${ergPrice.toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
        
        <!-- Toggle Button -->
        <button 
            class="p-1.5 bg-[#1e1e1e] rounded-lg flex items-center justify-center"
            on:click={toggleMobileMenu}
        >
            <BarChart4 size={20} class={mobileExpanded ? "text-primary" : "text-gray-400"} />
        </button>
    </div>
    
    <!-- Expandable Mobile Menu -->
    {#if mobileExpanded}
        <div class="mt-2 grid grid-cols-3 gap-2 lg:hidden">
            <!-- Network Stats -->
            <div class="flex items-center justify-center rounded-lg bg-[#1e1e1e] p-2">
                <div class="flex flex-col items-center">
                    <span class="text-[10px] text-gray-400">Network</span>
                    <span class="text-xs font-semibold text-primary">
                        {formatHashrate($nodeInfo?.difficulty || 0)}
                    </span>
                </div>
            </div>

            <!-- Mempool Stats -->
            <div class="flex items-center justify-center rounded-lg bg-[#1e1e1e] p-2">
                <div class="flex flex-col items-center">
                    <span class="text-[10px] text-gray-400">Mempool</span>
                    <span class="text-xs font-semibold text-primary">
                        {nFormatter($mempoolTxCount || 0, 0, false)} tx
                    </span>
                </div>
            </div>

            <!-- Top Traded Token -->
            {#if topToken.name}
                <div class="flex items-center justify-center rounded-lg bg-[#1e1e1e] p-2">
                    <div class="flex flex-col items-center">
                        <span class="text-[10px] text-gray-400">Top Token</span>
                        <span class="text-xs font-semibold text-primary">
                            {topToken.name.length > 6 ? `${topToken.name.slice(0, 6)}...` : topToken.name}
                        </span>
                    </div>
                </div>
            {/if}

            <!-- Controls in the second row -->
            <div class="col-span-3 flex justify-center gap-3 mt-1">
                <!-- Sound Control -->
                <button 
                    class="flex items-center rounded-lg bg-[#1e1e1e] p-2 transition-colors hover:bg-[#2a2a2a]"
                    on:click={toggleSound}
                >
                    {#if soundEnabled}
                        <Volume2 size={20} class="text-primary" />
                    {:else}
                        <VolumeX size={20} class="text-gray-400" />
                    {/if}
                </button>
            
                <!-- Speech Control -->
                <button 
                    class="flex items-center rounded-lg bg-[#1e1e1e] p-2 transition-colors hover:bg-[#2a2a2a]"
                    on:click={toggleSpeech}
                >
                    {#if speechEnabled}
                        <Mic size={20} class="text-primary" />
                    {:else}
                        <MicOff size={20} class="text-gray-400" />
                    {/if}
                </button>
            </div>
        </div>
    {/if}

    <!-- Desktop View -->
    <div class="hidden lg:flex mx-auto max-w-screen-2xl flex-wrap items-center justify-between gap-3 px-4">
        <!-- Logo and Network Status -->
        <div class="flex items-center gap-4">
            <a href="/" class="flex items-center gap-2">
                <img
                    class="h-8 w-auto"
                    src="https://ergexplorer.com/images/logo.png"
                    alt="Logo"
                />
            </a>
            <div class="flex items-center gap-2">
                <div class="chain-box flex gap-1">
                    <div class="animated-dot h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <div class="animated-dot h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <div class="animated-dot h-1.5 w-1.5 rounded-full bg-primary"></div>
                </div>
                <span class="text-sm text-gray-400">Live</span>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="flex flex-1 flex-wrap items-center justify-center gap-3 px-4">
            <!-- Block Info -->
            <div class="flex items-center rounded-lg bg-[#1e1e1e] p-3">
                <div class="flex flex-col">
                    <span class="text-xs text-gray-400">Block</span>
                    <span class="text-lg font-semibold text-primary">
                        #{nFormatter($nodeInfo?.fullHeight || 0, 0, false)}
                        <span class="text-sm text-gray-400">({formattedTime})</span>
                    </span>
                </div>
            </div>

            <!-- Network Stats -->
            <div class="flex items-center rounded-lg bg-[#1e1e1e] p-3">
                <div class="flex flex-col">
                    <span class="text-xs text-gray-400">Network</span>
                    <span class="text-lg font-semibold text-primary">
                        {formatHashrate($nodeInfo?.difficulty || 0)}
                    </span>
                </div>
            </div>

            <!-- Mempool Stats -->
            <div class="flex items-center rounded-lg bg-[#1e1e1e] p-3">
                <div class="flex flex-col">
                    <span class="text-xs text-gray-400">Mempool</span>
                    <span class="text-lg font-semibold text-primary">
                        {nFormatter($mempoolTxCount || 0, 0, false)} tx
                    </span>
                </div>
            </div>

            <!-- Top Traded Token -->
            {#if topToken.name}
            <div class="flex items-center rounded-lg bg-[#1e1e1e] p-3">
                <div class="flex flex-col">
                    <span class="text-xs text-gray-400">Most Active Token</span>
                    <span class="text-lg font-semibold text-primary">
                        {topToken.name.length > 10 ? `${topToken.name.slice(0, 10)}...` : topToken.name}
                        <span class="text-sm text-gray-400">
                            ({nFormatter(topToken.amount.div(10 ** topToken.decimals).toNumber(), 0, false)})
                        </span>
                    </span>
                </div>
            </div>
            {/if}

            <!-- Market Info -->
            <div class="flex items-center rounded-lg bg-[#1e1e1e] p-3">
                <div class="flex flex-col">
                    <span class="text-xs text-gray-400">ERG Price</span>
                    <span class="text-lg font-semibold text-primary">
                        ${ergPrice.toFixed(3)}
                    </span>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <!-- Sound Control -->
                <button 
                    class="flex items-center rounded-lg bg-[#1e1e1e] p-3 transition-colors hover:bg-[#2a2a2a]"
                    on:click={toggleSound}
                >
                    {#if soundEnabled}
                        <Volume2 size={24} class="text-primary" />
                    {:else}
                        <VolumeX size={24} class="text-gray-400" />
                    {/if}
                </button>
            
                <!-- Speech Control -->
                <button 
                    class="flex items-center rounded-lg bg-[#1e1e1e] p-3 transition-colors hover:bg-[#2a2a2a]"
                    on:click={toggleSpeech}
                >
                    {#if speechEnabled}
                        <Mic size={24} class="text-primary" />
                    {:else}
                        <MicOff size={24} class="text-gray-400" />
                    {/if}
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Bottom padding to avoid content being hidden under the navbar -->
<div class="pb-14 sm:pb-16 lg:pb-16"></div>

<style>
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