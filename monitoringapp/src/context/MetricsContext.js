// src/context/MetricsContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchMetricsConfig as apiFetchConfig, fetchMetricsData as apiFetchData } from '../services/api';
import { processWeatherMetric } from '../services/weatherApi';

const MetricsContext = createContext();

export const useMetrics = () => useContext(MetricsContext);

export const MetricsProvider = ({ children }) => {
  const [metrics, setMetrics] = useState([]);
  const [metricsConfig, setMetricsConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(60000); // 1 minute default

  // Load metrics configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await apiFetchConfig();
        setMetricsConfig(config);
      } catch (err) {
        setError('Failed to load metrics configuration');
        console.error('Error loading metrics config:', err);
      }
    };
    
    loadConfig();
  }, []);

  // Load and refresh metrics data
  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      try {
        console.log("metricsConfig:", metricsConfig);
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

    // Skip if no config is loaded yet
    if (metricsConfig.length === 0) {
      return;
    }

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
      // Here you would make an API call to update the config in the backend
      // For now, we'll just update it locally
      const updatedConfig = metricsConfig.map(config => 
        config.id === metricId ? { ...config, ...updates } : config
      );
      setMetricsConfig(updatedConfig);
      return true;
    } catch (err) {
      console.error('Error updating metric config:', err);
      return false;
    }
  };

  // Add new metric to be monitored
  const addMetric = async (newMetric) => {
    try {
      // API call would go here
      setMetricsConfig([...metricsConfig, { ...newMetric, id: Date.now().toString() }]);
      return true;
    } catch (err) {
      console.error('Error adding metric:', err);
      return false;
    }
  };

  // Remove metric from monitoring
  const removeMetric = async (metricId) => {
    try {
      // API call would go here
      setMetricsConfig(metricsConfig.filter(config => config.id !== metricId));
      return true;
    } catch (err) {
      console.error('Error removing metric:', err);
      return false;
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
    analyzeTrend
  };

  return (
    <MetricsContext.Provider value={value}>
      {children}
    </MetricsContext.Provider>
  );
};