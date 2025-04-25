// src/components/MetricChart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import './MetricChart.css';

const MetricChart = ({ data, ucl, lcl, criticalThreshold, unit, mini = false }) => {
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return mini 
      ? `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
      : `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // Format value for tooltip
  const formatValue = (value) => {
    return `${value.toFixed(2)} ${unit}`;
  };
  
  return (
    <ResponsiveContainer width="100%" height={mini ? 60 : 200}>
      <LineChart
        data={data}
        margin={mini ? { top: 5, right: 5, bottom: 5, left: 5 } : { top: 10, right: 30, bottom: 10, left: 10 }}
      >
        {!mini && <CartesianGrid strokeDasharray="3 3" />}
        
        {!mini && (
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatTimestamp}
            interval={Math.floor(data.length / 6)}
          />
        )}
        
        {!mini && (
          <YAxis domain={['auto', 'auto']} />
        )}
        
        {!mini && (
          <Tooltip 
            labelFormatter={(label) => formatTimestamp(label)}
            formatter={(value) => [formatValue(value), 'Value']}
          />
        )}
        
        <ReferenceLine y={ucl} stroke="orange" strokeDasharray="3 3" />
        <ReferenceLine y={lcl} stroke="orange" strokeDasharray="3 3" />
        
        {criticalThreshold !== null && (
          <ReferenceLine y={criticalThreshold} stroke="red" strokeDasharray="3 3" />
        )}
        
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#2196F3" 
          strokeWidth={mini ? 1.5 : 2}
          dot={!mini}
          activeDot={!mini && { r: 6 }}
          isAnimationActive={!mini}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MetricChart;