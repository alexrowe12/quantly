'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Placeholder OHLCV data with 50 points and large price range (volatile stock movement)
const placeholderData: CandleData[] = [
  { timestamp: '2023-01-02', open: 45.32, high: 48.75, low: 44.80, close: 47.25, volume: 12000000 },
  { timestamp: '2023-01-03', open: 47.25, high: 52.10, low: 46.90, close: 51.30, volume: 15000000 },
  { timestamp: '2023-01-04', open: 51.30, high: 55.80, low: 50.25, close: 54.90, volume: 18000000 },
  { timestamp: '2023-01-05', open: 54.90, high: 58.40, low: 53.75, close: 56.20, volume: 14000000 },
  { timestamp: '2023-01-06', open: 56.20, high: 62.50, low: 55.10, close: 61.85, volume: 22000000 },
  { timestamp: '2023-01-09', open: 61.85, high: 68.20, low: 60.45, close: 66.75, volume: 28000000 },
  { timestamp: '2023-01-10', open: 66.75, high: 71.90, low: 65.30, close: 69.40, volume: 25000000 },
  { timestamp: '2023-01-11', open: 69.40, high: 75.80, low: 68.15, close: 74.25, volume: 30000000 },
  { timestamp: '2023-01-12', open: 74.25, high: 82.60, low: 72.80, close: 80.15, volume: 35000000 },
  { timestamp: '2023-01-13', open: 80.15, high: 88.50, low: 78.90, close: 85.70, volume: 40000000 },
  { timestamp: '2023-01-16', open: 85.70, high: 92.30, low: 84.20, close: 90.85, volume: 38000000 },
  { timestamp: '2023-01-17', open: 90.85, high: 98.75, low: 89.40, close: 96.20, volume: 42000000 },
  { timestamp: '2023-01-18', open: 96.20, high: 105.50, low: 94.80, close: 102.35, volume: 45000000 },
  { timestamp: '2023-01-19', open: 102.35, high: 112.90, low: 100.75, close: 108.60, volume: 48000000 },
  { timestamp: '2023-01-20', open: 108.60, high: 118.40, low: 106.25, close: 115.80, volume: 52000000 },
  { timestamp: '2023-01-23', open: 115.80, high: 125.70, low: 113.90, close: 122.45, volume: 55000000 },
  { timestamp: '2023-01-24', open: 122.45, high: 132.80, low: 120.60, close: 129.15, volume: 58000000 },
  { timestamp: '2023-01-25', open: 129.15, high: 142.30, low: 126.80, close: 138.90, volume: 62000000 },
  { timestamp: '2023-01-26', open: 138.90, high: 148.75, low: 136.20, close: 145.60, volume: 65000000 },
  { timestamp: '2023-01-27', open: 145.60, high: 158.40, low: 143.30, close: 154.25, volume: 68000000 },
  { timestamp: '2023-01-30', open: 154.25, high: 168.90, low: 151.80, close: 165.70, volume: 72000000 },
  { timestamp: '2023-01-31', open: 165.70, high: 178.50, low: 163.40, close: 175.85, volume: 75000000 },
  { timestamp: '2023-02-01', open: 175.85, high: 189.20, low: 172.60, close: 186.40, volume: 78000000 },
  { timestamp: '2023-02-02', open: 186.40, high: 198.75, low: 184.15, close: 195.30, volume: 82000000 },
  { timestamp: '2023-02-03', open: 195.30, high: 210.80, low: 192.90, close: 207.65, volume: 85000000 },
  { timestamp: '2023-02-06', open: 207.65, high: 225.40, low: 204.30, close: 220.90, volume: 88000000 },
  { timestamp: '2023-02-07', open: 220.90, high: 238.75, low: 217.50, close: 235.25, volume: 92000000 },
  { timestamp: '2023-02-08', open: 235.25, high: 252.80, low: 232.10, close: 248.60, volume: 95000000 },
  { timestamp: '2023-02-09', open: 248.60, high: 265.30, low: 245.40, close: 261.15, volume: 98000000 },
  { timestamp: '2023-02-10', open: 261.15, high: 278.90, low: 258.70, close: 274.45, volume: 102000000 },
  { timestamp: '2023-02-13', open: 274.45, high: 289.60, low: 271.20, close: 285.80, volume: 105000000 },
  { timestamp: '2023-02-14', open: 285.80, high: 302.40, low: 282.50, close: 298.75, volume: 108000000 },
  { timestamp: '2023-02-15', open: 298.75, high: 318.90, low: 295.30, close: 314.20, volume: 112000000 },
  { timestamp: '2023-02-16', open: 314.20, high: 332.60, low: 310.85, close: 328.45, volume: 115000000 },
  { timestamp: '2023-02-17', open: 328.45, high: 348.75, low: 324.90, close: 342.30, volume: 118000000 },
  { timestamp: '2023-02-21', open: 342.30, high: 365.80, low: 338.70, close: 359.95, volume: 122000000 },
  { timestamp: '2023-02-22', open: 359.95, high: 382.40, low: 356.20, close: 376.85, volume: 125000000 },
  { timestamp: '2023-02-23', open: 376.85, high: 398.30, low: 373.50, close: 393.70, volume: 128000000 },
  { timestamp: '2023-02-24', open: 393.70, high: 415.90, low: 390.25, close: 409.55, volume: 132000000 },
  { timestamp: '2023-02-27', open: 409.55, high: 432.80, low: 406.10, close: 425.40, volume: 135000000 },
  { timestamp: '2023-02-28', open: 425.40, high: 448.75, low: 421.90, close: 442.25, volume: 138000000 },
  { timestamp: '2023-03-01', open: 442.25, high: 465.30, low: 438.80, close: 459.10, volume: 142000000 },
  { timestamp: '2023-03-02', open: 459.10, high: 483.90, low: 455.60, close: 477.95, volume: 145000000 },
  { timestamp: '2023-03-03', open: 477.95, high: 501.40, low: 474.30, close: 495.80, volume: 148000000 },
  { timestamp: '2023-03-06', open: 495.80, high: 520.65, low: 492.15, close: 514.25, volume: 152000000 },
  { timestamp: '2023-03-07', open: 514.25, high: 538.90, low: 510.70, close: 532.40, volume: 155000000 },
  { timestamp: '2023-03-08', open: 532.40, high: 558.75, low: 528.95, close: 550.85, volume: 158000000 },
  { timestamp: '2023-03-09', open: 550.85, high: 577.30, low: 547.20, close: 569.70, volume: 162000000 },
  { timestamp: '2023-03-10', open: 569.70, high: 596.90, low: 566.40, close: 588.55, volume: 165000000 },
  { timestamp: '2023-03-13', open: 588.55, high: 615.80, low: 584.90, close: 607.40, volume: 168000000 }
];

interface CandlestickChartProps {
  data?: CandleData[];
  className?: string;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ 
  data = placeholderData, 
  className = "" 
}) => {
  // Calculate initial data range
  const dataMin = Math.min(...data.map(d => Math.min(d.low, d.open, d.close, d.high)));
  const dataMax = Math.max(...data.map(d => Math.max(d.low, d.open, d.close, d.high)));
  const dataRange = dataMax - dataMin;
  
  const [yDomain, setYDomain] = useState<[number, number]>([dataMin - 5, dataMax + 5]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use useMemo to ensure data transformation is synchronized with domain changes
  const transformedData = useMemo(() => {
    return data
      .filter(candle => {
        // Only show candles that have some part visible in the current domain
        const candleMin = Math.min(candle.low, candle.open, candle.close, candle.high);
        const candleMax = Math.max(candle.low, candle.open, candle.close, candle.high);
        return candleMax >= yDomain[0] && candleMin <= yDomain[1];
      })
      .map(candle => ({
        timestamp: candle.timestamp,
        high: candle.high,
        low: candle.low,
        openClose: [candle.open, candle.close],
        fill: candle.close > candle.open ? '#10b981' : '#ef4444', // Green for up, red for down
        volume: candle.volume,
        ...candle
      }));
  }, [data, yDomain]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomFactor = 0.1; // Gentle zoom
      const isZoomIn = e.deltaY < 0;
      
      setYDomain(([currentMin, currentMax]) => {
        const currentRange = currentMax - currentMin;
        const center = (currentMin + currentMax) / 2;
        
        let newRange: number;
        if (isZoomIn) {
          // Zoom in - reduce range
          newRange = currentRange * (1 - zoomFactor);
        } else {
          // Zoom out - increase range
          newRange = currentRange * (1 + zoomFactor);
        }
        
        // Set limits to show max 50% above/below price extremes
        const minAllowedRange = 0.1; // Allow zooming to $0.10 range
        const maxAllowedRange = dataRange * 1.5; // Allow zooming out to 50% above/below extremes
        
        // Clamp the range
        newRange = Math.max(minAllowedRange, Math.min(maxAllowedRange, newRange));
        
        const halfRange = newRange / 2;
        const newMin = center - halfRange;
        const newMax = center + halfRange;
        
        return [newMin, newMax];
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [dataRange]);

  const CustomizedCandle = (props: any) => {
    const { payload } = props;
    if (!payload) return null;

    const { x, width } = props;
    const yScale = props.yScale || ((value: number) => value);
    
    const high = yScale(payload.high);
    const low = yScale(payload.low);
    const open = yScale(payload.open);
    const close = yScale(payload.close);
    
    const isUp = payload.close > payload.open;
    const color = isUp ? '#10b981' : '#ef4444';
    const bodyHeight = Math.abs(close - open);
    const bodyY = isUp ? close : open;

    return (
      <g>
        {/* High-low line */}
        <line
          x1={x + width / 2}
          y1={high}
          x2={x + width / 2}
          y2={low}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body rectangle */}
        <rect
          x={x + width * 0.25}
          y={bodyY}
          width={width * 0.5}
          height={bodyHeight}
          fill={isUp ? color : 'transparent'}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          key={`${yDomain[0]}-${yDomain[1]}`}
          data={transformedData}
          margin={{ top: 20, right: 60, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="timestamp" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            interval="preserveStartEnd"
            ticks={transformedData
              .filter((_, index) => index % 2 === 0) // Every 2nd data point
              .map(d => d.timestamp)}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis 
            orientation="right"
            domain={yDomain}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <Bar 
            dataKey="openClose" 
            fill="#8884d8"
            shape={<CustomizedCandle />}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CandlestickChart;