<!-- OrderBook.svelte -->
<script lang="ts">
    import { ExternalLink } from 'lucide-svelte';
</script>

<div 
    class="tx-container flex flex-wrap place-content-around gap-y-7 rounded-md border-1 border-[#555] p-1"
>
    <!-- Order Book Labels -->
    <div class="label-header bg-blue-500/70 w-full">
        <span class="label-text flex items-center gap-2">
            Order Book Placeholder
            <ExternalLink size={14} class="icon-link" />
        </span>
    </div>

    <!-- Placeholder Content -->
    <div class="w-full grid grid-cols-2 gap-4 p-2">
        <!-- Buy Orders Placeholder -->
        <div>
            <h3 class="text-sm font-medium text-green-500 mb-2">Buy Orders</h3>
            {#each Array(3) as _, i}
                <div class="flex justify-between text-xs text-green-400 mb-1">
                    <span>$0.{i + 1}234</span>
                    <span>{10 - i}.{i}00 ERG</span>
                </div>
            {/each}
        </div>

        <!-- Sell Orders Placeholder -->
        <div>
            <h3 class="text-sm font-medium text-red-500 mb-2">Sell Orders</h3>
            {#each Array(3) as _, i}
                <div class="flex justify-between text-xs text-red-400 mb-1">
                    <span>$0.{i + 5}678</span>
                    <span>{5 - i}.{i}00 ERG</span>
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    /* Reuse styles from Transaction component if needed */
    .label-header {
        font-size: 11px;
        font-weight: 500;
        padding: 4px 6px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: 4px;
    }

    .label-text {
        color: #fff;
    }

    .icon-link {
        color: #9ca3af;
        opacity: 0.7;
    }
</style>