'use client';

import React, { useState, useEffect } from 'react';
import ScrollableStockChart from './ScrollableStockChart';
import TechnicalIndicatorChart from './TechnicalIndicatorChart';
import TimeRangeSelector from './TimeRangeSelector';
import { fetchChartData, StockData, RSIData } from '../services/api';

interface ErrorState {
  message: string;
  retry: () => void;
}



const SynchronizedCharts: React.FC = () => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [rsiData, setRsiData] = useState<RSIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(30);
  const [selectedRange, setSelectedRange] = useState(30);

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { stockData: apiStockData, rsiData: apiRsiData } = await fetchChartData('SPY');
      setStockData(apiStockData);
      setRsiData(apiRsiData);
      
      // Set initial view to show the last 30 days
      const totalDays = apiStockData.length;
      const viewDays = selectedRange;
      setStartIndex(Math.max(0, totalDays - viewDays));
      setEndIndex(Math.min(totalDays - 1, (totalDays - viewDays) + viewDays - 1));
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to load chart data',
        retry: loadChartData
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChartData();
  }, []);

  const handleScrollChange = (newStartIndex: number, newEndIndex: number) => {
    setStartIndex(newStartIndex);
    setEndIndex(newEndIndex);
  };

  const handleRangeChange = (days: number) => {
    setSelectedRange(days);
    
    // Adjust view to show the most recent data with the new range
    const totalDays = stockData.length;
    if (totalDays > 0) {
      const newStartIndex = Math.max(0, totalDays - days);
      const newEndIndex = Math.min(totalDays - 1, newStartIndex + days - 1);
      setStartIndex(newStartIndex);
      setEndIndex(newEndIndex);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#1F1F1F' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p style={{ color: '#F9FAFB' }}>Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#1F1F1F' }}>
        <div className="text-center">
          <p style={{ color: '#ef4444' }} className="mb-4">Error: {error.message}</p>
          <button 
            onClick={error.retry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Main Chart - 70% of chart area */}
      <div className="h-[70%] relative">
        <ScrollableStockChart 
          data={stockData}
          startIndex={startIndex}
          endIndex={endIndex}
          onScrollChange={handleScrollChange}
          selectedRange={selectedRange}
        />
        
        {/* Time Range Selector positioned below SPY ticker */}
        <TimeRangeSelector 
          selectedRange={selectedRange}
          onRangeChange={handleRangeChange}
          className="absolute"
          style={{ top: '72px', left: '24px' }}
        />
      </div>
      
      {/* Technical Indicator Chart - 30% of chart area */}
      <div className="h-[30%]">
        <TechnicalIndicatorChart 
          data={rsiData}
          startIndex={startIndex}
          endIndex={endIndex}
          onScrollChange={handleScrollChange}
          selectedRange={selectedRange}
        />
      </div>
    </div>
  );
};

export default SynchronizedCharts;