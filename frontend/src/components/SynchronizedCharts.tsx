'use client';

import React, { useState } from 'react';
import ScrollableStockChart from './ScrollableStockChart';
import TechnicalIndicatorChart from './TechnicalIndicatorChart';

interface StockData {
  timestamp: string;
  price: number;
}

interface RSIData {
  timestamp: string;
  rsi: number;
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

const generateRSIData = (): RSIData[] => {
  const data: RSIData[] = [];
  const startDate = new Date('2023-01-01');
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    // Create oscillating RSI values between 1-100
    const dayOfYear = i;
    
    // Base oscillation using sine waves for realistic RSI movement
    const primaryWave = Math.sin(dayOfYear * 2 * Math.PI / 60) * 25; // ~60 day cycle
    const secondaryWave = Math.sin(dayOfYear * 2 * Math.PI / 14) * 15; // ~14 day cycle  
    const microWave = Math.sin(dayOfYear * 2 * Math.PI / 7) * 8; // ~7 day cycle
    
    // Add some pseudo-random variation
    const pseudoRandom = Math.sin(dayOfYear * 3.14159) * 10;
    
    // Center around 50 (neutral RSI)
    const baseRSI = 50 + primaryWave + secondaryWave + microWave + pseudoRandom;
    
    // Clamp between 1 and 100
    const rsi = Math.max(1, Math.min(100, baseRSI));
    
    data.push({
      timestamp: date.toISOString().split('T')[0],
      rsi: parseFloat(rsi.toFixed(2))
    });
  }
  
  return data;
};

const SynchronizedCharts: React.FC = () => {
  const [stockData] = useState(generateStockData());
  const [rsiData] = useState(generateRSIData());
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(30);

  const handleScrollChange = (newStartIndex: number, newEndIndex: number) => {
    setStartIndex(newStartIndex);
    setEndIndex(newEndIndex);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Main Chart - 70% of chart area */}
      <div className="h-[70%]">
        <ScrollableStockChart 
          data={stockData}
          startIndex={startIndex}
          endIndex={endIndex}
          onScrollChange={handleScrollChange}
        />
      </div>
      
      {/* Subtle separator */}
      <div className="h-px" style={{ backgroundColor: '#333333' }} />
      
      {/* Technical Indicator Chart - 30% of chart area */}
      <div className="h-[30%]">
        <TechnicalIndicatorChart 
          data={rsiData}
          startIndex={startIndex}
          endIndex={endIndex}
          onScrollChange={handleScrollChange}
        />
      </div>
    </div>
  );
};

export default SynchronizedCharts;