<script>
    import { onMount } from 'svelte';
    import { metrics, metricsService } from '$lib/utils/MetricsService';
    import TransactionCharts from './TransactionCharts.svelte';
    
    // State variables 
    let metricsData = [];
    let loading = true;
    let error = null;
    let dateRange = '30'; // default to 30 days
    let chartType = 'pie'; // Default to pie chart
    let selectedLabels = [];
    let allLabels = [];

    // Subscribe to metrics store
    const unsubscribe = metrics.subscribe(state => {
        loading = state.isLoading;
        error = state.error;
        
        if (!loading && !error) {
            updateMetricsData();
        }
    });

    // Update metrics data based on selected date range
    function updateMetricsData() {
        try {
            if (dateRange === 'all') {
                metricsData = metricsService.getMetricsForLastDays(1000); // Get all data
            } else {
                const days = parseInt(dateRange);
                metricsData = metricsService.getMetricsForLastDays(days);
            }
            
            // Extract all unique labels
            extractLabels();
        } catch (err) {
            console.error('Error updating metrics data:', err);
            error = err.message;
        }
    }

    // Extract all unique labels from metrics data
    function extractLabels() {
        try {
            const labelSet = new Set();
            
            metricsData.forEach(day => {
                if (day && day.labels && Array.isArray(day.labels)) {
                    day.labels.forEach(label => {
                        if (label && label.label) {
                            labelSet.add(label.label);
                        }
                    });
                }
            });
            
            allLabels = Array.from(labelSet);
            
            // If no labels are selected yet, select the top 5
            if (selectedLabels.length === 0 && allLabels.length > 0) {
                // Count total occurrences of each label
                const labelCounts = new Map();
                
                metricsData.forEach(day => {
                    if (day && day.labels && Array.isArray(day.labels)) {
                        day.labels.forEach(label => {
                            if (label && label.label) {
                                const count = labelCounts.get(label.label) || 0;
                                labelCounts.set(label.label, count + label.count);
                            }
                        });
                    }
                });
                
                // Sort labels by count and select top 5
                selectedLabels = Array.from(labelCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(entry => entry[0]);
            }
        } catch (err) {
            console.error('Error extracting labels:', err);
            error = err.message;
        }
    }

    // Handle label selection/deselection
    function toggleLabel(label) {
        if (selectedLabels.includes(label)) {
            selectedLabels = selectedLabels.filter(l => l !== label);
        } else {
            selectedLabels = [...selectedLabels, label];
        }
    }

    // Handle date range change
    function handleDateRangeChange(e) {
        dateRange = e.target.value;
        updateMetricsData();
    }

    // Handle chart type change
    function handleChartTypeChange(e) {
        chartType = e.target.value;
    }

    // Export data
    function exportData(format) {
        try {
            if (format === 'json') {
                const jsonData = metricsService.exportMetricsAsJson();
                downloadFile(jsonData, 'ergo-transaction-metrics.json', 'application/json');
            } else {
                const csvData = metricsService.exportMetricsAsCsv();
                downloadFile(csvData, 'ergo-transaction-metrics.csv', 'text/csv');
            }
        } catch (err) {
            console.error('Error exporting data:', err);
            error = err.message;
        }
    }

    function downloadFile(content, fileName, contentType) {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    // Manually trigger a metrics refresh
    function refreshMetrics() {
        metricsService.loadFromStorage();
    }

    onMount(() => {
        updateMetricsData();
        
        return () => {
            unsubscribe();
        };
    });
</script>

<div class="metrics-dashboard">
    {#if loading}
        <div class="flex justify-center items-center h-40">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
    {:else if error}
        <div class="bg-red-900/20 border border-red-800 p-3 rounded-md mb-4">
            <p class="text-red-400 text-sm">Error: {error}</p>
            <button 
                class="mt-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 text-xs px-2 py-1 rounded"
                on:click={refreshMetrics}
            >
                Retry
            </button>
        </div>
    {:else if metricsData.length === 0}
        <div class="bg-[#1e1e1e] p-4 rounded-lg text-center">
            <h2 class="text-lg font-semibold mb-2">No Metrics Data Available</h2>
            <p class="text-gray-400 mb-4 text-sm">Start interacting with transactions to collect metrics data</p>
        </div>
    {:else}
        <!-- Two column layout -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <!-- Chart column (3/5 width on medium+ screens) -->
            <div class="md:col-span-3 bg-[#1e1e1e] rounded-lg p-3">
                <h2 class="text-base font-semibold mb-2">
                    {#if chartType === 'daily'}
                        Daily Transaction Activity
                    {:else if chartType === 'label'}
                        Label Distribution
                    {:else}
                        Transaction Label Breakdown
                    {/if}
                </h2>
                
                <!-- Statistics row above chart -->
                <div class="grid grid-cols-3 gap-2 mb-3">
                    <div class="p-2 bg-[#2a2a2a] rounded">
                        <p class="text-xs text-gray-400">Total TX</p>
                        <p class="text-lg font-bold">
                            {metricsData.reduce((sum, day) => sum + day.totalTransactions, 0).toLocaleString()}
                        </p>
                    </div>
                    <div class="p-2 bg-[#2a2a2a] rounded">
                        <p class="text-xs text-gray-400">Timeframe</p>
                        <p class="text-lg font-bold">{metricsData.length} days</p>
                    </div>
                    <div class="p-2 bg-[#2a2a2a] rounded">
                        <p class="text-xs text-gray-400">Labels</p>
                        <p class="text-lg font-bold">{allLabels.length}</p>
                    </div>
                </div>
                
                <div class="h-64 w-full">
                    <TransactionCharts 
                        {chartType} 
                        {metricsData} 
                        {selectedLabels} 
                    />
                </div>
            </div>
            
            <!-- Controls column (2/5 width on medium+ screens) -->
            <div class="md:col-span-2">
                <!-- Time period selection -->
                <div class="bg-[#1e1e1e] rounded-lg p-3 mb-4">
                    <h3 class="text-sm font-medium mb-2 text-gray-400">Time Period</h3>
                    <select 
                        class="w-full bg-[#2a2a2a] border border-gray-700 rounded p-2 text-sm text-gray-200"
                        on:change={handleDateRangeChange}
                        value={dateRange}
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="all">All time</option>
                    </select>
                </div>
                
                <!-- Chart type selection -->
                <div class="bg-[#1e1e1e] rounded-lg p-3 mb-4">
                    <h3 class="text-sm font-medium mb-2 text-gray-400">Chart Type</h3>
                    <div class="grid grid-cols-3 gap-2">
                        <button 
                            class="p-2 text-xs rounded transition-colors {chartType === 'pie' ? 'bg-primary text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'}"
                            on:click={() => chartType = 'pie'}
                        >
                            Pie Chart
                        </button>
                        <button 
                            class="p-2 text-xs rounded transition-colors {chartType === 'daily' ? 'bg-primary text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'}"
                            on:click={() => chartType = 'daily'}
                        >
                            Line Chart
                        </button>
                        <button 
                            class="p-2 text-xs rounded transition-colors {chartType === 'label' ? 'bg-primary text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'}"
                            on:click={() => chartType = 'label'}
                        >
                            Bar Chart
                        </button>
                    </div>
                </div>
                
                <!-- Label selection -->
                <div class="bg-[#1e1e1e] rounded-lg p-3 mb-4">
                    <h3 class="text-sm font-medium mb-2 text-gray-400">Select Labels</h3>
                    <div class="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {#each allLabels as label}
                            <button 
                                class="px-2 py-1 text-xs rounded transition-colors {selectedLabels.includes(label) ? 'bg-primary text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'}"
                                on:click={() => toggleLabel(label)}
                            >
                                {label}
                            </button>
                        {/each}
                    </div>
                </div>
                
                <!-- Export options -->
                <div class="bg-[#1e1e1e] rounded-lg p-3 mb-4">
                    <h3 class="text-sm font-medium mb-2 text-gray-400">Export & Actions</h3>
                    <div class="grid grid-cols-3 gap-2">
                        <button 
                            class="bg-[#2a2a2a] hover:bg-[#333] transition-colors px-2 py-1 rounded text-xs"
                            on:click={() => exportData('json')}
                        >
                            JSON
                        </button>
                        <button 
                            class="bg-[#2a2a2a] hover:bg-[#333] transition-colors px-2 py-1 rounded text-xs"
                            on:click={() => exportData('csv')}
                        >
                            CSV
                        </button>
                        <button 
                            class="bg-[#2a2a2a] hover:bg-[#333] transition-colors px-2 py-1 rounded text-xs"
                            on:click={refreshMetrics}
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .metrics-dashboard {
        font-size: 14px;
    }
    
    /* Custom scrollbar styling */
    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #444 #333;
    }

    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: #333;
        border-radius: 3px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #444;
        border-radius: 3px;
    }
</style>