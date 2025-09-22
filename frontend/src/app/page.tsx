'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import SynchronizedCharts from "@/components/SynchronizedCharts";
import StrategyPanel from "@/components/StrategyPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Tour from "@/components/Tour";

interface BacktestResult {
  starting_value: number;
  final_value: number;
  trades: Array<{
    action: string;
    price: number;
    timestamp: string;
  }>;
}

interface BacktestResponse {
  status: string;
  b_id: string;
  result: BacktestResult;
}

export default function Home() {
  const [backtestResult, setBacktestResult] = useState<BacktestResponse | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Memoize the chart and strategy components to prevent unnecessary re-renders
  const memoizedCharts = useMemo(() => (
    <ErrorBoundary>
      <SynchronizedCharts backtestResult={backtestResult} />
    </ErrorBoundary>
  ), [backtestResult]);

  const memoizedStrategyPanel = useMemo(() => (
    <ErrorBoundary>
      <StrategyPanel onBacktestComplete={setBacktestResult} />
    </ErrorBoundary>
  ), []);

  return (
    <div className="w-screen h-screen flex flex-col" style={{ backgroundColor: '#1F1F1F' }}>
      {/* Top Menu Bar */}
      <div 
        className="w-full flex items-center justify-between px-2"
        style={{ 
          backgroundColor: '#2A2A2A',
          height: '5vh'
        }}
      >
        <span 
          className="text-xl font-semibold ml-1"
          style={{ color: '#F9FAFB' }}
        >
          Quantly
        </span>
        
        {/* Right side icons */}
        <div className="flex items-center gap-3 mr-2">
          <img 
            src="/help.png" 
            alt="Help" 
            className="w-6 h-6 cursor-pointer transition-all duration-300 hover:opacity-60"
            style={{ filter: 'brightness(0) invert(1)' }}
            onClick={() => setIsTourActive(true)}
          />
          <img 
            src="/settings.png" 
            alt="Settings" 
            className="w-6 h-6 cursor-pointer transition-all duration-300 hover:opacity-60"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          {/* Profile with dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <img 
              src="/user.png" 
              alt="User" 
              className="w-6 h-6 cursor-pointer transition-all duration-300 hover:opacity-60"
              style={{ filter: 'brightness(0) invert(1)' }}
              onClick={() => {
                console.log('Profile clicked, current state:', showProfileDropdown);
                setShowProfileDropdown(!showProfileDropdown);
              }}
            />
            
            {/* Dropdown */}
            {showProfileDropdown && (
              <div 
                className="absolute right-0 top-8 mt-1 w-64 rounded-lg shadow-lg transition-all duration-200 ease-in-out transform origin-top-right z-50"
                style={{ 
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #444',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div className="p-4">
                  <p 
                    className="text-sm text-center"
                    style={{ color: '#9ca3af' }}
                  >
                    Account functionality coming soon
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Panel - 30% width */}
        <div className="w-[30%] strategy-panel" style={{ backgroundColor: '#1F1F1F' }}>
          {memoizedStrategyPanel}
        </div>
        
        {/* Chart Container - 70% width */}
        <div className="w-[70%] charts-container">
          {memoizedCharts}
        </div>
      </div>

      {/* Tour Component */}
      <Tour 
        isActive={isTourActive} 
        onComplete={() => setIsTourActive(false)} 
      />
    </div>
  );
}
