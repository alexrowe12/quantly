'use client';

import React, { useState } from 'react';

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

interface StatisticsProps {
  className?: string;
  backtestResult?: BacktestResponse | null;
}

const Statistics: React.FC<StatisticsProps> = ({ className = "", backtestResult }) => {
  
  // Calculate comprehensive statistics from backtest result
  const calculateStatistics = (result: BacktestResult) => {
    const totalReturn = ((result.final_value - result.starting_value) / result.starting_value) * 100;
    
    // Group trades into buy-sell pairs
    const buyTrades = result.trades.filter(trade => trade.action === 'buy');
    const sellTrades = result.trades.filter(trade => trade.action === 'sell');
    const tradePairs = Math.min(buyTrades.length, sellTrades.length);
    
    // Calculate win rate and returns for each trade
    let wins = 0;
    const returns: number[] = [];
    let runningBalance = result.starting_value;
    let peak = result.starting_value;
    let maxDrawdown = 0;
    
    for (let i = 0; i < tradePairs; i++) {
      const buyPrice = buyTrades[i].price;
      const sellPrice = sellTrades[i].price;
      const tradeReturn = (sellPrice - buyPrice) / buyPrice;
      returns.push(tradeReturn);
      
      if (tradeReturn > 0) {
        wins++;
      }
      
      // Calculate running balance and drawdown
      const tradeAmount = runningBalance * 0.25; // Assuming 25% allocation per trade
      const tradeProfit = tradeAmount * tradeReturn;
      runningBalance += tradeProfit;
      
      if (runningBalance > peak) {
        peak = runningBalance;
      } else {
        const drawdown = (peak - runningBalance) / peak * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }
    
    const winRate = tradePairs > 0 ? (wins / tradePairs) * 100 : 0;
    
    // Calculate Sharpe Ratio (simplified - assuming risk-free rate of 2%)
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnVariance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const returnStdDev = Math.sqrt(returnVariance);
    const sharpeRatio = returnStdDev > 0 ? (meanReturn - 0.02) / returnStdDev : 0;
    
    // Beta calculation (simplified - comparing to SPY, assume beta = 1 for now)
    const beta = 1.0; // This would require SPY price data for proper calculation
    
    return {
      totalReturn,
      sharpeRatio,
      maxDrawdown: -maxDrawdown, // Negative for display
      beta,
      winRate
    };
  };

  // Use calculated stats if backtest result exists, otherwise show dashes
  const stats = backtestResult 
    ? calculateStatistics(backtestResult.result)
    : {
        totalReturn: null,
        sharpeRatio: null, 
        maxDrawdown: null,
        beta: null,
        winRate: null
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
            {stats.totalReturn !== null ? `${stats.totalReturn.toFixed(2)}%` : '-'}
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
            {stats.sharpeRatio !== null ? stats.sharpeRatio.toFixed(1) : '-'}
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
            {stats.maxDrawdown !== null ? `-$${Math.abs(stats.maxDrawdown).toFixed(2)}` : '-'}
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
            {stats.beta !== null ? stats.beta.toFixed(2) : '-'}
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
            {stats.winRate !== null ? `${stats.winRate.toFixed(2)}%` : '-'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Statistics;