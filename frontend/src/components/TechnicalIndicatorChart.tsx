'use client';

import React, { useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface RSIData {
  timestamp: string;
  rsi: number;
}

interface TechnicalIndicatorChartProps {
  data: RSIData[];
  startIndex: number;
  endIndex: number;
  onScrollChange: (newStartIndex: number, newEndIndex: number) => void;
  className?: string;
}

const TechnicalIndicatorChart: React.FC<TechnicalIndicatorChartProps> = ({ 
  data,
  startIndex,
  endIndex,
  onScrollChange,
  className = "" 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTimeRef = useRef<number>(0);
  
  const visibleData = data.slice(startIndex, endIndex + 1);
  
  useEffect(() => {
    const handleTimeScroll = (e: WheelEvent) => {
      e.preventDefault();
      
      // Update last scroll time
      lastScrollTimeRef.current = Date.now();
      
      const scrollAmount = Math.sign(e.deltaY) * 1;
      const newStartIndex = Math.max(0, Math.min(data.length - 30, startIndex + scrollAmount));
      const newEndIndex = Math.min(data.length - 1, newStartIndex + 30);
      
      // Only update if there's actually a change
      if (newStartIndex !== startIndex || newEndIndex !== endIndex) {
        onScrollChange(newStartIndex, newEndIndex);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleTimeScroll, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleTimeScroll);
      }
    };
  }, [startIndex, endIndex, data.length, onScrollChange]);

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatTooltipLabel = (label: string) => {
    const date = new Date(label);
    return date.toLocaleDateString();
  };

  // Lock Y-axis between 0-100 for RSI
  const yMin = 0;
  const yMax = 100;

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full ${className}`} 
      style={{ backgroundColor: '#1F1F1F', outline: 'none', position: 'relative' }}
    >
      {/* Technical Indicator Label */}
      <div 
        className="absolute top-2 left-6 z-10 transition-opacity duration-300 ease-in-out hover:opacity-30"
        style={{
          backgroundColor: '#2A2A2A',
          padding: '4px 8px',
          borderRadius: '4px',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
        }}
      >
        <span 
          className="text-sm font-medium"
          style={{ color: '#F9FAFB' }}
        >
          RSI
        </span>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={visibleData}
          margin={{ top: 0, right: 0, left: 20, bottom: 5 }}
        >
          <XAxis 
            dataKey="timestamp"
            hide={true}
          />
          <YAxis 
            orientation="right"
            domain={[yMin, yMax]}
            tickFormatter={(value) => `${value.toFixed(0)}`}
            tick={{ fontSize: 10, fill: '#6b7280' }}
          />
          <Tooltip 
            labelFormatter={formatTooltipLabel}
            formatter={(value: number) => [`${value.toFixed(2)}`, 'RSI']}
            contentStyle={{
              backgroundColor: '#2A2A2A',
              border: '1px solid #2A2A2A',
              borderRadius: '6px',
              color: '#F9FAFB',
              fontSize: '12px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="rsi" 
            stroke="#8b5cf6" 
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: '#8b5cf6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TechnicalIndicatorChart;