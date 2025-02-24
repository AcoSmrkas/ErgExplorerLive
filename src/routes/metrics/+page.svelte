<script>
    import { onMount } from 'svelte';
    import { metrics, metricsService } from '$lib/utils/MetricsService';
    import MetricsDashboard from '$lib/components/MetricsDashboard.svelte';
</script>

<div class="bg-[#121212] min-h-screen text-gray-200 p-6">
    <header class="mb-8">
        <h1 class="text-2xl font-bold mb-2">Transaction Metrics Dashboard</h1>
        <p class="text-gray-400">Analyze your blockchain transaction patterns over time</p>
    </header>
    
    <MetricsDashboard />
    
    <div class="mt-8 text-center">
        <a href="/" class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/80 transition-colors">
            Back to Home
        </a>
    </div>
</div>

<style>
    /* Custom scrollbar styling */
    :global(*) {
        scrollbar-width: thin;
        scrollbar-color: #444 #333;
    }

    :global(*::-webkit-scrollbar) {
        width: 8px;
        height: 8px;
    }

    :global(*::-webkit-scrollbar-track) {
        background: #333;
    }

    :global(*::-webkit-scrollbar-thumb) {
        background-color: #444;
        border-radius: 4px;
    }

    :global(*::-webkit-scrollbar-thumb:hover) {
        background-color: #555;
    }
</style>