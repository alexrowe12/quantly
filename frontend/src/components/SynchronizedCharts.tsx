'use client';

import React, { useState, useEffect } from 'react';
import ScrollableStockChart from './ScrollableStockChart';
import TechnicalIndicatorChart from './TechnicalIndicatorChart';
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

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { stockData: apiStockData, rsiData: apiRsiData } = await fetchChartData('SPY');
      setStockData(apiStockData);
      setRsiData(apiRsiData);
      
      // Set initial view to show the last 365 days (1 year)
      const totalDays = apiStockData.length;
      const viewDays = Math.min(365, totalDays);
      setStartIndex(Math.max(0, totalDays - viewDays));
      setEndIndex(totalDays - 1);
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
      <div className="h-[70%]">
        <ScrollableStockChart 
          data={stockData}
          startIndex={startIndex}
          endIndex={endIndex}
          onScrollChange={handleScrollChange}
        />
      </div>
      
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