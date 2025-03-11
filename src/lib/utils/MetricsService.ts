// src/lib/utils/MetricsService.ts
import { writable, get } from 'svelte/store';

export interface DailyMetrics {
  date: string;
  labels: Array<{
    label: string;
    count: number;
    style: string;
  }>;
  totalTransactions: number;
}

interface MetricsState {
  dailyData: DailyMetrics[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: MetricsState = {
  dailyData: [],
  isLoading: false,
  error: null
};

// Create a Svelte store for metrics
const metricsStore = writable<MetricsState>(initialState);

// Service to handle metrics data
class MetricsService {
  private readonly STORAGE_KEY = 'ergo_transaction_metrics';
  private readonly MAX_DAYS_TO_STORE = 90; // Store 90 days of data

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load metrics from localStorage
   */
  private loadFromStorage(): void {
    metricsStore.update(state => ({ ...state, isLoading: true }));
    
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        metricsStore.update(state => ({
          ...state,
          dailyData: parsedData,
          isLoading: false
        }));
        console.log('📊 Loaded metrics data from storage:', parsedData.length, 'days');
      } else {
        metricsStore.update(state => ({
          ...state,
          isLoading: false
        }));
        console.log('📊 No metrics data found in storage');
      }
    } catch (error) {
      console.error('❌ Error loading metrics data:', error);
      metricsStore.update(state => ({
        ...state,
        error: 'Failed to load metrics data',
        isLoading: false
      }));
    }
  }

  /**
   * Save metrics to localStorage
   */
  private saveToStorage(data: DailyMetrics[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('💾 Saved metrics data to storage:', data.length, 'days');
    } catch (error) {
      console.error('❌ Error saving metrics data:', error);
      metricsStore.update(state => ({
        ...state,
        error: 'Failed to save metrics data'
      }));
    }
  }

  /**
   * Get date string in YYYY-MM-DD format
   */
  private getDateString(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Save daily transaction metrics
   * @param labelCounts Array of label counts
   */
  saveDailyMetrics(labelCounts: Array<{ label: string, count: number, style: string }>): void {
    const today = this.getDateString();
    const totalTransactions = labelCounts.reduce((sum, label) => sum + label.count, 0);
    
    metricsStore.update(state => {
      // Create new dailyData array
      let newDailyData = [...state.dailyData];
      
      // Find if we already have metrics for today
      const todayIndex = newDailyData.findIndex(day => day.date === today);
      
      if (todayIndex >= 0) {
        // Update existing day
        newDailyData[todayIndex] = {
          date: today,
          labels: [...labelCounts],
          totalTransactions
        };
      } else {
        // Add new day
        newDailyData.push({
          date: today,
          labels: [...labelCounts],
          totalTransactions
        });
        
        // Sort by date (newest first)
        newDailyData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Limit to MAX_DAYS_TO_STORE days
        if (newDailyData.length > this.MAX_DAYS_TO_STORE) {
          newDailyData = newDailyData.slice(0, this.MAX_DAYS_TO_STORE);
        }
      }
      
      // Save to storage
      this.saveToStorage(newDailyData);
      
      return {
        ...state,
        dailyData: newDailyData
      };
    });
    
    console.log('📊 Saved daily metrics for:', today);
  }

  /**
   * Get metrics by date range
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   */
  getMetricsByDateRange(startDate: string, endDate: string): DailyMetrics[] {
    const state = get(metricsStore);
    
    return state.dailyData.filter(day => {
      return day.date >= startDate && day.date <= endDate;
    });
  }

  /**
   * Get metrics for the last N days
   * @param days Number of days to retrieve
   */
  getMetricsForLastDays(days: number): DailyMetrics[] {
    const state = get(metricsStore);
    
    // Sort by date (newest first) and take first 'days' items
    return state.dailyData
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, days);
  }

  /**
   * Export metrics data as JSON
   */
  exportMetricsAsJson(): string {
    const state = get(metricsStore);
    return JSON.stringify(state.dailyData, null, 2);
  }

  /**
   * Export metrics data as CSV
   */
  exportMetricsAsCsv(): string {
    const state = get(metricsStore);
    
    // Get all unique labels across all days
    const allLabels = new Set<string>();
    state.dailyData.forEach(day => {
      day.labels.forEach(label => {
        allLabels.add(label.label);
      });
    });
    
    // Create CSV header
    const headers = ['Date', 'Total Transactions', ...Array.from(allLabels)];
    const csvRows = [headers.join(',')];
    
    // Create CSV rows
    state.dailyData.forEach(day => {
      const labelMap = new Map<string, number>();
      
      // Create map of label to count
      day.labels.forEach(label => {
        labelMap.set(label.label, label.count);
      });
      
      // Create row data
      const rowData = [
        day.date,
        day.totalTransactions.toString(),
        ...Array.from(allLabels).map(label => labelMap.get(label)?.toString() || '0')
      ];
      
      csvRows.push(rowData.join(','));
    });
    
    return csvRows.join('\n');
  }

  /**
   * Clear all metrics data
   */
  clearAllMetrics(): void {
    metricsStore.set({
      dailyData: [],
      isLoading: false,
      error: null
    });
    
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🧹 Cleared all metrics data');
  }
}

// Create and export singleton instance
export const metricsService = new MetricsService();

// Export store
export const metrics = { subscribe: metricsStore.subscribe };