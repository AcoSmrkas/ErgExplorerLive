// src/lib/utils/MetricsService.js
import { writable, get } from 'svelte/store';

// Initial state
const initialState = {
  dailyData: [],
  isLoading: false,
  error: null
};

// Create a Svelte store for metrics
const metricsStore = writable(initialState);

// Service to handle metrics data
class MetricsService {
  constructor() {
    this.STORAGE_KEY = 'ergo_transaction_metrics';
    this.MAX_DAYS_TO_STORE = 90; // Store 90 days of data
    this.loadFromStorage();
  }

  /**
   * Debug logger
   */
  debug(message, data) {
    console.log(`🔍 METRICS SERVICE: ${message}`, data);
  }

  /**
   * Load metrics from localStorage
   */
  loadFromStorage() {
    metricsStore.update(state => ({ ...state, isLoading: true }));
    this.debug('Loading metrics from storage', {});
    
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      
      if (storedData) {
        let parsedData;
        try {
          parsedData = JSON.parse(storedData);
          this.debug('Parsed stored data', { count: parsedData.length });
        } catch (parseError) {
          console.error('❌ Error parsing stored data:', parseError);
          metricsStore.update(state => ({
            ...state,
            error: 'Failed to parse stored metrics data',
            isLoading: false
          }));
          return;
        }
        
        // Validate data structure
        if (!Array.isArray(parsedData)) {
          console.error('❌ Stored data is not an array:', parsedData);
          metricsStore.update(state => ({
            ...state,
            error: 'Invalid metrics data format',
            isLoading: false
          }));
          return;
        }
        
        // Filter out invalid entries
        const validData = parsedData.filter(day => {
          return day && day.date && day.labels && Array.isArray(day.labels);
        });
        
        metricsStore.update(state => ({
          ...state,
          dailyData: validData,
          isLoading: false
        }));
        
        this.debug('Successfully loaded metrics data', { 
          count: validData.length,
          sample: validData.length > 0 ? validData[0] : null
        });
      } else {
        this.debug('No stored metrics data found', {});
        metricsStore.update(state => ({
          ...state,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('❌ Error loading metrics data:', error);
      metricsStore.update(state => ({
        ...state,
        error: 'Failed to load metrics data: ' + (error.message || 'Unknown error'),
        isLoading: false
      }));
    }
  }

  /**
   * Save metrics to localStorage
   */
  saveToStorage(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      this.debug('Saved metrics data to storage', { count: data.length });
    } catch (error) {
      console.error('❌ Error saving metrics data:', error);
      metricsStore.update(state => ({
        ...state,
        error: 'Failed to save metrics data: ' + (error.message || 'Unknown error')
      }));
    }
  }

  /**
   * Get date string in YYYY-MM-DD format
   */
  getDateString(date = new Date()) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Save daily transaction metrics
   * @param {Array} labelCounts Array of label counts
   */
  saveDailyMetrics(labelCounts) {
    if (!labelCounts || !Array.isArray(labelCounts)) {
      console.error('❌ Invalid label counts:', labelCounts);
      return;
    }
    
    this.debug('Saving daily metrics', { labelCounts });
    
    const today = this.getDateString();
    const totalTransactions = labelCounts.reduce((sum, label) => sum + (label.count || 0), 0);
    
    metricsStore.update(state => {
      // Create new dailyData array
      let newDailyData = [...(state.dailyData || [])];
      
      // Find if we already have metrics for today
      const todayIndex = newDailyData.findIndex(day => day && day.date === today);
      
      if (todayIndex >= 0) {
        // Update existing day
        newDailyData[todayIndex] = {
          date: today,
          labels: [...labelCounts],
          totalTransactions
        };
        this.debug('Updated existing day entry', { date: today });
      } else {
        // Add new day
        newDailyData.push({
          date: today,
          labels: [...labelCounts],
          totalTransactions
        });
        this.debug('Added new day entry', { date: today });
        
        // Sort by date (newest first)
        newDailyData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Limit to MAX_DAYS_TO_STORE days
        if (newDailyData.length > this.MAX_DAYS_TO_STORE) {
          newDailyData = newDailyData.slice(0, this.MAX_DAYS_TO_STORE);
          this.debug('Trimmed data to max days', { max: this.MAX_DAYS_TO_STORE });
        }
      }
      
      // Save to storage
      this.saveToStorage(newDailyData);
      
      return {
        ...state,
        dailyData: newDailyData
      };
    });
  }

  /**
   * Get metrics by date range
   * @param {string} startDate Start date (YYYY-MM-DD)
   * @param {string} endDate End date (YYYY-MM-DD)
   * @returns {Array} Array of metrics data
   */
  getMetricsByDateRange(startDate, endDate) {
    const state = get(metricsStore);
    this.debug('Getting metrics by date range', { startDate, endDate });
    
    if (!state.dailyData || !Array.isArray(state.dailyData)) {
      this.debug('No valid daily data available', {});
      return [];
    }
    
    return state.dailyData.filter(day => {
      return day && day.date && day.date >= startDate && day.date <= endDate;
    });
  }

  /**
   * Get metrics for the last N days
   * @param {number} days Number of days to retrieve
   * @returns {Array} Array of metrics data
   */
  getMetricsForLastDays(days) {
    const state = get(metricsStore);
    this.debug('Getting metrics for last days', { days });
    
    if (!state.dailyData || !Array.isArray(state.dailyData)) {
      this.debug('No valid daily data available', {});
      return [];
    }
    
    // Sort by date (newest first) and take first 'days' items
    const sortedData = [...state.dailyData]
      .filter(day => day && day.date) // Ensure valid entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, days);
    
    this.debug('Retrieved metrics for last days', { 
      requested: days, 
      retrieved: sortedData.length 
    });
    
    return sortedData;
  }

  /**
   * Export metrics data as JSON
   * @returns {string} JSON string
   */
  exportMetricsAsJson() {
    const state = get(metricsStore);
    this.debug('Exporting metrics as JSON', { count: state.dailyData.length });
    return JSON.stringify(state.dailyData, null, 2);
  }

  /**
   * Export metrics data as CSV
   * @returns {string} CSV string
   */
  exportMetricsAsCsv() {
    const state = get(metricsStore);
    this.debug('Exporting metrics as CSV', { count: state.dailyData.length });
    
    if (!state.dailyData || !Array.isArray(state.dailyData) || state.dailyData.length === 0) {
      return 'Date,Total Transactions\nNo data available';
    }
    
    // Get all unique labels across all days
    const allLabels = new Set();
    state.dailyData.forEach(day => {
      if (day && day.labels && Array.isArray(day.labels)) {
        day.labels.forEach(label => {
          if (label && label.label) {
            allLabels.add(label.label);
          }
        });
      }
    });
    
    // Create CSV header
    const headers = ['Date', 'Total Transactions', ...Array.from(allLabels)];
    const csvRows = [headers.join(',')];
    
    // Create CSV rows
    state.dailyData.forEach(day => {
      if (!day || !day.date) return;
      
      const labelMap = new Map();
      
      // Create map of label to count
      if (day.labels && Array.isArray(day.labels)) {
        day.labels.forEach(label => {
          if (label && label.label) {
            labelMap.set(label.label, label.count || 0);
          }
        });
      }
      
      // Create row data
      const rowData = [
        day.date,
        (day.totalTransactions || 0).toString(),
        ...Array.from(allLabels).map(label => {
          const count = labelMap.get(label);
          return count !== undefined ? count.toString() : '0';
        })
      ];
      
      csvRows.push(rowData.join(','));
    });
    
    return csvRows.join('\n');
  }

  /**
   * Clear all metrics data
   */
  clearAllMetrics() {
    this.debug('Clearing all metrics data', {});
    metricsStore.set({
      dailyData: [],
      isLoading: false,
      error: null
    });
    
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Create and export singleton instance
export const metricsService = new MetricsService();

// Export store
export const metrics = { subscribe: metricsStore.subscribe };