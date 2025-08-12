'use client';

import React, { useState } from 'react';

interface StatisticsProps {
  className?: string;
}

const Statistics: React.FC<StatisticsProps> = ({ className = "" }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Placeholder statistics data - will be dynamic eventually
  const stats = {
    totalReturn: 14.73,
    sharpeRatio: 1.3,
    maxDrawdown: -702.38,
    beta: 0.52,
    winRate: 54.40
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div 
      className={`${className} z-10 transition-opacity duration-300 ease-in-out`}
      style={{
        backgroundColor: '#2A2A2A',
        padding: '12px 16px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        minWidth: '200px',
        opacity: isVisible ? 1 : 0.2
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 
          className="text-lg font-semibold"
          style={{ color: '#F9FAFB' }}
        >
          Statistics
        </h3>
        <div className="flex items-center gap-2">
          {/* Visibility Toggle (Eye) */}
          <button
            onClick={toggleVisibility}
            className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity duration-200 p-1"
            title={isVisible ? "Hide statistics" : "Show statistics"}
          >
            {isVisible ? (
              // Eye open icon
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                  fill="#9ca3af"
                />
              </svg>
            ) : (
              // Eye closed icon
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                  fill="#9ca3af"
                />
              </svg>
            )}
          </button>
          
          {/* Edit Icon */}
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none"
            className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity duration-200"
          >
            <path 
              d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z"
              fill="#9ca3af"
            />
            <path 
              d="m5.21 10.79-1.41 1.42a.75.75 0 0 0 .03 1.06 1.75 1.75 0 0 0 1.06.03l1.42-1.41.03-.04.04-.03L5.21 10.79Z"
              fill="#9ca3af"
            />
          </svg>
        </div>
      </div>

      {/* Statistics List */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span 
            className="text-sm"
            style={{ color: '#9ca3af' }}
          >
            Total return:
          </span>
          <span 
            className="text-sm font-medium"
            style={{ color: '#F9FAFB' }}
          >
            {stats.totalReturn.toFixed(2)}%
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span 
            className="text-sm"
            style={{ color: '#9ca3af' }}
          >
            Sharpe ratio:
          </span>
          <span 
            className="text-sm font-medium"
            style={{ color: '#F9FAFB' }}
          >
            {stats.sharpeRatio.toFixed(1)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span 
            className="text-sm"
            style={{ color: '#9ca3af' }}
          >
            Max drawdown:
          </span>
          <span 
            className="text-sm font-medium"
            style={{ color: '#F9FAFB' }}
          >
            -${Math.abs(stats.maxDrawdown).toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span 
            className="text-sm"
            style={{ color: '#9ca3af' }}
          >
            Beta:
          </span>
          <span 
            className="text-sm font-medium"
            style={{ color: '#F9FAFB' }}
          >
            {stats.beta.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span 
            className="text-sm"
            style={{ color: '#9ca3af' }}
          >
            Win rate:
          </span>
          <span 
            className="text-sm font-medium"
            style={{ color: '#F9FAFB' }}
          >
            {stats.winRate.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default Statistics;