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
  
  return (
    <div className="metric-grid">
      <div className="grid-header">
        <div className="col name">Metric</div>
        <div className="col value">Current Value</div>
        <div className="col trend">Trend</div>
        <div className="col thresholds">Thresholds</div>
        <div className="col chart">24h Chart</div>
      </div>
      
      {metrics.map(metric => {
        const { id, name, currentValue, historicalData, config } = metric;
        const { ucl, lcl, unit, criticalThreshold } = config;
        const status = getStatus(currentValue, ucl, lcl, criticalThreshold);
        const trend = analyzeTrend(historicalData);
        
        return (
          <div key={id} className={`grid-row ${status}`}>
            <div className="col name">
              <div className={`status-dot ${status}`}></div>
              <span>{name}</span>
            </div>
            
            <div className="col value">
              <span className="value-number">{currentValue.toFixed(2)}</span>
              <span className="value-unit">{unit}</span>
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
                <MetricChart 
                  data={historicalData} 
                  ucl={ucl}
                  lcl={lcl}
                  criticalThreshold={criticalThreshold}
                  mini={true}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricGrid;