// src/components/AdminPanel.js
import React, { useState } from 'react';
import { useMetrics } from '../context/MetricsContext';
import MetricConfigForm from './MetricConfigForm';
import './AdminPanel.css';

const AdminPanel = () => {
  const { metricsConfig, updateMetricConfig, addMetric, removeMetric } = useMetrics();
  const [editingMetric, setEditingMetric] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const handleEditClick = (metric) => {
    setEditingMetric(metric);
    setIsAddingNew(false);
  };
  
  const handleAddNewClick = () => {
    setEditingMetric(null);
    setIsAddingNew(true);
  };
  
  const handleSaveMetric = async (metricData) => {
    let success = false;
    
    if (isAddingNew) {
      success = await addMetric(metricData);
    } else if (editingMetric) {
      success = await updateMetricConfig(editingMetric.id, metricData);
    }
    
    if (success) {
      setEditingMetric(null);
      setIsAddingNew(false);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingMetric(null);
    setIsAddingNew(false);
  };
  
  const handleDeleteMetric = async (metricId) => {
    if (window.confirm('Are you sure you want to delete this metric?')) {
      const success = await removeMetric(metricId);
      if (success) {
        setEditingMetric(null);
      }
    }
  };
  
  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Metrics Configuration</h1>
        <button className="add-metric-btn" onClick={handleAddNewClick}>Add New Metric</button>
      </div>
      
      {(isAddingNew || editingMetric) ? (
        <MetricConfigForm 
          metric={editingMetric}
          onSave={handleSaveMetric}
          onCancel={handleCancelEdit}
          onDelete={editingMetric ? () => handleDeleteMetric(editingMetric.id) : null}
        />
      ) : (
        <div className="metrics-list">
          <div className="metrics-list-header">
            <div className="col name">Metric Name</div>
            <div className="col thresholds">Thresholds</div>
            <div className="col source">Data Source</div>
            <div className="col actions">Actions</div>
          </div>
          
          {metricsConfig.map(metric => (
            <div key={metric.id} className="metrics-list-item">
              <div className="col name">
                <div className="metric-name">{metric.name}</div>
                <div className="metric-description">{metric.description}</div>
              </div>
              
              <div className="col thresholds">
                <div>UCL: {metric.ucl} {metric.unit}</div>
                <div>LCL: {metric.lcl} {metric.unit}</div>
                {metric.criticalThreshold !== null && (
                  <div>Critical: {metric.criticalThreshold} {metric.unit}</div>
                )}
              </div>
              
              <div className="col source">
                <div className="source-type">{metric.dataSource.type}</div>
                <div className="source-query">{metric.dataSource.query}</div>
                <div className="refresh-interval">
                  Refresh: {metric.dataSource.refreshInterval / 1000}s
                </div>
              </div>
              
              <div className="col actions">
                <button 
                  className="edit-btn" 
                  onClick={() => handleEditClick(metric)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => handleDeleteMetric(metric.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;