'use client';

import React, { useState } from 'react';

interface StatisticsProps {
  className?: string;
}

const Statistics: React.FC<StatisticsProps> = ({ className = "" }) => {
  // Placeholder statistics data - will be dynamic eventually
  const stats = {
    totalReturn: 14.73,
    sharpeRatio: 1.3,
    maxDrawdown: -702.38,
    beta: 0.52,
    winRate: 54.40
  };

  return (
    <div 
      className={`${className} z-10 transition-opacity duration-300 ease-in-out hover:opacity-30`}
      style={{
        backgroundColor: '#2A2A2A',
        padding: '12px 16px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        minWidth: '200px'
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