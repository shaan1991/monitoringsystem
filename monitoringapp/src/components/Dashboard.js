// src/components/Dashboard.js
import React, { useState } from 'react';
import { useMetrics } from '../context/MetricsContext';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import './Dashboard.css';

const Dashboard = () => {
  const { metrics, loading, error, refreshInterval, setRefreshInterval } = useMetrics();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'cards'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'normal', 'warning', 'critical'

  // Filter metrics based on their status
  const filteredMetrics = metrics.filter(metric => {
    if (filterStatus === 'all') return true;
    
    const value = metric.currentValue;
    const { ucl, lcl, criticalThreshold } = metric.config;
    
    if (filterStatus === 'normal') {
      return value <= ucl && value >= lcl;
    } else if (filterStatus === 'warning') {
      return value > ucl || value < lcl;
    } else if (filterStatus === 'critical') {
      return criticalThreshold !== null && 
             ((value > criticalThreshold) || 
              (lcl !== null && value < lcl / 2));
    }
    
    return true;
  });

  if (loading && metrics.length === 0) {
    return <div className="loading">Loading metrics data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Telecom Metrics Monitoring</h1>
        <div className="dashboard-controls">
          <div className="view-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''} 
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </button>
            <button 
              className={viewMode === 'cards' ? 'active' : ''} 
              onClick={() => setViewMode('cards')}
            >
              Card View
            </button>
          </div>
          
          <div className="filter-controls">
            <label>Filter:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Metrics</option>
              <option value="normal">Normal</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          <div className="refresh-controls">
            <label>Refresh Rate:</label>
            <select 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              <option value={30000}>30 seconds</option>
              <option value={60000}>1 minute</option>
              <option value={300000}>5 minutes</option>
              <option value={600000}>10 minutes</option>
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <MetricGrid metrics={filteredMetrics} />
      ) : (
        <div className="metrics-container">
          {filteredMetrics.map(metric => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;