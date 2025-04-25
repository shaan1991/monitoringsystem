// src/components/MetricGrid.js
import React from 'react';
import { useMetrics } from '../context/MetricsContext';
import MetricChart from './MetricChart';
import './MetricGrid.css';

const MetricGrid = ({ metrics }) => {
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
  
  // Safe rendering of the metric value
  const renderValue = (value, unit) => {
    if (value === null || value === undefined) {
      return (
        <>
          <span className="value-number">N/A</span>
          <span className="value-unit">{unit}</span>
        </>
      );
    }
    
    return (
      <>
        <span className="value-number">{value.toFixed(2)}</span>
        <span className="value-unit">{unit}</span>
      </>
    );
  };
  
  return (
    <div className="metric-grid">
      <div className="grid-header">
        <div className="col name">Metric</div>
        <div className="col value">Current Value</div>
        <div className="col trend">Trend</div>
        <div className="col thresholds">Thresholds</div>
        <div className="col chart">24h Chart</div>
      </div>
      
      {metrics && metrics.map(metric => {
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
        
        const status = getStatus(currentValue, ucl, lcl, criticalThreshold);
        const trend = historicalData.length > 0 ? analyzeTrend(historicalData) : 'unknown';
        
        return (
          <div key={id} className={`grid-row ${status}`}>
            <div className="col name">
              <div className={`status-dot ${status}`}></div>
              <span>{name}</span>
              {error && <div className="error-message">{error}</div>}
            </div>
            
            <div className="col value">
              {renderValue(currentValue, unit)}
            </div>
            
            <div className="col trend">
              <div className={`trend-indicator ${trend}`}>
                <span className="trend-icon">{getTrendIcon(trend)}</span>
              </div>
            </div>
            
            <div className="col thresholds">
              <div>UCL: {ucl} {unit}</div>
              <div>LCL: {lcl} {unit}</div>
            </div>
            
            <div className="col chart">
              <div className="mini-chart">
                {historicalData.length > 0 ? (
                  <MetricChart 
                    data={historicalData} 
                    ucl={ucl}
                    lcl={lcl}
                    criticalThreshold={criticalThreshold}
                    unit={unit}
                    mini={true}
                  />
                ) : (
                  <div className="no-data">No data available</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricGrid;