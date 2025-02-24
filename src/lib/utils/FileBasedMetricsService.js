// src/lib/utils/FileBasedMetricsService.js
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

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
    this.STORAGE_FILE = 'txstats.json';
    this.API_ENDPOINT = '/api/metrics'; // Path to your server endpoint
    this.MAX_DAYS_TO_STORE = 90; // Store 90 days of data
    this.debug('MetricsService initialized');
    this.loadFromFile();
  }

  /**
   * Debug logger
   */
  debug(message, data) {
    console.log(`🔍 METRICS SERVICE: ${message}`, data || '');
  }

  /**
   * Load metrics from file
   */
  async loadFromFile() {
    metricsStore.update(state => ({ ...state, isLoading: true }));
    this.debug('Loading metrics from file');
    
    try {
      // Use fetch to load data from the server
      const response = await fetch(`${this.API_ENDPOINT}/load`);
      
      if (!response.ok) {
        throw new Error(`Failed to load metrics: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Filter out invalid entries
        const validData = data.filter(day => {
          return day && day.date && day.labels && Array.isArray(day.labels);
        });
        
        metricsStore.update(state => ({
          ...state,
          dailyData: validData,
          isLoading: false
        }));
        
        this.debug('Successfully loaded metrics data', { count: validData.length });
      } else {
        this.debug('No valid metrics data found');
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
      
      // Initialize with empty data if loading fails
      if (browser) {
        this.debug('Falling back to localStorage');
        this.loadFromLocalStorage();
      }
    }
  }
  
  /**
   * Fallback to load from localStorage (migration path)
   */
  loadFromLocalStorage() {
    try {
      const storedData = localStorage.getItem('ergo_transaction_metrics');
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        if (Array.isArray(parsedData)) {
          metricsStore.update(state => ({
            ...state,
            dailyData: parsedData,
            isLoading: false
          }));
          
          this.debug('Loaded metrics from localStorage', { count: parsedData.length });
          
          // Save to file for future reference
          this.saveToFile(parsedData);
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }

  /**
   * Save metrics to file
   */
  async saveToFile(data) {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save metrics: ${response.statusText}`);
      }
      
      this.debug('Saved metrics data to file', { count: data.length });
    } catch (error) {
      console.error('❌ Error saving metrics data:', error);
      metricsStore.update(state => ({
        ...state,
        error: 'Failed to save metrics data: ' + (error.message || 'Unknown error')
      }));
      
      // Fallback to localStorage if saving to file fails
      if (browser) {
        this.saveToLocalStorage(data);
      }
    }
  }
  
  /**
   * Fallback to save to localStorage
   */
  saveToLocalStorage(data) {
    try {
      localStorage.setItem('ergo_transaction_metrics', JSON.stringify(data));
      this.debug('Saved metrics to localStorage (fallback)');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
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
  async saveDailyMetrics(labelCounts) {
    if (!labelCounts || !Array.isArray(labelCounts)) {
      console.error('❌ Invalid label counts:', labelCounts);
      return;
    }
    
    this.debug('Saving daily metrics', { labelCount: labelCounts.length });
    
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
      
      // Save to file
      this.saveToFile(newDailyData);
      
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
      this.debug('No valid daily data available');
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
      this.debug('No valid daily data available');
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
  async clearAllMetrics() {
    this.debug('Clearing all metrics data');
    
    try {
      const response = await fetch(`${this.API_ENDPOINT}/clear`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear metrics: ${response.statusText}`);
      }
      
      metricsStore.set({
        dailyData: [],
        isLoading: false,
        error: null
      });
      
      // Also clear localStorage if available
      if (browser) {
        localStorage.removeItem('ergo_transaction_metrics');
      }
      
      this.debug('Successfully cleared all metrics data');
    } catch (error) {
      console.error('Error clearing metrics data:', error);
      metricsStore.update(state => ({
        ...state,
        error: 'Failed to clear metrics data: ' + (error.message || 'Unknown error')
      }));
    }
  }
}

// Create and export singleton instance
export const metricsService = new MetricsService();

// Export store
export const metrics = { subscribe: metricsStore.subscribe };