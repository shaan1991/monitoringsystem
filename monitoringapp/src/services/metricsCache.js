// src/services/metricsCache.js
import { getMetricsData } from './dataSourceIntegration';

class MetricsCache {
  constructor() {
    this.cache = new Map();
    this.loading = new Map();
    this.lastFetch = new Map();
    this.subscribers = new Map();
  }

  // Subscribe to metric updates
  subscribe(metricId, callback) {
    if (!this.subscribers.has(metricId)) {
      this.subscribers.set(metricId, new Set());
    }
    this.subscribers.get(metricId).add(callback);
    
    return () => {
      const subs = this.subscribers.get(metricId);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  // Notify subscribers of updates
  notifySubscribers(metricId, data) {
    const subs = this.subscribers.get(metricId);
    if (subs) {
      subs.forEach(callback => callback(data));
    }
  }

  // Get metric data with caching
  async getMetric(metricConfig) {
    const { id, dataSource } = metricConfig;
    const now = Date.now();
    const cacheTimeout = dataSource.refreshInterval || 60000;
    
    // Check if we have fresh data in cache
    if (this.cache.has(id)) {
      const lastFetchTime = this.lastFetch.get(id) || 0;
      if (now - lastFetchTime < cacheTimeout) {
        return this.cache.get(id);
      }
    }
    
    // Check if already loading this metric
    if (this.loading.get(id)) {
      return new Promise((resolve, reject) => {
        const unsub = this.subscribe(id, data => {
          unsub();
          resolve(data);
        });
        
        // Set a timeout to avoid hanging indefinitely
        setTimeout(() => {
          unsub();
          reject(new Error('Loading metric data timed out'));
        }, 30000);
      });
    }
    
    // Start loading
    this.loading.set(id, true);
    
    try {
      // Fetch new data
      const metrics = await getMetricsData([metricConfig]);
      const metricData = metrics[0];
      
      // Update cache
      this.cache.set(id, metricData);
      this.lastFetch.set(id, now);
      this.loading.set(id, false);
      
      // Notify subscribers
      this.notifySubscribers(id, metricData);
      
      return metricData;
    } catch (error) {
      this.loading.set(id, false);
      throw error;
    }
  }

  // Get multiple metrics
  async getMetrics(metricsConfig) {
    return Promise.all(
      metricsConfig.map(config => this.getMetric(config))
    );
  }

  // Get all metrics with a single batch request
  async getAllMetrics(metricsConfig) {
    // For metrics that need refresh
    const metricsToFetch = metricsConfig.filter(config => {
      const { id, dataSource } = config;
      const now = Date.now();
      const lastFetchTime = this.lastFetch.get(id) || 0;
      const cacheTimeout = dataSource.refreshInterval || 60000;
      
      return !this.cache.has(id) || now - lastFetchTime > cacheTimeout;
    });
    
    if (metricsToFetch.length > 0) {
      // Mark all as loading
      metricsToFetch.forEach(config => {
        this.loading.set(config.id, true);
      });
      
      try {
        // Batch fetch
        const freshMetrics = await getMetricsData(metricsToFetch);
        const now = Date.now();
        
        // Update cache with fresh data
        freshMetrics.forEach(metric => {
          this.cache.set(metric.id, metric);
          this.lastFetch.set(metric.id, now);
          this.loading.set(metric.id, false);
          this.notifySubscribers(metric.id, metric);
        });
      } catch (error) {
        metricsToFetch.forEach(config => {
          this.loading.set(config.id, false);
        });
        console.error('Error fetching metrics batch:', error);
      }
    }
    
    // Return all metrics from cache
    return metricsConfig.map(config => this.cache.get(config.id) || {
      id: config.id,
      name: config.name,
      error: 'Data not available',
      currentValue: null,
      historicalData: [],
      config: config
    });
  }

  // Clear cache for testing or forced refresh
  clearCache() {
    this.cache.clear();
    this.lastFetch.clear();
  }

  // Clear specific metric from cache
  invalidateMetric(metricId) {
    this.cache.delete(metricId);
    this.lastFetch.delete(metricId);
  }
}

// Create singleton instance
const metricsCache = new MetricsCache();
export default metricsCache;