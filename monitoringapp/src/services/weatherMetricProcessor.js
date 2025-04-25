// src/services/weatherMetricProcessor.js
import { fetchWeatherData, fetchForecast } from './weatherApi';

export const processWeatherMetric = async (metricConfig) => {
  const { city, metricType } = metricConfig.dataSource.params;
  
  try {
    // Get current weather data
    const weatherData = await fetchWeatherData(city);
    
    // Process based on metric type
    let currentValue;
    
    switch (metricType) {
      case 'temperature':
        currentValue = weatherData.main.temp;
        break;
      case 'humidity':
        currentValue = weatherData.main.humidity;
        break;
      case 'wind_speed':
        currentValue = weatherData.wind.speed;
        break;
      case 'pressure':
        currentValue = weatherData.main.pressure;
        break;
      default:
        currentValue = 0;
    }
    
    // Get forecast for historical data
    const forecastData = await fetchForecast(city);
    
    // Process forecast data to create historical data points
    const historicalData = forecastData.list.map(item => {
      let value;
      
      switch (metricType) {
        case 'temperature':
          value = item.main.temp;
          break;
        case 'humidity':
          value = item.main.humidity;
          break;
        case 'wind_speed':
          value = item.wind.speed;
          break;
        case 'pressure':
          value = item.main.pressure;
          break;
        default:
          value = 0;
      }
      
      return {
        timestamp: item.dt_txt,
        value: value
      };
    });
    
    return {
      currentValue,
      historicalData
    };
  } catch (error) {
    console.error(`Error processing weather metric for ${city}:`, error);
    throw error;
  }
};