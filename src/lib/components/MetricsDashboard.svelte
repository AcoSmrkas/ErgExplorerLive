<!-- src/routes/metrics/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { metricsService, metrics } from '$lib/utils/IndexedDBMetricsService';
    import { browser } from '$app/environment';
    
    // State variables 
    let metricsData = [];
    let loading = true;
    let error = null;
    let dateRange = '30'; // default to 30 days
    let chartType = 'pie'; // Default to pie chart
    let selectedLabels = [];
    let allLabels = [];
    let totalTransactions = 0;
    
    // Chart colors - matching transaction color scheme
    const COLORS = [
        '#FF7733', // P2P (orange)
        '#3B82F6', // SigUSD Oracle (blue)
        '#EC4899', // DEX (pink)
        '#22C55E', // Duckpools (green)
        '#F59E0B', // Gold Oracle (yellow)
        '#A855F7', // Mixer (purple)
        '#64748B', // Others (gray)
        '#0EA5E9', // Sky Harbor (light blue)
        '#EF4444', // Hero Miners (red)
        '#3F7FBF', // KuCoin (blue-gray)
    ];
    
    let chartContainer;

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
            
            // Calculate total transactions
            totalTransactions = metricsData.reduce((sum, day) => sum + day.totalTransactions, 0);
            
            // Extract all unique labels
            extractLabels();
            
            // Update chart after data loaded
            updateChart();
            
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

    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    // Handle label selection/deselection
    function toggleLabel(label) {
        if (selectedLabels.includes(label)) {
            selectedLabels = selectedLabels.filter(l => l !== label);
        } else {
            selectedLabels = [...selectedLabels, label];
        }
        updateChart();
    }

    // Handle date range change
    function handleDateRangeChange(e) {
        dateRange = e.target.value;
        updateMetricsData();
    }

    // Handle chart type change
    function handleChartTypeChange(type) {
        chartType = type;
        updateChart();
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
        if (!browser) return;
        
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    // Chart drawing functions - implementation details omitted for brevity
    function createDailyChart() { /* Implementation details in earlier code */ }
    function createLabelChart() { /* Implementation details in earlier code */ }
    function createPieChart() { /* Implementation details in earlier code */ }
    
    // Update chart based on selected type
    function updateChart() {
        if (!chartContainer) return;
        
        try {
            // Check if we have data
            if (!metricsData || metricsData.length === 0) {
                chartContainer.innerHTML = '<div class="empty-message">No data available for chart</div>';
                return;
            }
            
            // Check if we have selected labels
            if (selectedLabels.length === 0) {
                chartContainer.innerHTML = '<div class="empty-message">Please select at least one label to display</div>';
                return;
            }
            
            // Create chart based on type
            switch (chartType) {
                case 'daily':
                    createDailyChart();
                    break;
                case 'label':
                    createLabelChart();
                    break;
                case 'pie':
                default:
                    createPieChart();
                    break;
            }
        } catch (error) {
            console.error('Error updating chart:', error);
            chartContainer.innerHTML = `<div class="error-message">Error updating chart: ${error.message}</div>`;
        }
    }

    // Clear all metrics data
    function clearMetricsData() {
        if (confirm('Are you sure you want to clear all metrics data? This cannot be undone.')) {
            metricsService.clearAllMetrics();
        }
    }

    onMount(() => {
        if (browser) {
            updateMetricsData();
        }
        
        return () => {
            unsubscribe();
        };
    });
</script>

<div class="metrics-page bg-[#121212] min-h-screen text-gray-200 p-4 md:p-6">
    <header class="mb-6">
        <h1 class="text-2xl font-bold mb-2">Transaction Metrics Dashboard</h1>
        <p class="text-gray-400">Analyze your blockchain transaction patterns over time</p>
    </header>
    
    {#if loading}
        <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    {:else if error}
        <div class="bg-red-900/20 border border-red-800 p-4 rounded-md mb-4">
            <p class="text-red-400">Error: {error}</p>
            <button 
                class="mt-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 text-sm px-3 py-1 rounded"
                on:click={() => updateMetricsData()}
            >
                Retry
            </button>
        </div>
    {:else if metricsData.length === 0}
        <div class="bg-[#1e1e1e] p-8 rounded-lg text-center">
            <h2 class="text-xl font-semibold mb-4">No Metrics Data Available</h2>
            <p class="text-gray-400 mb-6">Start interacting with transactions to collect metrics data</p>
            <a href="/" class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/80 transition-colors">
                Go Back Home
            </a>
        </div>
    {:else}
        <!-- Two column layout -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <!-- Chart column (3/5 width on medium+ screens) -->
            <div class="md:col-span-3">
                <div class="bg-[#1e1e1e] rounded-lg p-4 mb-4">
                    <h2 class="text-base font-semibold mb-4">
                        {#if chartType === 'daily'}
                            Daily Transaction Activity
                        {:else if chartType === 'label'}
                            Label Distribution
                        {:else}
                            Transaction Label Breakdown
                        {/if}
                    </h2>
                    
                    <!-- Statistics row above chart -->
                    <div class="grid grid-cols-3 gap-3 mb-4">
                        <div class="p-2 bg-[#2a2a2a] rounded">
                            <p class="text-xs text-gray-400">Total TX</p>
                            <p class="text-lg font-bold">
                                {totalTransactions.toLocaleString()}
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
                    
                    <div class="h-64 md:h-80 w-full" bind:this={chartContainer}>
                        <div class="flex justify-center items-center h-full text-gray-400">
                            Loading chart...
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Controls column (2/5 width on medium+ screens) -->
            <div class="md:col-span-2">
                <!-- Time period selection -->
                <div class="bg-[#1e1e1e] rounded-lg p-4 mb-4">
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
                <div class="bg-[#1e1e1e] rounded-lg p-4 mb-4">
                    <h3 class="text-sm font-medium mb-2 text-gray-400">Chart Type</h3>
                    <div class="grid grid-cols-3 gap-2">
                        <button 
                            class="p-2 text-xs rounded transition-colors {chartType === 'pie' ? 'bg-primary text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'}"
                            on:click={() => handleChartTypeChange('pie')}
                        >
                            Pie Chart
                        </button>
                        <button 
                            class="p-2 text-xs rounded transition-colors {chartType === 'daily' ? 'bg-primary text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'}"
                            on:click={() => handleChartTypeChange('daily')}
                        >
                            Line Chart
                        </button>
                        <button 
                            class="p-2 text-xs rounded transition-colors {chartType === 'label' ? 'bg-primary text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'}"
                            on:click={() => handleChartTypeChange('label')}
                        >
                            Bar Chart
                        </button>
                    </div>
                </div>
                
                <!-- Label selection -->
                <div class="bg-[#1e1e1e] rounded-lg p-4 mb-4">
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
                <!-- Add this to your MetricsDashboard.svelte -->
<div class="bg-[#1e1e1e] rounded-lg p-4 mt-4">
    <h3 class="text-sm font-medium mb-2 text-gray-400">Database Contents</h3>
    <div class="max-h-48 overflow-y-auto">
      <table class="w-full">
        <thead>
          <tr>
            <th class="p-1 text-left">Date</th>
            <th class="p-1 text-right">Transactions</th>
            <th class="p-1 text-left">Labels</th>
          </tr>
        </thead>
        <tbody>
          {#each metricsData as day}
            <tr class="border-b border-[#333]">
              <td class="p-1">{day.date}</td>
              <td class="p-1 text-right">{day.totalTransactions}</td>
              <td class="p-1">{day.labels.length} labels</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
                <!-- Export options -->
                <div class="bg-[#1e1e1e] rounded-lg p-4 mb-4">
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
                            on:click={() => updateMetricsData()}
                        >
                            Refresh
                        </button>
                    </div>
                    
                    <button 
                        class="w-full mt-2 bg-red-900/20 hover:bg-red-900/30 transition-colors px-2 py-1 rounded text-xs text-red-400"
                        on:click={clearMetricsData}
                    >
                        Clear All Data
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="mt-6 text-center">
            <a href="/" class="inline-block bg-[#2a2a2a] hover:bg-[#333] px-4 py-2 rounded text-sm">
                Back to Home
            </a>
        </div>
    {/if}
</div>

<style>
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
    
    .empty-message {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #666;
        font-size: 14px;
    }
    
    .error-message {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #ff6b6b;
        font-size: 12px;
        padding: 1rem;
        text-align: center;
    }
</style>