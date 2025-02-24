<script>
    import { onMount } from 'svelte';
    
    export let chartType = 'pie'; // Default to pie chart
    export let metricsData = [];
    export let selectedLabels = [];
    
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
    
    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    // Prepare data for daily transactions chart
    function prepareDailyData() {
        if (!metricsData || metricsData.length === 0) {
            return [];
        }
        
        // Sort by date (oldest to newest)
        return [...metricsData]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(day => {
                const dataPoint = {
                    date: formatDate(day.date),
                    rawDate: day.date,
                    total: day.totalTransactions || 0
                };
                
                // Check if labels exist and are in the correct format
                if (day.labels && Array.isArray(day.labels)) {
                    // Add selected label counts
                    day.labels.forEach(label => {
                        if (label && label.label && selectedLabels.includes(label.label)) {
                            dataPoint[label.label] = label.count || 0;
                        }
                    });
                }
                
                return dataPoint;
            });
    }
    
    // Create daily transactions chart (line chart)
    function createDailyChart() {
        if (!chartContainer) return;
        
        try {
            const data = prepareDailyData();
            
            if (!data || data.length === 0) {
                chartContainer.innerHTML = '<div class="empty-message">No data available for chart</div>';
                return;
            }
            
            // Clear previous chart if it exists
            chartContainer.innerHTML = '';
            
            // Create SVG
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', '0 0 400 250');
            chartContainer.appendChild(svg);
            
            // Calculate max values for scaling
            let maxTotal = 0;
            data.forEach(d => {
                if (d.total > maxTotal) maxTotal = d.total;
                selectedLabels.forEach(label => {
                    if (d[label] && d[label] > maxTotal) maxTotal = d[label];
                });
            });
            
            // Ensure we have a non-zero max value
            maxTotal = maxTotal || 100;
            
            // Add a little buffer at the top
            maxTotal = Math.ceil(maxTotal * 1.1);
            
            const yScale = maxTotal > 0 ? 200 / maxTotal : 1;
            
            // Create axes
            const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            xAxis.setAttribute('d', 'M 40 220 L 380 220');
            xAxis.setAttribute('stroke', '#666');
            xAxis.setAttribute('stroke-width', '1');
            svg.appendChild(xAxis);
            
            const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            yAxis.setAttribute('d', 'M 40 20 L 40 220');
            yAxis.setAttribute('stroke', '#666');
            yAxis.setAttribute('stroke-width', '1');
            svg.appendChild(yAxis);
            
            // Add y-axis labels (simplified)
            [0, maxTotal].forEach((label, i) => {
                const y = 220 - (i * 200);
                
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', '35');
                text.setAttribute('y', y + 4);
                text.setAttribute('text-anchor', 'end');
                text.setAttribute('font-size', '10');
                text.setAttribute('fill', '#999');
                text.textContent = label;
                svg.appendChild(text);
            });
            
            // Add grid line
            const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            gridLine.setAttribute('d', `M 40 120 L 380 120`);
            gridLine.setAttribute('stroke', '#333');
            gridLine.setAttribute('stroke-width', '1');
            gridLine.setAttribute('stroke-dasharray', '4 4');
            svg.appendChild(gridLine);
            
            // Add x-axis labels (just first and last)
            if (data.length > 0) {
                [0, data.length - 1].forEach((idx) => {
                    const x = 40 + ((idx / (data.length - 1)) * 340);
                    
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', x);
                    text.setAttribute('y', '235');
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('font-size', '10');
                    text.setAttribute('fill', '#999');
                    text.textContent = data[idx].date;
                    svg.appendChild(text);
                });
            }
            
            // Create total line - if we have data
            if (data.length > 0) {
                // We need at least two points to draw a line
                if (data.length === 1) {
                    // For a single point, just draw a marker
                    const x = 200; // Center point
                    const y = 220 - (data[0].total * yScale);
                    
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', x);
                    circle.setAttribute('cy', y);
                    circle.setAttribute('r', '5');
                    circle.setAttribute('fill', '#8884d8');
                    svg.appendChild(circle);
                } else {
                    // Multiple points - draw the line
                    let totalLinePath = '';
                    
                    data.forEach((d, i) => {
                        const x = 40 + ((i / (data.length - 1)) * 340);
                        const y = 220 - (d.total * yScale);
                        
                        if (i === 0) {
                            totalLinePath = `M ${x} ${y}`;
                        } else {
                            totalLinePath += ` L ${x} ${y}`;
                        }
                    });
                    
                    const totalLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    totalLine.setAttribute('d', totalLinePath);
                    totalLine.setAttribute('stroke', '#8884d8');
                    totalLine.setAttribute('stroke-width', '2');
                    totalLine.setAttribute('fill', 'none');
                    svg.appendChild(totalLine);
                    
                    // Add end points for the total line
                    [0, data.length - 1].forEach(i => {
                        const x = 40 + ((i / (data.length - 1)) * 340);
                        const y = 220 - (data[i].total * yScale);
                        
                        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        circle.setAttribute('cx', x);
                        circle.setAttribute('cy', y);
                        circle.setAttribute('r', '3');
                        circle.setAttribute('fill', '#8884d8');
                        svg.appendChild(circle);
                    });
                }
            }
            
            // Create simplified legend
            const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            legend.setAttribute('transform', 'translate(290, 30)');
            
            // Add 'Total' to legend
            const totalRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            totalRect.setAttribute('x', '0');
            totalRect.setAttribute('y', '0');
            totalRect.setAttribute('width', '10');
            totalRect.setAttribute('height', '10');
            totalRect.setAttribute('fill', '#8884d8');
            legend.appendChild(totalRect);
            
            const totalText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            totalText.setAttribute('x', '15');
            totalText.setAttribute('y', '9');
            totalText.setAttribute('font-size', '9');
            totalText.setAttribute('fill', '#ccc');
            totalText.textContent = 'Total';
            legend.appendChild(totalText);
            
            svg.appendChild(legend);
            
        } catch (error) {
            console.error('Error creating chart:', error);
            chartContainer.innerHTML = `<div class="error-message">Error creating chart: ${error.message}</div>`;
        }
    }
    
    // Create label distribution chart (bar chart)
    function createLabelChart() {
        if (!chartContainer) return;
        
        try {
            // Clear previous chart if it exists
            chartContainer.innerHTML = '';
            
            // Count total occurrences of each label
            const labelCounts = new Map();
            
            metricsData.forEach(day => {
                if (day && day.labels && Array.isArray(day.labels)) {
                    day.labels.forEach(label => {
                        if (label && label.label && selectedLabels.includes(label.label)) {
                            const count = labelCounts.get(label.label) || 0;
                            labelCounts.set(label.label, count + (label.count || 0));
                        }
                    });
                }
            });
            
            // Convert to array and sort by count
            const data = Array.from(labelCounts.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);
            
            if (data.length === 0) {
                chartContainer.innerHTML = '<div class="empty-message">No data available for chart</div>';
                return;
            }
            
            // Create SVG
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', '0 0 400 250');
            chartContainer.appendChild(svg);
            
            // Calculate max value for scaling
            const maxCount = Math.max(...data.map(d => d.count)) || 100;
            const barWidth = Math.min(30, 300 / (data.length * 1.5));
            
            // Create axes
            const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            xAxis.setAttribute('d', 'M 50 220 L 380 220');
            xAxis.setAttribute('stroke', '#666');
            xAxis.setAttribute('stroke-width', '1');
            svg.appendChild(xAxis);
            
            // Create bars
            data.forEach((d, i) => {
                const x = 50 + (i * (barWidth * 1.5));
                const barHeight = (d.count / maxCount) * 190;
                const y = 220 - barHeight;
                
                // Create bar
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', x);
                rect.setAttribute('y', y);
                rect.setAttribute('width', barWidth);
                rect.setAttribute('height', barHeight);
                rect.setAttribute('fill', COLORS[i % COLORS.length]);
                svg.appendChild(rect);
                
                // Add value on top of bar
                const value = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                value.setAttribute('x', x + (barWidth / 2));
                value.setAttribute('y', y - 5);
                value.setAttribute('text-anchor', 'middle');
                value.setAttribute('font-size', '10');
                value.setAttribute('fill', '#ccc');
                value.textContent = d.count;
                svg.appendChild(value);
                
                // Add label below bar
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', x + (barWidth / 2));
                label.setAttribute('y', 235);
                label.setAttribute('text-anchor', 'middle');
                label.setAttribute('font-size', '9');
                label.setAttribute('fill', '#999');
                
                // Truncate long label names
                const displayName = d.name.length > 8 ? d.name.substring(0, 6) + '...' : d.name;
                label.textContent = displayName;
                
                // Rotate labels if there are many
                if (data.length > 5) {
                    label.setAttribute('transform', `rotate(45, ${x + (barWidth / 2)}, 235)`);
                    label.setAttribute('text-anchor', 'start');
                    label.setAttribute('y', 228);
                }
                
                svg.appendChild(label);
            });
            
        } catch (error) {
            console.error('Error creating chart:', error);
            chartContainer.innerHTML = `<div class="error-message">Error creating chart: ${error.message}</div>`;
        }
    }
    
    // Create pie chart
    function createPieChart() {
        if (!chartContainer) return;
        
        try {
            // Clear previous chart if it exists
            chartContainer.innerHTML = '';
            
            // Count total occurrences of each label
            const labelCounts = new Map();
            let total = 0;
            
            metricsData.forEach(day => {
                if (day && day.labels && Array.isArray(day.labels)) {
                    day.labels.forEach(label => {
                        if (label && label.label && selectedLabels.includes(label.label)) {
                            const count = labelCounts.get(label.label) || 0;
                            const labelCount = label.count || 0;
                            labelCounts.set(label.label, count + labelCount);
                            total += labelCount;
                        }
                    });
                }
            });
            
            // Ensure we have a non-zero total
            total = total || 1;
            
            // Convert to array and sort by count
            const data = Array.from(labelCounts.entries())
                .map(([name, count]) => ({ name, count, percentage: (count / total) * 100 }))
                .sort((a, b) => b.count - a.count);
            
            if (data.length === 0) {
                chartContainer.innerHTML = '<div class="empty-message">No data available for chart</div>';
                return;
            }
            
            // Create SVG
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', '0 0 400 250');
            chartContainer.appendChild(svg);
            
            // Create pie chart
            const centerX = 130;
            const centerY = 130;
            const radius = 85;
            
            let startAngle = 0;
            
            // Create slices
            data.forEach((d, i) => {
                const angle = (d.percentage / 100) * Math.PI * 2;
                const endAngle = startAngle + angle;
                
                // Calculate points
                const x1 = centerX + radius * Math.cos(startAngle);
                const y1 = centerY + radius * Math.sin(startAngle);
                const x2 = centerX + radius * Math.cos(endAngle);
                const y2 = centerY + radius * Math.sin(endAngle);
                
                // Create path for slice
                const largeArcFlag = angle > Math.PI ? 1 : 0;
                const pathData = [
                    `M ${centerX} ${centerY}`,
                    `L ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    'Z'
                ].join(' ');
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathData);
                path.setAttribute('fill', COLORS[i % COLORS.length]);
                svg.appendChild(path);
                
                // For the top 3 labels, add a simple line and label
                if (i < 3) {
                    const midAngle = startAngle + (angle / 2);
                    const labelRadius = radius + 15;
                    const labelX = centerX + labelRadius * Math.cos(midAngle);
                    const labelY = centerY + labelRadius * Math.sin(midAngle);
                    
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', centerX + radius * Math.cos(midAngle));
                    line.setAttribute('y1', centerY + radius * Math.sin(midAngle));
                    line.setAttribute('x2', labelX);
                    line.setAttribute('y2', labelY);
                    line.setAttribute('stroke', '#666');
                    line.setAttribute('stroke-width', '1');
                    svg.appendChild(line);
                    
                    // Truncate long label names
                    const displayName = d.name.length > 10 ? d.name.substring(0, 8) + '...' : d.name;
                    const labelText = `${displayName} (${d.percentage.toFixed(1)}%)`;
                    
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', labelX + (Math.cos(midAngle) > 0 ? 5 : -5));
                    text.setAttribute('y', labelY);
                    text.setAttribute('text-anchor', Math.cos(midAngle) > 0 ? 'start' : 'end');
                    text.setAttribute('font-size', '9');
                    text.setAttribute('fill', '#ccc');
                    text.textContent = labelText;
                    svg.appendChild(text);
                }
                
                startAngle = endAngle;
            });
            
            // Create compact legend for all labels
            const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            legend.setAttribute('transform', 'translate(250, 30)');
            
            // Add legend title
            const legendTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            legendTitle.setAttribute('x', '0');
            legendTitle.setAttribute('y', '0');
            legendTitle.setAttribute('font-size', '10');
            legendTitle.setAttribute('font-weight', 'bold');
            legendTitle.setAttribute('fill', '#ccc');
            legendTitle.textContent = 'Label Breakdown';
            legend.appendChild(legendTitle);
            
            // Create a 2-column layout for the legend
            const legendItems = Math.min(data.length, 8); // Show up to 8 items
            const legendCols = 1;
            const legendRows = Math.ceil(legendItems / legendCols);
            
            for (let i = 0; i < legendItems; i++) {
                const row = i % legendRows;
                const col = Math.floor(i / legendRows);
                const x = col * 120;
                const y = row * 18 + 20; // Start 20px below the title
                
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', x);
                rect.setAttribute('y', y - 8);
                rect.setAttribute('width', '8');
                rect.setAttribute('height', '8');
                rect.setAttribute('fill', COLORS[i % COLORS.length]);
                legend.appendChild(rect);
                
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x + 12);
                text.setAttribute('y', y);
                text.setAttribute('font-size', '9');
                text.setAttribute('fill', '#ccc');
                
                // Truncate long label names
                const displayName = data[i].name.length > 12 ? data[i].name.substring(0, 10) + '...' : data[i].name;
                text.textContent = `${displayName} (${data[i].count})`;
                legend.appendChild(text);
            }
            
            svg.appendChild(legend);
            
        } catch (error) {
            console.error('Error creating chart:', error);
            chartContainer.innerHTML = `<div class="error-message">Error creating chart: ${error.message}</div>`;
        }
    }
    
    // Update the chart based on type
    function updateChart() {
        if (!chartContainer) return;
        
        try {
            if (chartType === 'daily') {
                createDailyChart();
            } else if (chartType === 'label') {
                createLabelChart();
            } else {
                createPieChart();
            }
        } catch (error) {
            console.error('Error updating chart:', error);
            chartContainer.innerHTML = `<div class="error-message">Error updating chart: ${error.message}</div>`;
        }
    }
    
    // Update chart when inputs change
    $: if (chartContainer && metricsData) {
        updateChart();
    }
    
    $: if (chartType) {
        updateChart();
    }
    
    $: if (selectedLabels) {
        updateChart();
    }
    
    onMount(() => {
        updateChart();
    });
</script>

<div class="chart-container" bind:this={chartContainer}>
    {#if !metricsData || metricsData.length === 0}
        <div class="empty-message">
            <p>No data available for chart visualization</p>
        </div>
    {/if}
</div>

<style>
    .chart-container {
        width: 100%;
        height: 100%;
        position: relative;
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