<!-- Transaction.svelte - Script Section (Updated) -->
<script lang="ts">
    import { BigNumber } from 'bignumber.js';
    import { nFormatter, resolveTxBoxes, trackNetAssetTransfers } from '$lib/common/utils';
    import { onMount, createEventDispatcher } from 'svelte';
    import Box from '$lib/components/Box.svelte';
    import Asset from './Asset.svelte';
    import SmallLoading from '$lib/components/SmallLoading.svelte';
    import ErgExplorerLink from './ErgExplorerLink.svelte';
    import { fade } from 'svelte/transition';
    import { ERGEXPLORER_URL } from '$lib/common/const';
    import { ExternalLink } from 'lucide-svelte';
    import { audioManager } from '$lib/utils/AudioManager';
    import { transactionManager } from '$lib/utils/TransactionManager';

    const dispatch = createEventDispatcher();

    // Constants
    const EXCLUDED_LABELS = ["Ergo Platform (Miner Fee)"];

    // Special transaction configurations
    const SPECIAL_CONFIG = {
        MIXERS: {
            tokens: ['1a6a8c16e4b1cc9d73d03183565cfb8e79dd84198cb66beeed7d3463e0da2b98'],
            label: 'Mixer',
            style: 'bg-purple-500/70',
            sound: 'mixer'
        },
        SIGUSD_ORACLE: {
            addresses: ['AucEQEJ3Y5Uhmu4o8dsrHy28nRTgX5sVtXvjpMTqdMQzBR3uRVcvCFbv7SeGuPhQ16AXBP7XWdMShDdhRy4cayZgxHSkdAVuTiZRvj6WCfmhXJ4LY2E46CytRAnkiYubCdEroUUX2niMLhjNmDUn4KmXWSrKngrfGwHSaD8RJUMEp5AGADaChRU6kAnh9nstkDN3'],
            tokens: ['011d3364de07e5a26f0c4eef0852cddb387039a921b7154ef3cab22c6eda887f'],
            label: 'SigUSD Oracle',
            style: 'bg-blue-500/70',
            sound: 'sigusd'
        },
        Rosen_Bridge_Binance_test: {
            addresses: ['2Eit2LFRqu2Mo33z3pYTJRHNCNzNQ51TP2C7dZhBWYB7eCYDNpJy3gjXAJbr3fUtKaZLDQTSw4uZG5sgWWpTmbNQHKxjP2Z3zCqxhaJeLc6tHXQzBop9dHSvFaiGkFZj7RjMvrWnHHA79zpgvwYAKmeRRquAcJV2jsGc8Uvdf3gEpueLPUfRLKHwfqVZsyPheMWfgbUpLRP1zCZRrDRmz9DshmMD5VjxGHtvrWZwxGe3KYNZUis8pixkpMfXVggXJvc57Xig3RxZ3fT2AAuhYeGrzjH74dj44FtyCVa3veMXXDpimkL2qGQ7vnd1Uh6dw5z1KGmJUkbwtoBdq5m9Zcg1mrvTqhk2pE1MM1K4Ax7hgANjWmBXn2nx6cyxUyji1nPKzJdWxYCC7PhRdRqC9mfFxnNg8CJPsyFaTj2FxxAe1bDhL6QaQ9ac4tgUXfG5tKMukdzDJ4o3ibvwTxXffiA2V9kpHo2PNXGTVkvLS7TAqe9xNJN9sqqC9DXYJsTvEQsbbF3WUb8bcYuGk4K4ftdBWEiC6kNKFeqvn6D5uyD5Kf3G1diaPqVbxuoQ6qMEPXgRiRQB5ANJHBxB9HxX186JmKVkRbx3qxzar35aaStHzbzDjPvgvBjhkFcUVRg8DnuHpaXPw83z6FQDC9MCJAhGao4kQvgh7HtMufLZtuZjaMNnE8SVwm87yQBEh4NtyqTGvG'],
            tokens: ['34529f875cad2bf58c5ffb4a9056d26c590f0c35f77958a68dcdb4aa39b437aa'],
            label: ' Rosen Bridge Binance test',
            style: 'bg-orange-500/70',
            sound: 'sigusd'
        },
        DUCKPOOL_BORROW: {
            tokens: ['1d7857a82d2f3d00d58cbd3b6ad337c98b6aa5e1021a17deb7527e0c3c148be7'],
            label: 'Duckpools',
            style: 'bg-green-500/70',
            sound: 'dex'
        },
        DUCKPOOL_RSADA: {
            tokens: ["35f826497f8eadf5b46f768485cec175c35c11360b4821ea92bbbe855777b55c"],
            label: 'Duckpool rsADA',
            style: 'bg-pink-500/70',
            sound: 'dex'
        }
    };

    let { transaction } = $props();
    let thisTransaction: any = $state({});
    let showBoxDetails = $state(false);
    let showCoolBoxDetails = $state(true);
    let assets: { [key: string]: { tokenId: string; decimals: number; amount: any; name?: string } } = $state({});
    let txLabels: Array<{label: string, style: string, sound?: string}> = $state([]);
    let addressBook = $state(new Map());

    let totalValue: BigNumber = $derived(
        transaction.outputs.reduce(
            (total: BigNumber, output: any) => total.plus(output.value),
            new BigNumber(0)
        )
    );
 // Function to check if transaction is between the same addresses
 function checkSameAddressTransaction(tx: any): boolean {
        if (!tx || !tx.inputs || !tx.outputs) return false;
        
        // Check if there's only one unique address across all inputs and outputs
        const allAddresses = new Set();
        
        // Collect all input addresses
        tx.inputs.forEach(input => {
            if (input.address) {
                allAddresses.add(input.address);
            }
        });
        
        // Collect all output addresses
        tx.outputs.forEach(output => {
            if (output.address) {
                allAddresses.add(output.address);
            }
        });
        
        // If there's only one unique address (excluding fee addresses), hide the transaction
        console.log(`📊 Transaction ${tx.id} has ${allAddresses.size} unique addresses`);
        
        if (allAddresses.size === 1) {
            console.log(`🔍 Transaction ${tx.id} is between the same address - hiding`);
            return true;
        }
        
        // Alternative check: If all inputs match all outputs (excluding fee addresses)
        const inputAddresses = new Set(tx.inputs.map(input => input.address));
        const outputAddresses = new Set(tx.outputs.map(output => output.address));
        
        // Remove known fee addresses from both sets
        const feeAddresses = new Set(["MINER_FEE_ADDRESS"]);  // Add any known fee addresses here
        feeAddresses.forEach(addr => {
            inputAddresses.delete(addr);
            outputAddresses.delete(addr);
        });
        
        // Check if input and output sets are identical
        if (inputAddresses.size === outputAddresses.size && 
            [...inputAddresses].every(addr => outputAddresses.has(addr))) {
            console.log(`🔍 Transaction ${tx.id} has matching input/output addresses - hiding`);
            return true;
        }
        
        return false;
    }
    function checkForSpecialTokens(tx: any, tokenList: string[], requireBothInputOutput = false) {
        return tokenList.some(tokenId => {
            const hasInInputs = tx.inputs.some(input => 
                input.assets?.some(asset => asset.tokenId === tokenId)
            );
            const hasInOutputs = tx.outputs.some(output => 
                output.assets?.some(asset => asset.tokenId === tokenId)
            );
            return requireBothInputOutput ? (hasInInputs && hasInOutputs) : (hasInInputs || hasInOutputs);
        });
    }
    
    function checkForSpecialAddress(tx: any, addressList: string[]) {
        return addressList.some(address => {
            const isInInputs = tx.inputs.some(input => input.address === address);
            const isInOutputs = tx.outputs.some(output => output.address === address);
            return isInInputs || isInOutputs;
        });
    }

    async function fetchAddressBook() {
        try {
            const PAGE_SIZE = 30;
            const newAddressBook = new Map();
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
                const response = await fetch(
                    `https://api.ergexplorer.com/addressbook/getAddresses?offset=${offset}&limit=${PAGE_SIZE}&type=all&order=nameAsc&testnet=0`
                );
                const data = await response.json();
                
                if (!data || !data.items || data.items.length === 0) {
                    hasMore = false;
                    continue;
                }

                data.items.forEach(item => {
                    newAddressBook.set(item.address, {
                        name: item.name,
                        type: item.type,
                        urltype: item.urltype
                    });
                });

                if (data.items.length < PAGE_SIZE) {
                    hasMore = false;
                }

                offset += PAGE_SIZE;
            }

            addressBook = newAddressBook;
            console.log('📖 Address book loaded with', addressBook.size, 'entries');
        } catch (error) {
            console.error('Error fetching address book:', error);
        }
    }


    function extractSkyharbourPrice(transaction: any): string | null {
        // Look for outputs with Sky Harbor address
        const skyharbourOutput = transaction.outputs.find((output: any) => {
            const addressInfo = addressBook.get(output.address);
            return addressInfo && addressInfo.name === 'Sky Harbor';
        });

        if (skyharbourOutput && skyharbourOutput.additionalRegisters) {
            // Check if R4 register exists and contains the price
            const r4 = skyharbourOutput.additionalRegisters.R4;
            
            if (r4) {
                try {
                    // Convert using Math.pow
                    const priceInErg = Number(r4) / Math.pow(10, 9);
                    
                    return priceInErg.toFixed(2);
                } catch (error) {
                    console.error('Error parsing Sky Harbor price:', error, 'R4 value:', r4);
                }
            }
        }
        return null;
    }

    function determineAddressBookLabels(tx: any) {
        const labels = new Set();
        const seenAddresses = new Set();
        
        const customStyles = {
            'gold': 'bg-yellow-500/70',
            'mew': 'bg-purple-500/70',
            'duckpool': 'bg-yellow-500/70',
            'dex': 'bg-pink-500/70',
            'rosen': 'bg-orange-500/70',
            'sigusd': 'bg-blue-500/70',
            'default': 'bg-gray-500/30'
        };

        const soundMap = {
            'dex': 'dex',
            'spectrum': 'dex',
            'sigusd': 'sigusd',
            'rosen': 'p2p',
            'default': 'p2p'
        };

        function getCustomStyle(label: string): string {
            const lowerLabel = label.toLowerCase();
            for (const [key, style] of Object.entries(customStyles)) {
                if (lowerLabel.includes(key)) return style;
            }
            return customStyles.default;
        }

        // Add Sky Harbor price label if applicable
        const skyharbourPrice = extractSkyharbourPrice(tx);
        if (skyharbourPrice) {
            labels.add({
                label: `Sky Harbor`,
                style: 'bg-blue-500/70',
                sound: 'p2p'
            });
        }
        
        function getSound(label: string): string {
            const lowerLabel = label.toLowerCase();
            for (const [key, sound] of Object.entries(soundMap)) {
                if (lowerLabel.includes(key)) return sound;
            }
            return soundMap.default;
        }

        const bridgeTokens = {
            '8a94d71b4a08058327fa8372aa69d95c337536c6577c31c8d994169a041e5fc0': 'Ergo',
            'f5985c64c1aa8f08569dc77a046f65f92947abaa9ccd530aead033eece23496e': 'Ethereum',
            'ddb335d2b4f3764ddeae8411a14bec97f94d0057628bb96f98da9d95e74d02bc': 'Cardano',
            '33477693d6be5bbd3a4cd786fbff5e6444449c191ab08e681aaaa87fc192772c': 'Binance',
            '30e4392fc439fce9948da124efddb8779fe179eef5a5d6196e249b75ee64defc': 'BTC'
        };

        let chainName = '';
        [...tx.inputs, ...tx.outputs].forEach(box => {
            if (box.assets) {
                box.assets.forEach(asset => {
                    if (bridgeTokens[asset.tokenId]) {
                        chainName = bridgeTokens[asset.tokenId];
                    }
                });
            }
        });

        [...tx.inputs, ...tx.outputs].forEach(box => {
            if (!seenAddresses.has(box.address)) {
                seenAddresses.add(box.address);
                const addressInfo = addressBook.get(box.address);
                
                if (addressInfo && !EXCLUDED_LABELS.includes(addressInfo.name)) {
                    let label = addressInfo.name;
                    if (addressInfo.name === 'Rosen Bridge' && chainName) {
                        label = `${addressInfo.name} (${chainName})`;
                    }
                    if (addressInfo.name === 'Ergo Platform') {
                        label = `P2P`;
                    }
                    else if (addressInfo.name === 'Spectrum Finance') {
                        label = 'Dex Trade';
                    }

                    const style = getCustomStyle(label);
                    const sound = getSound(label);
                    
                    labels.add({
                        label,
                        style,
                        sound
                    });
                }
            }
        });
        
        return Array.from(labels);
    }

    function determineTransactionLabels(tx: any) {
        // Log the transaction to debug
        console.log('📝 Determining transaction labels for:', tx.id);
        
        const labels = [];
        
        // Check special configurations first
        Object.entries(SPECIAL_CONFIG).forEach(([key, config]) => {
            let shouldAdd = false;
            
            // Check if the transaction matches special token configurations
            if (config.tokens && checkForSpecialTokens(tx, config.tokens, key === 'MIXERS')) {
                shouldAdd = true;
            }
            
            // Check if the transaction matches special address configurations
            if (config.addresses && checkForSpecialAddress(tx, config.addresses)) {
                shouldAdd = true;
            }
            
            // If the transaction matches the special configuration, add the label
            if (shouldAdd) {
                labels.push({
                    label: config.label,
                    style: config.style,
                    sound: config.sound
                });
                console.log(`✅ Added special config label: ${config.label}`);
            }
        });
        
        // Then check address book labels
        const addressBookLabels = determineAddressBookLabels(tx);
        if (addressBookLabels.length > 0) {
            console.log(`✅ Added ${addressBookLabels.length} address book labels`);
            labels.push(...addressBookLabels);
        }

        // If no labels were found, add a default transfer label
        if (labels.length === 0) {
            const defaultLabel = {
                label: 'Transfer', 
                style: 'bg-gray-500/30',
                sound: 'p2p'
            };
            labels.push(defaultLabel);
            console.log(`✅ Added default label: ${defaultLabel.label}`);
        }

        // Find the highest priority sound to play
        const soundPriority = ['sigusd', 'dex', 'mixer', 'p2p'];
        let selectedSound = null;
        
        // Iterate through sound priority to find the first matching sound
        for (const priority of soundPriority) {
            const matchingLabel = labels.find(label => label.sound === priority);
            if (matchingLabel) {
                selectedSound = matchingLabel.sound;
                break;
            }
        }

        // Attempt to play the selected sound
        try {
            // Check if audioManager exists and has a playSound method
            if (selectedSound && audioManager && typeof audioManager.playSound === 'function') {
                // Type assertion to match the allowed sound types
                const validSoundType = ['sigusd', 'p2p', 'dex', 'mixer'].includes(selectedSound) 
                    ? selectedSound as 'sigusd' | 'p2p' | 'dex' | 'mixer'
                    : 'p2p';
                
                audioManager.playSound(validSoundType);
            } else {
                console.warn('Audio manager is not properly configured', {
                    audioManager: audioManager,
                    hasPlaySoundMethod: typeof audioManager?.playSound === 'function'
                });
            }
        } catch (error) {
            console.error('Error playing transaction sound:', error);
        }
        
        console.log(`📊 Final transaction labels (${labels.length}):`, labels);
        
        // Store labels on the transaction object itself for easier access
        tx.txLabels = labels;
        
        // Return the labels (first label will be displayed in the UI)
        return labels;
    }

    function updateAssets() {
        console.log('🔄 Updating assets for transaction:', transaction.id);
        
        try {
            const proxyTx = resolveTxBoxes(transaction);
            assets = {};
            const uniqueAssets = trackNetAssetTransfers(proxyTx);
            
            Object.values(uniqueAssets).forEach((item) => {
                if (
                    item.amount.toNumber() !== 0 ||
                    item.burned.toNumber() !== 0 ||
                    item.minted.toNumber() !== 0
                ) {
                    assets[item.tokenId] = item;
                }
            });

            // Determine transaction labels and store them
            txLabels = determineTransactionLabels(proxyTx);
            
            // Store labels on the transaction object for easier access
            proxyTx.txLabels = txLabels;
            
            // Dispatch an event to notify parent components about the labels
            dispatch('transactionLabeled', { 
                txId: proxyTx.id, 
                labels: txLabels 
            });

            thisTransaction = proxyTx;
            
            console.log('✅ Assets and labels updated successfully for:', transaction.id);
        } catch (error) {
            console.error('❌ Error updating assets:', error);
        }
    }

    $effect(() => {
        setTimeout(updateAssets, 0);
    });

    onMount(async () => {
        console.log('🚀 Transaction component mounted for:', transaction.id);
        try {
            await audioManager.initialize(); // Ensure audio manager is initialized
            await fetchAddressBook();
            thisTransaction = JSON.parse(JSON.stringify(transaction));
            updateAssets();
        } catch (error) {
            console.error('❌ Error during Transaction component initialization:', error);
        }
    });
</script>

<a 
    target="_new" 
    href={`${ERGEXPLORER_URL}transactions/${thisTransaction.id}`}
    class="block w-full"
>
    <div
        class="tx-container flex flex-wrap place-content-around gap-y-7 rounded-md border-1 border-[#555] p-1"
        out:fade|local={{ duration: 300 }}
        in:fade|local={{ duration: 300, delay: 200 }}
    >
        <!-- Transaction Labels -->
        {#if txLabels.length > 0}
            {#each txLabels.slice(0, 1) as label}
                <div class="label-header {label.style} w-full">
                    <span class="label-text flex items-center gap-2">
                        {label.label}
                        <ExternalLink size={14} class="icon-link" />
                    </span>
                </div>
            {/each}
        {:else}
            <div class="label-header default-label w-full">
                <span class="label-text">Transfer</span>
            </div>
        {/if}

        <!-- Transaction Content -->
        {#if !showCoolBoxDetails}
            {#if showBoxDetails}
                <div class="w-full">
                    <!-- Inputs -->
                    <p class="mb-2 text-sm text-gray-400">Inputs:</p>
                    {#each thisTransaction.inputs as box}
                        <Box {box} />
                    {/each}
                    
                    <!-- Outputs -->
                    <p class="mb-2 mt-4 text-sm text-gray-400">Outputs:</p>
                    {#each thisTransaction.outputs as box}
                        <Box {box} />
                    {/each}
                </div>
            {/if}
        {:else if Object.keys(assets).length > 0}
            <!-- Asset Display -->
            <div class="flex flex-wrap gap-2">
                {#each Object.entries(assets) as [tokenId, asset]}
                    <Asset {asset} />
                {/each}
            </div>
        {:else}
            <SmallLoading />
        {/if}
    </div>
</a>

<style>
    .label-header {
        font-size: 11px;
        font-weight: 500;
        padding: 4px 6px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: 4px;
    }

    .default-label {
        background-color: #2a2a2a;
    }

    .label-text {
        color: #fff;
    }

    .icon-link {
        color: #9ca3af;
        opacity: 0.7;
    }

    /* Transaction Container Hover Effects */
    .tx-container {
        transition: all 0.2s ease-in-out;
    }
    .tx-container:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                   0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border-color: #666;
    }

    /* Label Styles */
    .bg-purple-500\/70 {
        background-color: rgba(168, 85, 247, 0.7);
    }

    .bg-blue-500\/70 {
        background-color: rgba(59, 130, 246, 0.7);
    }

    .bg-green-500\/70 {
        background-color: rgba(34, 197, 94, 0.7);
    }

    .bg-pink-500\/70 {
        background-color: rgba(236, 72, 153, 0.7);
    }

    .bg-yellow-500\/70 {
        background-color: rgba(234, 179, 8, 0.7);
    }

    .bg-orange-500\/70 {
        background-color: rgba(249, 115, 22, 0.7);
    }

    .bg-gray-500\/30 {
        background-color: rgba(107, 114, 128, 0.3);
    }

    /* Asset Grid Layout */
    .asset-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
        gap: 0.5rem;
        width: 100%;
    }

    /* Animation Keyframes */
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideIn {
        from {
            transform: translateX(-10px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    /* Detail Transitions */
    .details-enter {
        animation: slideIn 0.2s ease-out;
    }

    .details-exit {
        animation: slideIn 0.2s ease-out reverse;
    }
</style>