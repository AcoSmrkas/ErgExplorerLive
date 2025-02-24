<script lang="ts">
    import { onMount } from 'svelte';
    import BigNumber from 'bignumber.js';

    type OrderBook = {
        exchange: string;
        logo: string;
        buyOrders: Order[];
        sellOrders: Order[];
    }

    type Order = {
        price: number;
        amount: number;
        total: number;
    }

    let orderBooks: OrderBook[] = [];
    let isLoading = true;
    let error: string | null = null;

    // Proxy server to handle CORS
    const PROXY_URL = 'https://corsproxy.io/?';

    async function fetchTradeOgreOrders() {
        try {
            const response = await fetch(`${PROXY_URL}https://tradeogre.com/api/v1/orders/ERG-USDT`);
            const data = await response.json();
            
            if (data?.buy && data?.sell) {
                return {
                    exchange: 'TradeOgre',
                    logo: '/tradeogre-logo.png',
                    buyOrders: Object.entries(data.buy).slice(0, 3).map(([price, amount]) => ({
                        price: parseFloat(price),
                        amount: parseFloat(amount as string),
                        total: parseFloat(price) * parseFloat(amount as string)
                    })),
                    sellOrders: Object.entries(data.sell).slice(0, 3).map(([price, amount]) => ({
                        price: parseFloat(price),
                        amount: parseFloat(amount as string),
                        total: parseFloat(price) * parseFloat(amount as string)
                    }))
                };
            }
        } catch (err) {
            console.error('TradeOgre fetch error:', err);
        }
        return null;
    }

    async function fetchMEXCOrders() {
        try {
            const response = await fetch(`${PROXY_URL}https://api.mexc.com/api/v3/depth?symbol=ERGUSDT`);
            const data = await response.json();
            
            if (data?.bids && data?.asks) {
                return {
                    exchange: 'MEXC',
                    logo: '/mexc-logo.png',
                    buyOrders: data.bids.slice(0, 3).map((order: string[]) => ({
                        price: parseFloat(order[0]),
                        amount: parseFloat(order[1]),
                        total: parseFloat(order[0]) * parseFloat(order[1])
                    })),
                    sellOrders: data.asks.slice(0, 3).map((order: string[]) => ({
                        price: parseFloat(order[0]),
                        amount: parseFloat(order[1]),
                        total: parseFloat(order[0]) * parseFloat(order[1])
                    }))
                };
            }
        } catch (err) {
            console.error('MEXC fetch error:', err);
        }
        return null;
    }

    async function fetchAllOrders() {
        try {
            isLoading = true;
            const results = await Promise.allSettled([
                fetchMEXCOrders(),
                fetchTradeOgreOrders()
            ]);

            orderBooks = results
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => (result as PromiseFulfilledResult<OrderBook>).value);

            if (orderBooks.length === 0) {
                error = 'No order data available';
            }
        } catch (err) {
            error = 'Failed to fetch order books';
            console.error(err);
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        fetchAllOrders();
        const intervalId = setInterval(fetchAllOrders, 60000);

        return () => {
            clearInterval(intervalId);
        };
    });
</script>

<div class="w-full bg-[#1e1e1e] rounded-md border-1 border-[#555] p-2">
    <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-semibold text-primary">ERG Order Books</span>
    </div>
    
    {#if isLoading}
        <div class="flex justify-center items-center text-xs text-gray-400">
            Loading order books...
        </div>
    {:else if error}
        <div class="text-red-500 text-center text-xs">{error}</div>
    {:else}
        <div class="grid grid-cols-2 gap-2">
            {#each orderBooks as orderBook}
                <div class="bg-[#2a2a2a] rounded-md p-2">
                    <div class="flex items-center justify-between mb-1">
                        <img 
                            src={orderBook.logo} 
                            alt={`${orderBook.exchange}`} 
                            class="h-4 w-4"
                        />
                        <span class="text-xs font-semibold text-primary">
                            {orderBook.exchange}
                        </span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-1">
                        <!-- Buy Orders -->
                        <div>
                            <h3 class="text-[10px] font-medium text-green-500 mb-1">Buy</h3>
                            {#each orderBook.buyOrders as order}
                                <div class="flex justify-between text-[10px] text-green-400">
                                    <span>${order.price.toFixed(4)}</span>
                                    <span>{order.amount.toFixed(2)}</span>
                                </div>
                            {/each}
                        </div>
                        
                        <!-- Sell Orders -->
                        <div>
                            <h3 class="text-[10px] font-medium text-red-500 mb-1">Sell</h3>
                            {#each orderBook.sellOrders as order}
                                <div class="flex justify-between text-[10px] text-red-400">
                                    <span>${order.price.toFixed(4)}</span>
                                    <span>{order.amount.toFixed(2)}</span>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>