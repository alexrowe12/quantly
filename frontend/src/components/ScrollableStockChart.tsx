'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface StockData {
  timestamp: string;
  price: number;
}

const generateStockData = (): StockData[] => {
  const data: StockData[] = [];
  const startDate = new Date('2023-01-01');
  const basePrice = 100;
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    // Create a consistent wave pattern using multiple sine waves
    const dayOfYear = i;
    
    // Primary trend (slow wave over ~90 days)
    const primaryWave = Math.sin(dayOfYear * 2 * Math.PI / 90) * 20;
    
    // Secondary oscillation (medium wave over ~30 days)
    const secondaryWave = Math.sin(dayOfYear * 2 * Math.PI / 30) * 8;
    
    // Micro fluctuations (fast wave over ~7 days)
    const microWave = Math.sin(dayOfYear * 2 * Math.PI / 7) * 3;
    
    // Small random component for realism (but deterministic based on day)
    const pseudoRandom = Math.sin(dayOfYear * 1.618) * 2; // Using golden ratio for pseudo-randomness
    
    // Gradual upward trend over the year
    const yearlyTrend = (dayOfYear / 365) * 15;
    
    const price = basePrice + primaryWave + secondaryWave + microWave + pseudoRandom + yearlyTrend;
    
    data.push({
      timestamp: date.toISOString().split('T')[0],
      price: parseFloat(Math.max(10, price).toFixed(2))
    });
  }
  
  return data;
};

interface ScrollableStockChartProps {
  data?: StockData[];
  className?: string;
}

const ScrollableStockChart: React.FC<ScrollableStockChartProps> = ({ 
  data = generateStockData(), 
  className = "" 
}) => {
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(30);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate fixed Y-axis domain based on all data with 20% padding
  const allPrices = data.map(d => d.price);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;
  const yMin = minPrice - (priceRange * 0.2);
  const yMax = maxPrice + (priceRange * 0.2);
  
  const visibleData = data.slice(startIndex, endIndex + 1);
  
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const scrollAmount = Math.sign(e.deltaY) * 1;
      const newStartIndex = Math.max(0, Math.min(data.length - 30, startIndex + scrollAmount));
      const newEndIndex = Math.min(data.length - 1, newStartIndex + 30);
      
      setStartIndex(newStartIndex);
      setEndIndex(newEndIndex);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [startIndex, data.length]);

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatTooltipLabel = (label: string) => {
    const date = new Date(label);
    return date.toLocaleDateString();
  };

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={visibleData}
          margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
          <XAxis 
            dataKey="timestamp"
            tickFormatter={formatXAxisLabel}
            angle={-45}
            textAnchor="end"
            height={40}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis 
            domain={[yMin, yMax]}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <Tooltip 
            labelFormatter={formatTooltipLabel}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              color: '#f9fafb'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScrollableStockChart;