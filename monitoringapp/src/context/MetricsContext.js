// src/context/MetricsContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchMetricsData as apiFetchData } from '../services/api';
import { processWeatherMetric } from '../services/weatherApi';
import MetricsService from '../services/MetricsService';

const MetricsContext = createContext();

export const useMetrics = () => useContext(MetricsContext);

export const MetricsProvider = ({ children }) => {
  const [metrics, setMetrics] = useState([]);
  const [metricsConfig, setMetricsConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(60000); // Default 1 minute
  const [offline, setOffline] = useState(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial status
    setOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load metrics configuration
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const config = await MetricsService.getMetricsConfig();
        setMetricsConfig(config);
        
        // Also load the refresh interval
        const interval = await MetricsService.getRefreshInterval();
        if (interval) {
          setRefreshInterval(interval);
        }
      } catch (err) {
        setError('Failed to load metrics configuration');
        console.error('Error loading metrics config:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadConfig();
  }, []);

  // Save refresh interval when it changes
  useEffect(() => {
    MetricsService.saveRefreshInterval(refreshInterval)
      .catch(err => console.error('Error saving refresh interval:', err));
  }, [refreshInterval]);

  // Load and refresh metrics data
  useEffect(() => {
    const loadMetrics = async () => {
      if (metricsConfig.length === 0) return;
      
      setLoading(true);
      try {
        const results = [];
        
        for (const metric of metricsConfig) {
          try {
            let currentValue = 0;
            let historicalData = [];
            
            // Process different data source types
            if (metric.dataSource.type === 'weather_api') {
              // Process weather API data
              const weatherData = await processWeatherMetric(metric);
              currentValue = weatherData.currentValue;
              historicalData = weatherData.historicalData;
            } else {
              // Handle existing data sources (kibana, database, api)
              const data = await fetchDataFromSource(metric.dataSource);
              currentValue = data.length > 0 ? data[data.length - 1].value : 0;
              historicalData = data;
            }
            
            results.push({
              id: metric.id,
              name: metric.name,
              currentValue,
              historicalData,
              config: metric
            });
          } catch (error) {
            console.error(`Error fetching data for metric ${metric.name}:`, error);
            
            results.push({
              id: metric.id,
              name: metric.name,
              error: error.message || 'Failed to fetch data',
              currentValue: null,
              historicalData: [],
              config: metric
            });
          }
        }
        
        setMetrics(results);
        setError(null);
      } catch (err) {
        setError('Failed to load metrics data');
        console.error('Error loading metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (metricsConfig.length === 0) return;

    loadMetrics();
    
    // Set up refresh interval
    const intervalId = setInterval(loadMetrics, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [metricsConfig, refreshInterval]);

  // Fetch data from a specific data source
  const fetchDataFromSource = async (dataSource) => {
    switch (dataSource.type) {
      case 'kibana':
      case 'database':
      case 'api':
        // For demo purposes, use the mock API
        return apiFetchData().then(allData => {
          // Find the metric that matches this data source query
          const matchedMetric = allData.find(m => 
            m.config.dataSource.query === dataSource.query
          );
          return matchedMetric ? matchedMetric.historicalData : [];
        });
      default:
        console.warn(`Unknown data source type: ${dataSource.type}`);
        return [];
    }
  };

  // Update metrics configuration
  const updateMetricConfig = async (metricId, updates) => {
    try {
      const result = await MetricsService.updateMetric(metricId, updates);
      
      if (result.success) {
        // Update local state
        setMetricsConfig(prev => 
          prev.map(config => config.id === metricId ? { ...config, ...updates } : config)
        );
        
        if (result.warning) {
          console.warn(result.warning);
        }
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating metric config:', err);
      return false;
    }
  };

  // Add new metric to be monitored
  const addMetric = async (newMetric) => {
    try {
      const result = await MetricsService.addMetric(newMetric);
      
      if (result.success) {
        // Update local state with the new id
        const metricWithId = { ...newMetric, id: result.id || Date.now().toString() };
        setMetricsConfig(prev => [...prev, metricWithId]);
        
        if (result.warning) {
          console.warn(result.warning);
        }
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error adding metric:', err);
      return false;
    }
  };

  // Remove metric from monitoring
  const removeMetric = async (metricId) => {
    try {
      const result = await MetricsService.deleteMetric(metricId);
      
      if (result.success) {
        // Update local state
        setMetricsConfig(prev => prev.filter(config => config.id !== metricId));
        
        if (result.warning) {
          console.warn(result.warning);
        }
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error removing metric:', err);
      return false;
    }
  };

  // Clear all saved metrics
  const clearAllMetrics = async () => {
    try {
      const result = await MetricsService.clearAllMetrics();
      
      if (result.success) {
        setMetricsConfig([]);
        
        if (result.warning) {
          console.warn(result.warning);
        }
      }
    } catch (err) {
      console.error('Error clearing metrics:', err);
    }
  };

  // Determine trend status based on historical data
  const analyzeTrend = (metricData) => {
    if (!metricData || metricData.length < 5) return 'steady';
    
    const recentValues = metricData.slice(-5).map(d => d.value);
    const differences = [];
    
    for (let i = 1; i < recentValues.length; i++) {
      differences.push(recentValues[i] - recentValues[i-1]);
    }
    
    const avgDifference = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
    const consistentDirection = differences.every(diff => Math.sign(diff) === Math.sign(differences[0]));
    
    if (Math.abs(avgDifference) < 0.01) return 'steady';
    if (!consistentDirection) return 'fluctuating';
    
    const rate = Math.abs(avgDifference);
    if (avgDifference > 0) {
      if (rate > 0.5) return 'rapidly-rising';
      if (rate > 0.2) return 'rising';
      return 'slow-rising';
    } else {
      if (rate > 0.5) return 'rapidly-falling';
      if (rate > 0.2) return 'falling';
      return 'slow-falling';
    }
  };

  const value = {
    metrics,
    metricsConfig,
    loading,
    error,
    refreshInterval,
    setRefreshInterval,
    updateMetricConfig,
    addMetric,
    removeMetric,
    clearAllMetrics,
    analyzeTrend,
    offline
  };

  return (
    <MetricsContext.Provider value={value}>
      {children}
    </MetricsContext.Provider>
  );
};