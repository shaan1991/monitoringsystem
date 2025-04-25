// src/services/MetricsService.js
import axios from 'axios';

// Backend API URL - replace with your actual backend URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Fallback to localStorage when offline
const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Error saving to localStorage:', err);
    return false;
  }
};

const getFromLocalStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Error reading from localStorage:', err);
    return null;
  }
};

// Main service methods
export const MetricsService = {
  // Get metrics config from server or local fallback
  async getMetricsConfig() {
    try {
      const response = await axios.get(`${API_URL}/metrics-config`);
      
      // Store for offline use
      if (response.data) {
        saveToLocalStorage('metricsConfig', response.data);
      }
      
      return response.data;
    } catch (err) {
      console.warn('Failed to fetch from server, using local storage:', err);
      
      // Fall back to local storage
      const localData = getFromLocalStorage('metricsConfig');
      return localData || [];
    }
  },
  
  // Save metrics config to server and local
  async saveMetricsConfig(metricsConfig) {
    try {
      const response = await axios.post(`${API_URL}/metrics-config`, metricsConfig);
      
      // Store locally too
      saveToLocalStorage('metricsConfig', metricsConfig);
      
      return response.data;
    } catch (err) {
      console.warn('Failed to save to server, saving locally:', err);
      
      // At least save locally
      const saved = saveToLocalStorage('metricsConfig', metricsConfig);
      return saved ? { success: true, warning: 'Saved locally only' } : { success: false };
    }
  },
  
  // Update a specific metric
  async updateMetric(metricId, updates) {
    try {
      const response = await axios.put(`${API_URL}/metrics/${metricId}`, updates);
      
      // Update local storage too
      const localConfig = getFromLocalStorage('metricsConfig') || [];
      const updatedConfig = localConfig.map(config => 
        config.id === metricId ? { ...config, ...updates } : config
      );
      saveToLocalStorage('metricsConfig', updatedConfig);
      
      return response.data;
    } catch (err) {
      console.warn('Failed to update on server, updating locally:', err);
      
      // At least update locally
      const localConfig = getFromLocalStorage('metricsConfig') || [];
      const updatedConfig = localConfig.map(config => 
        config.id === metricId ? { ...config, ...updates } : config
      );
      const saved = saveToLocalStorage('metricsConfig', updatedConfig);
      
      return saved ? { success: true, warning: 'Updated locally only' } : { success: false };
    }
  },
  
  // Add a new metric
  async addMetric(metric) {
    // Generate ID on client if not present
    const metricWithId = metric.id ? metric : { ...metric, id: Date.now().toString() };
    
    try {
      const response = await axios.post(`${API_URL}/metrics`, metricWithId);
      
      // Update local storage too
      const localConfig = getFromLocalStorage('metricsConfig') || [];
      saveToLocalStorage('metricsConfig', [...localConfig, metricWithId]);
      
      return response.data;
    } catch (err) {
      console.warn('Failed to add on server, adding locally:', err);
      
      // At least add locally
      const localConfig = getFromLocalStorage('metricsConfig') || [];
      const saved = saveToLocalStorage('metricsConfig', [...localConfig, metricWithId]);
      
      return saved ? { success: true, id: metricWithId.id, warning: 'Added locally only' } : { success: false };
    }
  },
  
  // Delete a metric
  async deleteMetric(metricId) {
    try {
      const response = await axios.delete(`${API_URL}/metrics/${metricId}`);
      
      // Update local storage too
      const localConfig = getFromLocalStorage('metricsConfig') || [];
      const updatedConfig = localConfig.filter(config => config.id !== metricId);
      saveToLocalStorage('metricsConfig', updatedConfig);
      
      return response.data;
    } catch (err) {
      console.warn('Failed to delete on server, deleting locally:', err);
      
      // At least delete locally
      const localConfig = getFromLocalStorage('metricsConfig') || [];
      const updatedConfig = localConfig.filter(config => config.id !== metricId);
      const saved = saveToLocalStorage('metricsConfig', updatedConfig);
      
      return saved ? { success: true, warning: 'Deleted locally only' } : { success: false };
    }
  },
  
  // Clear all metrics
  async clearAllMetrics() {
    try {
      const response = await axios.delete(`${API_URL}/metrics`);
      
      // Clear local storage too
      localStorage.removeItem('metricsConfig');
      
      return response.data;
    } catch (err) {
      console.warn('Failed to clear on server, clearing locally:', err);
      
      // At least clear locally
      localStorage.removeItem('metricsConfig');
      
      return { success: true, warning: 'Cleared locally only' };
    }
  },
  
  // Get/set refresh interval
  async getRefreshInterval() {
    try {
      const response = await axios.get(`${API_URL}/settings/refresh-interval`);
      
      // Store for offline use
      if (response.data) {
        localStorage.setItem('refreshInterval', response.data.toString());
      }
      
      return response.data;
    } catch (err) {
      console.warn('Failed to fetch refresh interval, using local storage:', err);
      
      // Fall back to local storage
      const localInterval = localStorage.getItem('refreshInterval');
      return localInterval ? parseInt(localInterval, 10) : 60000;
    }
  },
  
  async saveRefreshInterval(interval) {
    try {
      const response = await axios.post(`${API_URL}/settings/refresh-interval`, { interval });
      
      // Store locally too
      localStorage.setItem('refreshInterval', interval.toString());
      
      return response.data;
    } catch (err) {
      console.warn('Failed to save refresh interval to server, saving locally:', err);
      
      // At least save locally
      localStorage.setItem('refreshInterval', interval.toString());
      
      return { success: true, warning: 'Saved locally only' };
    }
  }
};

export default MetricsService;