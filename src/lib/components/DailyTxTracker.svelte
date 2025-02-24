<!-- DailyTxTracker.svelte (With Metrics Integration) -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import { ChevronRight, ChevronLeft, Download, BarChart } from 'lucide-svelte';
    import { metricsService } from '$lib/utils/MetricsService';

    // Interface for label tracking
    interface LabelCount {
        label: string;
        count: number;
        style: string;
    }

    // Reactive state
    let isOpen = $state(false);
    let labelCounts = $state<LabelCount[]>([]);
    let currentDate = $state(new Date());
    let showExportOptions = $state(false);

    // Function to reset counts at midnight
    function checkAndResetCounts() {
        console.log('Checking date reset...');
        const today = new Date();
        if (currentDate.toDateString() !== today.toDateString()) {
            // Save the old day's metrics before resetting
            if (labelCounts.length > 0) {
                saveToMetrics();
            }
            
            console.log('Resetting daily counts - new day detected');
            currentDate = today;
            labelCounts = [];
        }
    }

    // Save current counts to metrics service
    function saveToMetrics() {
        if (labelCounts.length > 0) {
            metricsService.saveDailyMetrics(labelCounts);
        }
    }

    // Add a transaction label to counts
    function addLabelCount(label: string, style: string) {
        console.log('🔍 Recording Label:', { 
            label, 
            style, 
            currentDate: currentDate.toLocaleDateString(),
            existingCounts: labelCounts 
        });

        checkAndResetCounts();

        // Normalize label to handle potential duplicates
        const normalizedLabel = label.trim().toLowerCase();

        // Find existing label or create new
        const existingLabelIndex = labelCounts.findIndex(
            l => l.label.trim().toLowerCase() === normalizedLabel
        );

        if (existingLabelIndex !== -1) {
            // Increment existing label count
            labelCounts[existingLabelIndex].count++;
            console.log(`✅ Incremented existing label: ${labelCounts[existingLabelIndex].label}`);
        } else {
            // Add new label
            const newLabel = { label, count: 1, style };
            labelCounts.push(newLabel);
            console.log(`➕ Added new label: ${newLabel.label}`);
        }

        // Sort labels by count in descending order
        labelCounts.sort((a, b) => b.count - a.count);

        console.log('📊 Updated Label Counts:', labelCounts);
        
        // Save to metrics service after updating
        saveToMetrics();
    }

    // Export functions
    function exportDataAsJson() {
        const jsonData = metricsService.exportMetricsAsJson();
        downloadFile(jsonData, 'ergo-transaction-metrics.json', 'application/json');
    }

    function exportDataAsCsv() {
        const csvData = metricsService.exportMetricsAsCsv();
        downloadFile(csvData, 'ergo-transaction-metrics.csv', 'text/csv');
    }

    function downloadFile(content: string, fileName: string, contentType: string) {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    // Navigate to metrics dashboard
    function goToMetricsDashboard() {
        window.location.href = '/metrics';
        // You would need to create this page in your app
    }

    // Extract color from style class
    function extractColor(styleClass: string): string {
        // Map of style classes to actual hex colors
        const colorMap = {
            'bg-purple-500/70': '#a855f7',
            'bg-blue-500/70': '#3b82f6',
            'bg-green-500/70': '#22c55e',
            'bg-pink-500/70': '#ec4899',
            'bg-yellow-500/70': '#eab308',
            'bg-orange-500/70': '#f97316',
            'bg-gray-500/30': '#6b7280'
        };

        // Return the mapped color or a default color
        return colorMap[styleClass] || '#6b7280';
    }

    // Persist label counts in localStorage
    $effect(() => {
        if (labelCounts.length > 0) {
            try {
                localStorage.setItem('dailyLabelCounts', JSON.stringify({
                    date: currentDate.toISOString(),
                    counts: labelCounts
                }));
                console.log('💾 Saved label counts to localStorage');
                
                // Also save to metrics service
                saveToMetrics();
            } catch (error) {
                console.error('❌ Error saving to localStorage:', error);
            }
        }
    });

    // Load previous day's counts on mount
    onMount(() => {
        console.log('🚀 DailyTxTracker Mounted');
        
        try {
            const storedData = localStorage.getItem('dailyLabelCounts');
            if (storedData) {
                const { date, counts } = JSON.parse(storedData);
                const storedDate = new Date(date);
                
                console.log('🔍 Stored Data:', { 
                    storedDate: storedDate.toLocaleDateString(),
                    today: new Date().toLocaleDateString(),
                    counts 
                });

                // Check if stored data is from today
                if (storedDate.toDateString() === new Date().toDateString()) {
                    labelCounts = counts;
                    currentDate = storedDate;
                    console.log('📥 Loaded previous day\'s counts');
                }
            }
        } catch (error) {
            console.error('❌ Error loading localStorage data:', error);
        }

        // Set up interval to check for date change
        const intervalId = setInterval(checkAndResetCounts, 60000); // Check every minute

        return () => {
            clearInterval(intervalId);
            
            // Save metrics one last time before unmounting
            if (labelCounts.length > 0) {
                saveToMetrics();
            }
        };
    });

    // Expose method to record transaction
    export function recordTransaction(label: string, style: string) {
        console.log('🎉 External recordTransaction called:', { label, style });
        addLabelCount(label, style);
    }
</script>

<div 
    class="fixed right-0 top-1/2 transform -translate-y-1/2 z-50"
    transition:fly={{ x: 300, duration: 300 }}
>
    <!-- Toggle Button -->
    <button 
        class="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full bg-[#1e1e1e] p-2 rounded-l-md shadow-md hover:bg-[#2a2a2a] transition-colors duration-200"
        on:click={() => isOpen = !isOpen}
    >
        {#if isOpen}
            <ChevronRight size={24} class="text-primary" />
        {:else}
            <ChevronLeft size={24} class="text-primary" />
        {/if}
    </button>

    <!-- Sidebar Content -->
    {#if isOpen}
        <div 
            class="w-72 bg-[#1e1e1e] rounded-l-md p-4 shadow-xl h-[70vh] overflow-y-auto"
            transition:fly={{ x: 300, duration: 300 }}
        >
            <h2 class="text-primary font-semibold mb-4 flex items-center justify-between border-b border-gray-700 pb-2">
                <span>Daily Transaction Labels</span>
                <span class="text-xs text-gray-400 bg-[#2a2a2a] px-2 py-1 rounded-md">
                    {currentDate.toLocaleDateString()}
                </span>
            </h2>

            {#if labelCounts.length === 0}
                <div class="flex flex-col items-center justify-center h-40 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="6" width="20" height="12" rx="2" />
                        <path d="M12 12h.01" />
                        <path d="M17 12h.01" />
                        <path d="M7 12h.01" />
                    </svg>
                    <p class="mt-2 text-sm">No transactions today</p>
                </div>
            {:else}
                <div class="max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                    <div class="space-y-3">
                        {#each labelCounts as label, i}
                            <div 
                                class="flex justify-between items-center p-2 rounded-md hover:bg-[#2a2a2a] transition-colors duration-200"
                                style="animation-delay: {i * 50}ms"
                            >
                                <div 
                                    class="flex items-center gap-3 text-sm truncate max-w-[75%]"
                                >
                                    <!-- SVG Circle with label color -->
                                    <svg width="14" height="14" viewBox="0 0 14 14" class="flex-shrink-0">
                                        <circle 
                                            cx="7" 
                                            cy="7" 
                                            r="6" 
                                            fill={extractColor(label.style)}
                                            stroke="#1e1e1e"
                                            stroke-width="1"
                                        />
                                    </svg>
                                    <span class="truncate text-gray-200">{label.label}</span>
                                </div>
                                <span 
                                    class="text-primary font-semibold bg-[#2a2a2a] px-2 py-1 rounded-md min-w-[32px] text-center"
                                >
                                    {label.count}
                                </span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
            
            <!-- Summary Section -->
            {#if labelCounts.length > 0}
                <div class="mt-6 pt-4 border-t border-gray-700">
                    <h3 class="text-sm text-gray-400 mb-2">Summary</h3>
                    <div class="bg-[#2a2a2a] rounded-md p-3">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-300">Total Transactions</span>
                            <span class="font-bold text-primary">
                                {labelCounts.reduce((sum, label) => sum + label.count, 0)}
                            </span>
                        </div>
                        <div class="flex justify-between items-center mt-2">
                            <span class="text-sm text-gray-300">Unique Labels</span>
                            <span class="font-bold text-primary">{labelCounts.length}</span>
                        </div>
                    </div>
                </div>
            {/if}
            
            <!-- Metrics & Export Section -->
            <div class="mt-6 pt-4 border-t border-gray-700">
                <div class="flex justify-between items-center">
                    <h3 class="text-sm text-gray-400">Metrics & Analytics</h3>
                    <button 
                        class="text-xs text-gray-400 hover:text-primary transition-colors"
                        on:click={() => showExportOptions = !showExportOptions}
                    >
                        {showExportOptions ? 'Hide Options' : 'Export Options'}
                    </button>
                </div>
                
                {#if showExportOptions}
                    <div class="mt-2 bg-[#2a2a2a] rounded-md p-3 space-y-2">
                        <button 
                            class="w-full flex items-center justify-between p-2 rounded bg-[#333] hover:bg-[#444] transition-colors"
                            on:click={exportDataAsJson}
                        >
                            <span class="text-sm text-gray-300">Export as JSON</span>
                            <Download size={16} class="text-gray-400" />
                        </button>
                        <button 
                            class="w-full flex items-center justify-between p-2 rounded bg-[#333] hover:bg-[#444] transition-colors"
                            on:click={exportDataAsCsv}
                        >
                            <span class="text-sm text-gray-300">Export as CSV</span>
                            <Download size={16} class="text-gray-400" />
                        </button>
                        <button 
                            class="w-full flex items-center justify-between p-2 rounded bg-[#333] hover:bg-[#444] transition-colors"
                            on:click={goToMetricsDashboard}
                        >
                            <span class="text-sm text-gray-300">View Dashboard</span>
                            <BarChart size={16} class="text-gray-400" />
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    /* Animation for list items */
    .space-y-3 > div {
        animation: slideIn 0.3s ease-out forwards;
        opacity: 0;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    /* Scrollbar styling */
    div.overflow-y-auto {
        scrollbar-width: thin;
        scrollbar-color: #444 #333;
    }

    div.overflow-y-auto::-webkit-scrollbar {
        width: 6px;
    }

    div.overflow-y-auto::-webkit-scrollbar-track {
        background: #333;
        border-radius: 3px;
    }

    div.overflow-y-auto::-webkit-scrollbar-thumb {
        background-color: #444;
        border-radius: 3px;
    }
    
    /* Custom scrollbar for the labels section */
    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #444 #2a2a2a;
    }

    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: #2a2a2a;
        border-radius: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #444;
        border-radius: 4px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #555;
    }
</style>