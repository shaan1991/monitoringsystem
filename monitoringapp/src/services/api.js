// src/services/api.js
// This file would normally connect to your actual data sources
// For demo purposes, it returns mock data

// Mock data to simulate database or Kibana response
const mockMetricsConfig = [
    {
      id: '1',
      name: 'Network Latency',
      description: 'Average network latency in milliseconds',
      dataSource: {
        type: 'kibana',
        query: 'index=network_metrics | avg(latency)',
        refreshInterval: 60000 // 1 minute
      },
      ucl: 150, // Upper Control Limit
      lcl: 50,  // Lower Control Limit
      unit: 'ms',
      criticalThreshold: 200
    },
    {
      id: '2',
      name: 'Call Drop Rate',
      description: 'Percentage of dropped calls',
      dataSource: {
        type: 'database',
        query: 'SELECT avg(drop_rate) FROM call_metrics WHERE time > now() - 1h',
        refreshInterval: 300000 // 5 minutes
      },
      ucl: 5,
      lcl: 0,
      unit: '%',
      criticalThreshold: 10
    },
    {
      id: '3',
      name: 'Active Users',
      description: 'Number of currently active users',
      dataSource: {
        type: 'kibana',
        query: 'index=user_sessions | count(distinct user_id)',
        refreshInterval: 120000 // 2 minutes
      },
      ucl: 10000,
      lcl: 1000,
      unit: 'users',
      criticalThreshold: null
    },
    {
      id: '4',
      name: 'API Response Time',
      description: 'Average API response time',
      dataSource: {
        type: 'database',
        query: 'SELECT avg(response_time) FROM api_logs WHERE time > now() - 30m',
        refreshInterval: 60000 // 1 minute
      },
      ucl: 300,
      lcl: 50,
      unit: 'ms',
      criticalThreshold: 500
    },
    {
      id: '5',
      name: 'Bandwidth Usage',
      description: 'Current bandwidth usage',
      dataSource: {
        type: 'kibana',
        query: 'index=network_traffic | sum(bytes) / 1024 / 1024',
        refreshInterval: 60000 // 1 minute
      },
      ucl: 800,
      lcl: 100,
      unit: 'Mbps',
      criticalThreshold: 950
    }
  ];
  
  // Generate realistic historical data for the past 24 hours
  const generateHistoricalData = (metricId, hours = 24, pointsPerHour = 12) => {
    const now = new Date();
    const data = [];
    const totalPoints = hours * pointsPerHour;
    const minutesPerPoint = 60 / pointsPerHour;
    
    // Different patterns based on metric ID
    let baseValue, amplitude, trend, noise;
    
    switch(metricId) {
      case '1': // Network Latency
        baseValue = 100;
        amplitude = 25;
        trend = 0.05;
        noise = 10;
        break;
      case '2': // Call Drop Rate
        baseValue = 2;
        amplitude = 1;
        trend = 0.01;
        noise = 0.5;
        break;
      case '3': // Active Users
        baseValue = 5000;
        amplitude = 2000;
        trend = 0;
        noise = 300;
        break;
      case '4': // API Response Time
        baseValue = 150;
        amplitude = 50;
        trend = 0.1;
        noise = 20;
        break;
      case '5': // Bandwidth Usage
        baseValue = 400;
        amplitude = 150;
        trend = 0.2;
        noise = 50;
        break;
      default:
        baseValue = 100;
        amplitude = 20;
        trend = 0;
        noise = 5;
    }
  
    for (let i = 0; i < totalPoints; i++) {
      const timestamp = new Date(now);
      timestamp.setMinutes(now.getMinutes() - (totalPoints - i) * minutesPerPoint);
      
      // Create some patterns in the data
      const timeComponent = Math.sin((i / (pointsPerHour * 6)) * Math.PI * 2); // 6-hour cycle
      const randomComponent = (Math.random() - 0.5) * 2 * noise;
      const trendComponent = trend * i;
      
      let value = baseValue + amplitude * timeComponent + randomComponent + trendComponent;
      
      // Ensure values don't go negative
      value = Math.max(0, value);
      
      data.push({
        timestamp: timestamp.toISOString(),
        value: value
      });
    }
    
    return data;
  };
  
  // Mock API functions
  export const fetchMetricsConfig = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...mockMetricsConfig];
  };
  
  export const fetchMetricsData = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate data for each metric
    return mockMetricsConfig.map(metric => ({
      id: metric.id,
      name: metric.name,
      currentValue: generateHistoricalData(metric.id, 0, 1)[0].value,
      historicalData: generateHistoricalData(metric.id),
      config: metric
    }));
  };
  
  // In a real implementation, you would have these functions too
  export const updateMetricConfig = async (metricId, updates) => {
    // Update metric config in database/Kibana
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true };
  };
  
  export const addMetricConfig = async (newMetric) => {
    // Add new metric config to database/Kibana
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, id: Date.now().toString() };
  };
  
  export const deleteMetricConfig = async (metricId) => {
    // Delete metric config from database/Kibana
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true };
  };
  
  // This function would connect to your actual data source (DB or Kibana)
  export const executeQuery = async (dataSource) => {
    // In a real implementation, this would connect to your database or Kibana
    // and execute the specified query
    console.log(`Executing ${dataSource.type} query: ${dataSource.query}`);
    
    // For now, just return mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: [] };
  };