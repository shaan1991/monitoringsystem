// src/components/MetricConfigForm.js
import React, { useState, useEffect } from 'react';
import './MetricConfigForm.css';

const MetricConfigForm = ({ metric, onSave, onCancel, onDelete }) => {
  const isEditing = !!metric;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ucl: 100,
    lcl: 0,
    unit: '',
    criticalThreshold: null,
    dataSource: {
      type: 'kibana',
      query: '',
      refreshInterval: 60000,
      params: {
        city: '',
        metricType: 'temperature'
      }
    }
  });
  
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    if (metric) {
      setFormData({
        name: metric.name || '',
        description: metric.description || '',
        ucl: metric.ucl || 100,
        lcl: metric.lcl || 0,
        unit: metric.unit || '',
        criticalThreshold: metric.criticalThreshold,
        dataSource: {
          type: metric.dataSource?.type || 'kibana',
          query: metric.dataSource?.query || '',
          refreshInterval: metric.dataSource?.refreshInterval || 60000,
          params: metric.dataSource?.params || {
            city: '',
            metricType: 'temperature'
          }
        }
      });
    }
  }, [metric]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (isNaN(formData.ucl) || formData.ucl === '') {
      newErrors.ucl = 'UCL must be a number';
    }
    
    if (isNaN(formData.lcl) || formData.lcl === '') {
      newErrors.lcl = 'LCL must be a number';
    }
    
    if (Number(formData.lcl) >= Number(formData.ucl)) {
      newErrors.lcl = 'LCL must be less than UCL';
      newErrors.ucl = 'UCL must be greater than LCL';
    }
    
    if (formData.criticalThreshold !== null && 
        (isNaN(formData.criticalThreshold) || formData.criticalThreshold === '')) {
      newErrors.criticalThreshold = 'Critical threshold must be a number';
    }
    
    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }
    
    if (formData.dataSource.type === 'kibana' || formData.dataSource.type === 'database' || formData.dataSource.type === 'api') {
      if (!formData.dataSource.query.trim()) {
        newErrors.query = 'Query is required';
      }
    }
    
    if (formData.dataSource.type === 'weather_api') {
      if (!formData.dataSource.params?.city) {
        newErrors['dataSource.params.city'] = 'City is required';
      }
      if (!formData.dataSource.params?.metricType) {
        newErrors['dataSource.params.metricType'] = 'Weather metric type is required';
      }
    }
    
    if (isNaN(formData.dataSource.refreshInterval) || 
        Number(formData.dataSource.refreshInterval) < 5000) {
      newErrors.refreshInterval = 'Refresh interval must be at least 5 seconds';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleNestedChange = (e) => {
    const { name, value } = e.target;
    const parts = name.split('.');
    
    if (parts.length === 3) {
      const [parent, child, subChild] = parts;
      
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: {
            ...prev[parent]?.[child] || {},
            [subChild]: value
          }
        }
      }));
    }
  };
  
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value === '' ? '' : Number(value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    }
  };
  
  const handleCriticalThresholdChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      criticalThreshold: value === '' ? null : Number(value)
    }));
  };
  
  const handleDataSourceTypeChange = (e) => {
    const { value } = e.target;
    
    setFormData(prev => {
      let unit = prev.unit;
      
      // Set default units based on weather metric type
      if (value === 'weather_api') {
        const metricType = prev.dataSource.params?.metricType || 'temperature';
        switch(metricType) {
          case 'temperature':
            unit = '°C';
            break;
          case 'humidity':
            unit = '%';
            break;
          case 'wind_speed':
            unit = 'm/s';
            break;
          case 'pressure':
            unit = 'hPa';
            break;
          default:
            break;
        }
      }
      
      return {
        ...prev,
        unit,
        dataSource: {
          ...prev.dataSource,
          type: value,
          query: value !== 'weather_api' ? prev.dataSource.query : ''
        }
      };
    });
  };
  
  const handleWeatherMetricTypeChange = (e) => {
    const { value } = e.target;
    
    setFormData(prev => {
      let unit = prev.unit;
      let ucl = prev.ucl;
      let lcl = prev.lcl;
      
      // Set recommended thresholds and units based on weather metric type
      switch(value) {
        case 'temperature':
          unit = '°C';
          ucl = 30;
          lcl = 0;
          break;
        case 'humidity':
          unit = '%';
          ucl = 80;
          lcl = 20;
          break;
        case 'wind_speed':
          unit = 'm/s';
          ucl = 15;
          lcl = 0;
          break;
        case 'pressure':
          unit = 'hPa';
          ucl = 1030;
          lcl = 990;
          break;
        default:
          break;
      }
      
      return {
        ...prev,
        unit,
        ucl,
        lcl,
        dataSource: {
          ...prev.dataSource,
          params: {
            ...prev.dataSource.params,
            metricType: value
          }
        }
      };
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Prepare the final data
      const finalData = {
        ...formData,
        ucl: Number(formData.ucl),
        lcl: Number(formData.lcl),
        criticalThreshold: formData.criticalThreshold === '' ? null : 
                          formData.criticalThreshold === null ? null : 
                          Number(formData.criticalThreshold),
        dataSource: {
          ...formData.dataSource,
          refreshInterval: Number(formData.dataSource.refreshInterval)
        }
      };
      
      onSave(finalData);
    }
  };
  
  return (
    <div className="metric-config-form">
      <h2>{isEditing ? 'Edit Metric' : 'Add New Metric'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">Metric Name <span className="required">*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description <span className="required">*</span></label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <div className="error-message">{errors.description}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="unit">Unit <span className="required">*</span></label>
            <input
              type="text"
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              placeholder="e.g., ms, %, Mbps"
              className={errors.unit ? 'error' : ''}
            />
            {errors.unit && <div className="error-message">{errors.unit}</div>}
          </div>
        </div>
        
        <div className="form-section">
          <h3>Thresholds</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ucl">Upper Control Limit (UCL) <span className="required">*</span></label>
              <input
                type="number"
                id="ucl"
                name="ucl"
                value={formData.ucl}
                onChange={handleNumberChange}
                step="any"
                className={errors.ucl ? 'error' : ''}
              />
              {errors.ucl && <div className="error-message">{errors.ucl}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="lcl">Lower Control Limit (LCL) <span className="required">*</span></label>
              <input
                type="number"
                id="lcl"
                name="lcl"
                value={formData.lcl}
                onChange={handleNumberChange}
                step="any"
                className={errors.lcl ? 'error' : ''}
              />
              {errors.lcl && <div className="error-message">{errors.lcl}</div>}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="criticalThreshold">Critical Threshold <span className="optional">(optional)</span></label>
            <input
              type="number"
              id="criticalThreshold"
              name="criticalThreshold"
              value={formData.criticalThreshold === null ? '' : formData.criticalThreshold}
              onChange={handleCriticalThresholdChange}
              step="any"
              placeholder="Leave empty for no critical threshold"
              className={errors.criticalThreshold ? 'error' : ''}
            />
            {errors.criticalThreshold && <div className="error-message">{errors.criticalThreshold}</div>}
          </div>
        </div>
        
        <div className="form-section">
          <h3>Data Source</h3>
          
          <div className="form-group">
            <label htmlFor="dataSource.type">Source Type <span className="required">*</span></label>
            <select
              id="dataSource.type"
              name="dataSource.type"
              value={formData.dataSource.type}
              onChange={handleDataSourceTypeChange}
            >
              <option value="kibana">Kibana</option>
              <option value="database">Database</option>
              <option value="api">API</option>
              <option value="weather_api">Weather API</option>
            </select>
          </div>
          
          {(formData.dataSource.type === 'kibana' || 
            formData.dataSource.type === 'database' || 
            formData.dataSource.type === 'api') && (
            <div className="form-group">
              <label htmlFor="dataSource.query">Query <span className="required">*</span></label>
              <textarea
                id="dataSource.query"
                name="dataSource.query"
                value={formData.dataSource.query}
                onChange={handleChange}
                placeholder={formData.dataSource.type === 'kibana' 
                  ? 'index=metrics | avg(value)' 
                  : formData.dataSource.type === 'database'
                  ? 'SELECT AVG(value) FROM metrics WHERE timestamp > now() - 1h'
                  : 'GET /api/metrics?param=value'}
                className={errors.query ? 'error' : ''}
              />
              {errors.query && <div className="error-message">{errors.query}</div>}
            </div>
          )}
          
          {formData.dataSource.type === 'weather_api' && (
            <div className="weather-params">
              <div className="form-group">
                <label htmlFor="dataSource.params.city">City <span className="required">*</span></label>
                <input
                  type="text"
                  id="dataSource.params.city"
                  name="dataSource.params.city"
                  value={formData.dataSource.params?.city || ''}
                  onChange={handleNestedChange}
                  placeholder="e.g., London, New York, Tokyo"
                  className={errors['dataSource.params.city'] ? 'error' : ''}
                />
                {errors['dataSource.params.city'] && (
                  <div className="error-message">{errors['dataSource.params.city']}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="dataSource.params.metricType">Weather Metric <span className="required">*</span></label>
                <select
                  id="dataSource.params.metricType"
                  name="dataSource.params.metricType"
                  value={formData.dataSource.params?.metricType || 'temperature'}
                  onChange={handleWeatherMetricTypeChange}
                >
                  <option value="temperature">Temperature</option>
                  <option value="humidity">Humidity</option>
                  <option value="wind_speed">Wind Speed</option>
                  <option value="pressure">Air Pressure</option>
                </select>
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="dataSource.refreshInterval">Refresh Interval (ms) <span className="required">*</span></label>
            <input
              type="number"
              id="dataSource.refreshInterval"
              name="dataSource.refreshInterval"
              value={formData.dataSource.refreshInterval}
              onChange={handleNumberChange}
              min="5000"
              step="1000"
              className={errors.refreshInterval ? 'error' : ''}
            />
            {errors.refreshInterval && <div className="error-message">{errors.refreshInterval}</div>}
            <div className="help-text">Minimum 5000ms (5 seconds)</div>
          </div>
        </div>
        
        <div className="form-actions">
          {isEditing && onDelete && (
            <button 
              type="button" 
              className="delete-btn" 
              onClick={onDelete}
            >
              Delete
            </button>
          )}
          <button 
            type="button" 
            className="cancel-btn" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="save-btn"
          >
            {isEditing ? 'Update Metric' : 'Add Metric'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MetricConfigForm;