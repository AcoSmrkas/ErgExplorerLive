<!-- TransactionsGrid.svelte -->
<script lang="ts">
    import Loading from './Loading.svelte';
    import Transaction from '$lib/components/Transaction.svelte';
    import DailyTxTracker from '$lib/components/DailyTxTracker.svelte';
    import { mempoolTxs, ready } from '$lib/store/store';
    import { trackNetAssetTransfers, resolveTxBoxes } from '$lib/common/utils';
    import { onMount } from 'svelte';
    import { transactionManager } from '$lib/utils/TransactionManager';
    import Grid from 'svelte-grid';
    import gridHelp from 'svelte-grid/build/helper/index.mjs';
    import type { TransactionQueueItem } from '$lib/utils/TransactionManager';

    let container: Element | null = null;
    let transactions: Array<any> = $state([]);
    let unsubscribeManager: () => void;

    let colN = [1, 2, 3, 4, 6, 8, 10, 13];
    let cols = [
        [200, colN[0]],
        [350, colN[1]],
        [410, colN[2]],
        [610, colN[3]],
        [810, colN[4]],
        [1010, colN[5]],
        [1300, colN[6]],
        [5000000, colN[7]]
    ];
    let items = $state([]);

    // Reference to the DailyTxTracker component
    let dailyTxTracker: DailyTxTracker;

    function processMempoolTransactions(txs: any[]) {
        console.log('🚀 Processing Mempool Transactions:', txs.length);
        if (!txs || !Array.isArray(txs)) return;

        // Only add new transactions
        txs.forEach(tx => {
            const proxyTx = resolveTxBoxes(tx);
            
            // Add to transaction manager 
            transactionManager.addTransaction(proxyTx);
        });
    }

    onMount(() => {
        console.log('🚀 TransactionsGrid mounted');
        container = document.getElementById('grid-container');

        // Subscribe to mempool transactions
        const mempoolTxsUnsubscribe = mempoolTxs.subscribe((value: any) => {
            console.log('📡 Mempool Transactions Received:', value);
            if (!value) return;
            processMempoolTransactions(value);
        });

        // Subscribe to displayed transactions from manager
        unsubscribeManager = transactionManager.displayedTransactions.subscribe((txs) => {
            console.log('📊 Displayed Transactions Updated:', txs.length);
            transactions = txs;
            updateLayout();
        });

        // Setup resize observer
        const resizeObserver = new ResizeObserver(() => {
            updateLayout();
        });

        if (container) {
            resizeObserver.observe(container);
        }

        // Initialize the DailyTxTracker
        if (dailyTxTracker) {
            console.log('✅ DailyTxTracker component is available');
        } else {
            console.warn('⚠️ DailyTxTracker component not found on mount');
        }

        return () => {
            resizeObserver.disconnect();
            mempoolTxsUnsubscribe();
            if (unsubscribeManager) unsubscribeManager();
            transactionManager.clearQueue();
        };
    });

    function updateLayout() {
        const width = container ? container.clientWidth : 0;
        let col = colN[0];

        // Determine column count based on container width
        for (const [breakpoint, columns] of cols) {
            if (width < breakpoint) {
                col = columns;
                break;
            }
        }

        items = gridHelp.adjust(generateLayout(col), col);
    }

    function generateLayout(col: number) {
        return transactions.map((tx, i) => {
            const uniqueAssets = trackNetAssetTransfers(tx);
            const assetCount = Object.values(uniqueAssets).filter(
                (item) =>
                    item.amount.toNumber() !== 0 ||
                    item.burned.toNumber() !== 0 ||
                    item.minted.toNumber() !== 0
            ).length;

            const maxX = col > 4 ? 4 : col;
            const calculatedH = Math.ceil(assetCount / 4) || 1;
            const calculatedW = Math.min(assetCount || 1, maxX);

            const itemConfig = {
                w: calculatedW,
                h: calculatedH,
                draggable: false,
                resizable: false,
                customDragger: false,
                customResizer: false
            };

            // Create configuration for each column
            const columnConfigs = {};
            colN.forEach(n => {
                columnConfigs[n] = n === colN[0] ? itemConfig : gridHelp.item(itemConfig);
            });

            return {
                ...columnConfigs,
                id: tx.id,
                data: tx
            };
        });
    }

    // Function to handle transaction labels and record them to DailyTxTracker
    function handleTransactionLabels(event) {
        const { txId, labels } = event.detail;
        console.log(`📝 Received transaction labels for ${txId}:`, labels);
        
        // Ensure dailyTxTracker exists and has recordTransaction method
        if (dailyTxTracker && typeof dailyTxTracker.recordTransaction === 'function') {
            labels.forEach(label => {
                console.log('📊 Recording Label to DailyTxTracker:', label);
                dailyTxTracker.recordTransaction(label.label, label.style);
            });
        } else {
            console.error('❌ Daily Tx Tracker not properly configured or available');
        }
    }
</script>

<div class="relative">
    <!-- DailyTxTracker Component -->
    <DailyTxTracker bind:this={dailyTxTracker} />

    <div id="grid-container" class="h-[69vh] max-h-[69vh] overflow-y-scroll px-2">
        {#if $ready}
            <Grid 
                bind:items 
                gap={[6, 6]} 
                rowHeight={125} 
                let:item 
                let:dataItem 
                {cols} 
                fillSpace={true}
            >
                <Transaction 
                    transaction={dataItem.data}
                    on:transactionLabeled={handleTransactionLabels}
                />
            </Grid>
        {:else}
            <Loading height={'full'} />
        {/if}
    </div>
</div>

<style>
    #grid-container {
        scrollbar-width: thin;
        scrollbar-color: #444 #333;
    }

    #grid-container::-webkit-scrollbar {
        width: 8px;
    }

    #grid-container::-webkit-scrollbar-track {
        background: #333;
    }

    #grid-container::-webkit-scrollbar-thumb {
        background-color: #444;
        border-radius: 4px;
    }
</style>