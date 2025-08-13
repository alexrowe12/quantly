'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import Statistics from './Statistics';

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
  startIndex?: number;
  endIndex?: number;
  onScrollChange?: (newStartIndex: number, newEndIndex: number) => void;
  className?: string;
}

const ScrollableStockChart: React.FC<ScrollableStockChartProps> = ({ 
  data = generateStockData(),
  startIndex: externalStartIndex,
  endIndex: externalEndIndex,
  onScrollChange,
  className = "" 
}) => {
  // Use external state if provided, otherwise use internal state
  const [internalStartIndex, setInternalStartIndex] = useState(0);
  const [internalEndIndex, setInternalEndIndex] = useState(30);
  
  const startIndex = externalStartIndex !== undefined ? externalStartIndex : internalStartIndex;
  const endIndex = externalEndIndex !== undefined ? externalEndIndex : internalEndIndex;
  const [isScrollingYAxis, setIsScrollingYAxis] = useState(false);
  const [isScrollingXAxis, setIsScrollingXAxis] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const yAxisRef = useRef<HTMLDivElement>(null);
  const yAxisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const xAxisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  
  // Calculate base Y-axis domain based on all data with 20% padding
  const allPrices = data.map(d => d.price);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;
  const baseYMin = minPrice - (priceRange * 0.2);
  const baseYMax = maxPrice + (priceRange * 0.2);
  
  // State for current Y-axis zoom
  const [yDomain, setYDomain] = useState<[number, number]>([baseYMin, baseYMax]);
  
  const visibleData = data.slice(startIndex, endIndex + 1);
  
  // Create stable timeout functions using useCallback
  const resetXAxisColor = useCallback(() => {
    const now = Date.now();
    // Only reset if enough time has passed since last scroll
    if (now - lastScrollTimeRef.current >= 250) {
      setIsScrollingXAxis(false);
    }
  }, []);

  const resetYAxisColor = useCallback(() => {
    setIsScrollingYAxis(false);
  }, []);
  
  useEffect(() => {
    const handleTimeScroll = (e: WheelEvent) => {
      e.preventDefault();
      
      // Update last scroll time
      lastScrollTimeRef.current = Date.now();
      
      // Set X-axis as actively scrolling
      setIsScrollingXAxis(true);
      
      // Clear existing timeout and set new one
      if (xAxisTimeoutRef.current) {
        clearTimeout(xAxisTimeoutRef.current);
      }
      xAxisTimeoutRef.current = setTimeout(resetXAxisColor, 400);
      
      const scrollAmount = Math.sign(e.deltaY) * 1;
      const newStartIndex = Math.max(0, Math.min(data.length - 30, startIndex + scrollAmount));
      const newEndIndex = Math.min(data.length - 1, newStartIndex + 30);
      
      // Use external callback if provided, otherwise use internal state
      if (onScrollChange) {
        onScrollChange(newStartIndex, newEndIndex);
      } else {
        setInternalStartIndex(newStartIndex);
        setInternalEndIndex(newEndIndex);
      }
    };

    const handleYAxisZoom = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomFactor = 0.05; // Small adjustment per scroll tick
      const isZoomOut = e.deltaY > 0;
      
      setYDomain(([currentMin, currentMax]) => {
        const currentRange = currentMax - currentMin;
        const center = (currentMin + currentMax) / 2;
        
        let newRange: number;
        if (isZoomOut) {
          // Zoom out - increase range
          newRange = currentRange * (1 + zoomFactor);
        } else {
          // Zoom in - decrease range
          newRange = currentRange * (1 - zoomFactor);
        }
        
        // Set limits
        const minAllowedRange = priceRange; // Can't zoom tighter than actual data range
        const maxAllowedRange = priceRange * 3.4; // Can't zoom out more than triple + original padding
        
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
      container.addEventListener('wheel', handleTimeScroll, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleTimeScroll);
      }
      // Cleanup timeouts
      if (xAxisTimeoutRef.current) {
        clearTimeout(xAxisTimeoutRef.current);
      }
    };
  }, [startIndex, data.length, priceRange]);

  // Effect to reset X-axis color when data actually updates
  useEffect(() => {
    // Small delay to allow chart to render new data
    const timeoutId = setTimeout(() => {
      setIsScrollingXAxis(false);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [startIndex, endIndex]);

  // Separate effect for Y-axis zoom detection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      // Find the actual Y-axis elements in the DOM
      const yAxisElements = container.querySelectorAll('.recharts-yAxis, .recharts-cartesian-axis-tick');
      let isOverYAxis = false;

      // Check if mouse is over any Y-axis element
      for (const element of yAxisElements) {
        const elementRect = element.getBoundingClientRect();
        if (
          e.clientX >= elementRect.left &&
          e.clientX <= elementRect.right &&
          e.clientY >= elementRect.top &&
          e.clientY <= elementRect.bottom
        ) {
          isOverYAxis = true;
          break;
        }
      }

      if (isOverYAxis) {
        container.style.cursor = 'ns-resize';
      } else {
        container.style.cursor = 'default';
      }
    };

    const handleYAxisWheel = (e: WheelEvent) => {
      const container = containerRef.current;
      if (!container) return;

      // Find the actual Y-axis elements in the DOM
      const yAxisElements = container.querySelectorAll('.recharts-yAxis, .recharts-cartesian-axis-tick');
      let isOverYAxis = false;

      // Check if mouse is over any Y-axis element
      for (const element of yAxisElements) {
        const elementRect = element.getBoundingClientRect();
        if (
          e.clientX >= elementRect.left &&
          e.clientX <= elementRect.right &&
          e.clientY >= elementRect.top &&
          e.clientY <= elementRect.bottom
        ) {
          isOverYAxis = true;
          break;
        }
      }

      if (isOverYAxis) {
        e.preventDefault();
        e.stopPropagation();
        
        // Set Y-axis as actively scrolling
        setIsScrollingYAxis(true);
        
        // Clear existing timeout and set new one
        if (yAxisTimeoutRef.current) {
          clearTimeout(yAxisTimeoutRef.current);
        }
        yAxisTimeoutRef.current = setTimeout(resetYAxisColor, 300);
        
        const zoomFactor = 0.05; // Small adjustment per scroll tick
        const isZoomOut = e.deltaY > 0;
        
        setYDomain(([currentMin, currentMax]) => {
          const currentRange = currentMax - currentMin;
          const center = (currentMin + currentMax) / 2;
          
          let newRange: number;
          if (isZoomOut) {
            // Zoom out - increase range
            newRange = currentRange * (1 + zoomFactor);
          } else {
            // Zoom in - decrease range
            newRange = currentRange * (1 - zoomFactor);
          }
          
          // Set limits
          const minAllowedRange = priceRange; // Can't zoom tighter than actual data range
          const maxAllowedRange = priceRange * 3.4; // Can't zoom out more than triple + original padding
          
          // Clamp the range
          newRange = Math.max(minAllowedRange, Math.min(maxAllowedRange, newRange));
          
          const halfRange = newRange / 2;
          const newMin = center - halfRange;
          const newMax = center + halfRange;
          
          return [newMin, newMax];
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('wheel', handleYAxisWheel, { passive: false, capture: true });
      
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('wheel', handleYAxisWheel, { capture: true });
        // Cleanup timeouts
        if (yAxisTimeoutRef.current) {
          clearTimeout(yAxisTimeoutRef.current);
        }
      };
    }
  }, [priceRange]);

  // Safety cleanup effect to ensure colors always reset
  useEffect(() => {
    return () => {
      // Clear timeouts and reset colors on unmount
      if (xAxisTimeoutRef.current) {
        clearTimeout(xAxisTimeoutRef.current);
        xAxisTimeoutRef.current = null;
      }
      if (yAxisTimeoutRef.current) {
        clearTimeout(yAxisTimeoutRef.current);
        yAxisTimeoutRef.current = null;
      }
      setIsScrollingXAxis(false);
      setIsScrollingYAxis(false);
    };
  }, []);

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatTooltipLabel = (label: string) => {
    const date = new Date(label);
    return date.toLocaleDateString();
  };

  // Calculate current price and percent change for ticker
  const currentPrice = data.length > 0 ? data[data.length - 1].price : 0;
  const previousPrice = data.length > 1 ? data[data.length - 2].price : currentPrice;
  const percentChange = previousPrice !== 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
  const isPositive = percentChange >= 0;

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`} style={{ backgroundColor: '#1F1F1F', outline: 'none', position: 'relative' }}>
      {/* Stock Ticker Display */}
      <div 
        className="absolute top-4 left-6 z-10"
        style={{
          backgroundColor: '#2A2A2A',
          padding: '8px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="flex items-center gap-2">
          <span 
            className="text-lg font-semibold"
            style={{ color: '#F9FAFB' }}
          >
            SPY
          </span>
          <span className="text-gray-400">|</span>
          <span 
            className="text-lg font-semibold"
            style={{ color: '#F9FAFB' }}
          >
            {currentPrice.toFixed(2)}
          </span>
          <span 
            className="text-sm font-medium"
            style={{ color: isPositive ? '#10b981' : '#ef4444' }}
          >
            ({isPositive ? '+' : ''}{percentChange.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Statistics Panel */}
      <Statistics className="absolute top-4 right-20" />
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={visibleData}
          margin={{ top: 20, right: 0, left: 20, bottom: 40 }}
        >
          <XAxis 
            dataKey="timestamp"
            tickFormatter={formatXAxisLabel}
            angle={-45}
            textAnchor="end"
            height={40}
            tick={{ fontSize: 12, fill: isScrollingXAxis ? '#F9FAFB' : '#6b7280' }}
            interval={1}
          />
          <YAxis 
            orientation="right"
            domain={yDomain}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            tick={{ fontSize: 12, fill: isScrollingYAxis ? '#F9FAFB' : '#6b7280' }}
          />
          <Tooltip 
            labelFormatter={formatTooltipLabel}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            contentStyle={{
              backgroundColor: '#2A2A2A',
              border: '1px solid #2A2A2A',
              borderRadius: '6px',
              color: '#F9FAFB'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#F9FAFB" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#F9FAFB' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScrollableStockChart;