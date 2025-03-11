// src/lib/utils/IndexedDBMetricsService.js
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
    this.DB_NAME = 'ergo_explorer_metrics';
    this.DB_VERSION = 1;
    this.STORE_NAME = 'transaction_metrics';
    this.MAX_DAYS_TO_STORE = 90; // Store 90 days of data
    
    if (browser) {
      this.initDB();
    }
  }

  /**
   * Debug logger
   */
  debug(message, data) {
    console.log(`📊 METRICS DB: ${message}`, data || '');
  }

  /**
   * Initialize IndexedDB
   */
  async initDB() {
    this.debug('Initializing IndexedDB');
    
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        const error = 'Your browser doesn\'t support IndexedDB';
        console.error(error);
        metricsStore.update(state => ({
          ...state,
          error
        }));
        reject(error);
        return;
      }
      
      // Open database connection
      const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      // Handle database upgrade (or creation)
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          // Create store with date as key path
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'date' });
          this.debug('Created metrics object store');
          
          // Add helpful indexes
          store.createIndex('date_idx', 'date', { unique: true });
        }
      };
      
      // Handle success
      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.debug('IndexedDB connection opened successfully');
        this.loadAllMetrics();
        resolve(this.db);
      };
      
      // Handle error
      request.onerror = (event) => {
        const error = 'Error opening IndexedDB';
        console.error(error, event.target.error);
        metricsStore.update(state => ({
          ...state,
          error
        }));
        reject(event.target.error);
      };
    });
  }

  /**
   * Get database connection
   */
  async getDB() {
    if (this.db) {
      return this.db;
    }
    
    // If db isn't initialized yet, initialize it
    return this.initDB();
  }

  /**
   * Load all metrics from IndexedDB
   */
  async loadAllMetrics() {
    metricsStore.update(state => ({ ...state, isLoading: true }));
    this.debug('Loading all metrics from IndexedDB');
    
    try {
      const db = await this.getDB();
      
      // Start a transaction and get the store
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      
      // Get all metrics
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const data = event.target.result;
          
          // Sort by date (newest first)
          data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          metricsStore.update(state => ({
            ...state,
            dailyData: data,
            isLoading: false
          }));
          
          this.debug(`Loaded ${data.length} metrics records from IndexedDB`);
          resolve(data);
        };
        
        request.onerror = (event) => {
          const error = 'Error loading metrics from IndexedDB';
          console.error(error, event.target.error);
          
          metricsStore.update(state => ({
            ...state,
            error,
            isLoading: false
          }));
          
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error accessing IndexedDB:', error);
      
      metricsStore.update(state => ({
        ...state,
        error: error.message || 'Error accessing IndexedDB',
        isLoading: false
      }));
      
      // Try to migrate from localStorage if available
      if (browser) {
        this.migrateFromLocalStorage();
      }
      
      return [];
    }
  }
  
  /**
   * Migrate data from localStorage (if available)
   */
  async migrateFromLocalStorage() {
    try {
      const storedData = localStorage.getItem('ergo_transaction_metrics');
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          this.debug(`Migrating ${parsedData.length} records from localStorage`);
          
          // Save each record to IndexedDB
          for (const dayData of parsedData) {
            await this.saveDailyMetricsToDb(dayData);
          }
          
          // Reload metrics from DB
          await this.loadAllMetrics();
          
          this.debug('Migration from localStorage completed');
        }
      }
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
    }
  }

  /**
   * Get date string in YYYY-MM-DD format
   */
  getDateString(date = new Date()) {
    return date.toISOString().split('T')[0];
  }

// Modified saveDailyMetricsToDb function in IndexedDBMetricsService.js
async saveDailyMetricsToDb(metricsRecord) {
    try {
        const db = await this.getDB();
        
        // Create a plain JavaScript copy of the metricsRecord
        // This removes any proxy objects and makes it cloneable
        const plainRecord = JSON.parse(JSON.stringify(metricsRecord));
        
        // Start a transaction and get the store
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        
        // Add or update the record
        const request = store.put(plainRecord);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                this.debug(`Saved metrics for ${plainRecord.date} to IndexedDB`);
                resolve();
            };
            
            request.onerror = (event) => {
                console.error('Error saving metrics to IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Error accessing IndexedDB:', error);
        throw error;
    }
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
    
    // Create a plain copy of the labelCounts array to avoid proxy issues
    const plainLabelCounts = JSON.parse(JSON.stringify(labelCounts));
    const totalTransactions = plainLabelCounts.reduce((sum, label) => sum + (label.count || 0), 0);
    
    try {
      // Create metrics record
      const metricsRecord = {
        date: today,
        labels: plainLabelCounts,
        totalTransactions
      };
      
      // Save to IndexedDB
      await this.saveDailyMetricsToDb(metricsRecord);
      
      // Update the store
      metricsStore.update(state => {
        // Create new dailyData array
        let newDailyData = [...(state.dailyData || [])];
        
        // Find if we already have metrics for today
        const todayIndex = newDailyData.findIndex(day => day && day.date === today);
        
        if (todayIndex >= 0) {
          // Update existing day
          newDailyData[todayIndex] = metricsRecord;
          this.debug('Updated existing day entry', { date: today });
        } else {
          // Add new day
          newDailyData.push(metricsRecord);
          this.debug('Added new day entry', { date: today });
          
          // Sort by date (newest first)
          newDailyData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          // Limit to MAX_DAYS_TO_STORE days
          if (newDailyData.length > this.MAX_DAYS_TO_STORE) {
            const toRemove = newDailyData.slice(this.MAX_DAYS_TO_STORE);
            newDailyData = newDailyData.slice(0, this.MAX_DAYS_TO_STORE);
            
            // Also remove from IndexedDB
            this.removeOldEntries(toRemove);
            
            this.debug('Trimmed data to max days', { max: this.MAX_DAYS_TO_STORE });
          }
        }
        
        return {
          ...state,
          dailyData: newDailyData
        };
      });
      
    } catch (error) {
      console.error('Error saving daily metrics:', error);
      
      metricsStore.update(state => ({
        ...state,
        error: error.message || 'Error saving metrics'
      }));
      
      // Fallback to localStorage
      this.saveToLocalStorage([...get(metricsStore).dailyData]);
    }
  }
  // Add this function to your IndexedDBMetricsService class
async debugViewAllData() {
    try {
      const data = await this.loadAllMetrics();
      console.table(data); // Shows data in table format in console
      return data;
    } catch (error) {
      console.error('Error viewing debug data:', error);
    }
  }
  /**
   * Remove old entries from IndexedDB
   */
  async removeOldEntries(entries) {
    if (!entries || entries.length === 0) return;
    
    try {
      const db = await this.getDB();
      
      // Start a transaction and get the store
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      // Delete each old entry
      for (const entry of entries) {
        store.delete(entry.date);
      }
      
      this.debug(`Removed ${entries.length} old entries from IndexedDB`);
    } catch (error) {
      console.error('Error removing old entries:', error);
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
    
    // Return already sorted days (by newest first)
    return state.dailyData.slice(0, days);
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
      const db = await this.getDB();
      
      // Start a transaction and get the store
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      // Clear the store
      const request = store.clear();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          // Update the store
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
          resolve();
        };
        
        request.onerror = (event) => {
          const error = 'Error clearing metrics data';
          console.error(error, event.target.error);
          
          metricsStore.update(state => ({
            ...state,
            error
          }));
          
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error clearing metrics data:', error);
      
      metricsStore.update(state => ({
        ...state,
        error: error.message || 'Error clearing metrics data'
      }));
    }
  }
}

// Create and export singleton instance
export const metricsService = new MetricsService();

// Export store
export const metrics = { subscribe: metricsStore.subscribe };