// src/components/MetricCard.js
import React from 'react';
import { useMetrics } from '../context/MetricsContext';
import MetricChart from './MetricChart';
import './MetricCard.css';

const MetricCard = ({ metric }) => {
  const { analyzeTrend } = useMetrics();
  
  // Format trend for display icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'steady': return '→';
      case 'slow-rising': return '↗';
      case 'rising': return '↑';
      case 'rapidly-rising': return '⇑';
      case 'slow-falling': return '↘';
      case 'falling': return '↓';
      case 'rapidly-falling': return '⇓';
      case 'fluctuating': return '↕';
      default: return '?';
    }
  };
  
  // Safe rendering of the metric value
  const renderValue = (value, unit) => {
    if (value === null || value === undefined) {
      return (
        <>
          <span className="value">N/A</span>
          <span className="unit">{unit}</span>
        </>
      );
    }
    
    return (
      <>
        <span className="value">{value.toFixed(2)}</span>
        <span className="unit">{unit}</span>
      </>
    );
  };
  
  if (!metric) return null;
  
  const id = metric.id || 'unknown';
  const name = metric.name || 'Unknown Metric';
  const currentValue = metric.currentValue;
  const historicalData = metric.historicalData || [];
  const config = metric.config || {};
  const error = metric.error;
  
  const ucl = config.ucl || 0;
  const lcl = config.lcl || 0;
  const unit = config.unit || '';
  const criticalThreshold = config.criticalThreshold;
  
  // Determine status for a metric
  const getStatus = (value, ucl, lcl, criticalThreshold) => {
    if (value === null || value === undefined) return 'unknown';
    
    if (criticalThreshold !== null && 
       ((value > criticalThreshold) || 
        (lcl !== null && value < lcl / 2))) {
      return 'critical';
    }
    if (value > ucl || value < lcl) {
      return 'warning';
    }
    return 'normal';
  };
  
  const status = getStatus(currentValue, ucl, lcl, criticalThreshold);
  const trend = historicalData.length > 0 ? analyzeTrend(historicalData) : 'unknown';
  
  return (
    <div className={`metric-card ${status}`}>
      <div className="metric-header">
        <h3>{name}</h3>
        <div className={`status-indicator ${status}`}>
          {status.toUpperCase()}
        </div>
      </div>
      
      <div className="metric-description">{config.description}</div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="metric-value-container">
        <div className="metric-value">
          {renderValue(currentValue, unit)}
        </div>
        
        <div className={`trend-indicator ${trend}`}>
          <span className="trend-icon">{getTrendIcon(trend)}</span>
          <span>{trend.replace('-', ' ')}</span>
        </div>
      </div>
      
      <div className="metric-thresholds">
        <div className="threshold">
          <span className="threshold-label">UCL</span>
          <span className="threshold-value">{ucl} {unit}</span>
        </div>
        
        <div className="threshold">
          <span className="threshold-label">LCL</span>
          <span className="threshold-value">{lcl} {unit}</span>
        </div>
        
        {criticalThreshold !== null && (
          <div className="threshold">
            <span className="threshold-label">Critical</span>
            <span className="threshold-value">{criticalThreshold} {unit}</span>
          </div>
        )}
      </div>
      
      <div className="metric-chart">
        {historicalData.length > 0 ? (
          <MetricChart 
            data={historicalData} 
            ucl={ucl}
            lcl={lcl}
            criticalThreshold={criticalThreshold}
            unit={unit}
          />
        ) : (
          <div className="no-data">No data available</div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;