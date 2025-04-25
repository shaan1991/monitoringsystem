// src/services/dataSourceIntegration.js
import axios from 'axios';

// Configuration for different data sources
const dataSourceConfig = {
  kibana: {
    baseUrl: process.env.REACT_APP_KIBANA_URL || 'http://localhost:5601',
    apiPath: '/api/console/proxy',
    headers: {
      'kbn-xsrf': 'true',
      'Content-Type': 'application/json'
    }
  },
  database: {
    baseUrl: process.env.REACT_APP_DB_API_URL || 'http://localhost:3001',
    apiPath: '/api/query',
    headers: {
      'Content-Type': 'application/json'
    }
  }
};

// Kibana query execution
export const executeKibanaQuery = async (query, timeRange = '15m') => {
  try {
    const { baseUrl, apiPath, headers } = dataSourceConfig.kibana;
    
    // Format the query for Kibana
    const kibanaQuery = {
      query: query,
      time: {
        from: `now-${timeRange}`,
        to: 'now'
      }
    };
    
    const response = await axios.post(
      `${baseUrl}${apiPath}`,
      kibanaQuery,
      { headers }
    );
    
    // Process Kibana response format
    if (response.data && response.data.hits) {
      return {
        success: true,
        data: processKibanaResponse(response.data, query)
      };
    }
    
    return {
      success: false,
      error: 'Invalid response format from Kibana'
    };
  } catch (error) {
    console.error('Kibana query error:', error);
    return {
      success: false,
      error: error.message || 'Failed to execute Kibana query'
    };
  }
};

// Database query execution
export const executeDatabaseQuery = async (query) => {
  try {
    const { baseUrl, apiPath, headers } = dataSourceConfig.database;
    
    const response = await axios.post(
      `${baseUrl}${apiPath}`,
      { query },
      { headers }
    );
    
    if (response.data) {
      return {
        success: true,
        data: processDatabaseResponse(response.data)
      };
    }
    
    return {
      success: false,
      error: 'Invalid response from database API'
    };
  } catch (error) {
    console.error('Database query error:', error);
    return {
      success: false,
      error: error.message || 'Failed to execute database query'
    };
  }
};

// Generic API data fetching
export const fetchApiData = async (url, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    return {
      success: true,
      data: responseData
    };
  } catch (error) {
    console.error('API fetch error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch API data'
    };
  }
};

// Process raw Kibana response into standardized format for our charts
const processKibanaResponse = (rawData, query) => {
  // Different processing based on query type
  if (query.includes('avg(')) {
    // Handle average aggregation
    return extractKibanaAggregation(rawData);
  } else if (query.includes('count(')) {
    // Handle count aggregation
    return extractKibanaCount(rawData);
  } else {
    // Handle raw documents
    return extractKibanaDocuments(rawData);
  }
};

// Process database response into standardized format
const processDatabaseResponse = (rawData) => {
  // Convert database response to time series data
  if (Array.isArray(rawData)) {
    return rawData.map(row => ({
      timestamp: row.timestamp || new Date().toISOString(),
      value: parseFloat(row.value || row.average || row.count || 0)
    }));
  } else if (rawData.value !== undefined) {
    // Single value response
    return [{
      timestamp: new Date().toISOString(),
      value: parseFloat(rawData.value)
    }];
  }
  
  // Handle unknown format
  return [{ timestamp: new Date().toISOString(), value: 0 }];
};

// Helper functions for Kibana response processing
const extractKibanaAggregation = (rawData) => {
  if (rawData.aggregations && rawData.aggregations.average) {
    return [{
      timestamp: new Date().toISOString(),
      value: rawData.aggregations.average.value || 0
    }];
  }
  return [{ timestamp: new Date().toISOString(), value: 0 }];
};

const extractKibanaCount = (rawData) => {
  return [{
    timestamp: new Date().toISOString(),
    value: rawData.hits?.total?.value || 0
  }];
};

const extractKibanaDocuments = (rawData) => {
  if (rawData.hits && Array.isArray(rawData.hits.hits)) {
    return rawData.hits.hits.map(hit => ({
      timestamp: hit._source['@timestamp'] || new Date().toISOString(),
      value: hit._source.value || 0,
      metadata: hit._source
    }));
  }
  return [{ timestamp: new Date().toISOString(), value: 0 }];
};

// Enhanced API for metrics data
export const getMetricsData = async (metricsConfig) => {
  const results = [];
  
  for (const metric of metricsConfig) {
    let data;
    const { dataSource } = metric;
    
    try {
      if (dataSource.type === 'kibana') {
        const response = await executeKibanaQuery(dataSource.query);
        data = response.success ? response.data : [];
      } else if (dataSource.type === 'database') {
        const response = await executeDatabaseQuery(dataSource.query);
        data = response.success ? response.data : [];
      } else if (dataSource.type === 'api') {
        const response = await fetchApiData(dataSource.query);
        data = response.success ? response.data : [];
      } else {
        console.warn(`Unknown data source type: ${dataSource.type}`);
        data = [];
      }
      
      // Get current value from the latest data point
      const currentValue = data.length > 0 ? data[data.length - 1].value : 0;
      
      results.push({
        id: metric.id,
        name: metric.name,
        currentValue,
        historicalData: data,
        config: metric
      });
    } catch (error) {
      console.error(`Error fetching data for metric ${metric.name}:`, error);
      
      // Still include the metric with error status
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
  
  return results;
};