'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { runBacktest } from '../services/api';

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

interface StrategyItem {
  id: string;
  name: string;
  number: number;
  color: string;
  action: 'Buy' | 'Sell';
  threshold: number;
  period: number;
  operator: '<' | '>' | '=';
  trade_percent: number;
  fast_period?: number; // MACD specific
  slow_period?: number; // MACD specific
  signal_period?: number; // MACD specific
}

interface SortableStrategyItemProps {
  item: StrategyItem;
  isOpen: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onActionChange: (id: string, action: 'Buy' | 'Sell') => void;
  onStrategyChange: (id: string, updates: Partial<StrategyItem>) => void;
}

function SortableStrategyItem({ item, isOpen, onToggle, onDelete, onActionChange, onStrategyChange }: SortableStrategyItemProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const strategyTypes = ['Moving Average', 'MACD', 'RSI', 'Bollinger Bands', 'Stochastic'];
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getValidationLimits = (strategyName: string, field: 'threshold' | 'period' | 'trade_percent' | 'fast_period' | 'slow_period' | 'signal_period') => {
    const limits = {
      'Moving Average': { threshold: { min: 0, max: 1000 }, period: { min: 2, max: 200 }, trade_percent: { min: 0.01, max: 1.0 } },
      'MACD': { 
        threshold: { min: -100, max: 100 }, 
        period: { min: 5, max: 50 }, 
        trade_percent: { min: 0.01, max: 1.0 },
        fast_period: { min: 5, max: 50 },
        slow_period: { min: 10, max: 100 },
        signal_period: { min: 3, max: 30 }
      },
      'RSI': { threshold: { min: 0, max: 100 }, period: { min: 2, max: 50 }, trade_percent: { min: 0.01, max: 1.0 } },
      'Bollinger Bands': { threshold: { min: 0, max: 10 }, period: { min: 5, max: 100 }, trade_percent: { min: 0.01, max: 1.0 } },
      'Stochastic': { threshold: { min: 0, max: 100 }, period: { min: 5, max: 50 }, trade_percent: { min: 0.01, max: 1.0 } }
    };
    
    return limits[strategyName as keyof typeof limits]?.[field] || { min: 0, max: 1000 };
  };

  const isValidValue = (value: number, strategyName: string, field: 'threshold' | 'period' | 'trade_percent' | 'fast_period' | 'slow_period' | 'signal_period') => {
    const limits = getValidationLimits(strategyName, field);
    return !isNaN(value) && value >= limits.min && value <= limits.max;
  };

  return (
    <div ref={setNodeRef} style={style} className="border-b border-gray-600">
      {/* Accordion Header */}
      <button
        onClick={() => onToggle(item.id)}
        className="w-full flex items-center justify-between p-4 text-left transition-all duration-300 ease-in-out hover:bg-gray-600/50"
        style={{ backgroundColor: isOpen ? '#3E3E3E' : '#2A2A2A' }}
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-600/50 rounded transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-1 w-4 h-4">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
          
          {isEditingName ? (
            <select
              value={item.name}
              onChange={(e) => {
                onStrategyChange(item.id, { name: e.target.value });
                setIsEditingName(false);
              }}
              onBlur={() => setIsEditingName(false)}
              autoFocus
              className="text-lg font-medium bg-transparent border-b border-gray-400 focus:border-white outline-none transition-colors duration-200"
              style={{ color: '#F9FAFB', backgroundColor: '#2A2A2A' }}
              onClick={(e) => e.stopPropagation()}
            >
              {strategyTypes.map((type) => (
                <option key={type} value={type} style={{ backgroundColor: '#2A2A2A', color: '#F9FAFB' }}>
                  {type}
                </option>
              ))}
            </select>
          ) : (
            <span 
              className="text-lg font-medium cursor-pointer px-2 py-1 rounded transition-all duration-200 hover:bg-gray-600/30"
              style={{ color: '#F9FAFB' }}
              onDoubleClick={() => setIsEditingName(true)}
              title="Double-click to change strategy type"
            >
              {item.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Number Badge */}
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-300 ease-in-out"
            style={{ backgroundColor: item.action === 'Buy' ? '#10b981' : '#ef4444' }}
          >
            {item.number}
          </div>

          {/* Arrow */}
          <div 
            className="relative w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ease-in-out hover:bg-black/20 group"
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            <svg 
              width="12" 
              height="8" 
              viewBox="0 0 12 8" 
              fill="currentColor"
              className="transition-colors duration-300 ease-in-out text-gray-400 group-hover:text-gray-300"
            >
              <path d="M6 8L0 2L1.41 0.59L6 5.17L10.59 0.59L12 2L6 8Z"/>
            </svg>
          </div>
        </div>
      </button>

      {/* Accordion Content */}
      <div 
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ 
          maxHeight: isOpen ? (item.name === 'MACD' ? '300px' : '200px') : '0px',
          backgroundColor: isOpen ? '#3E3E3E' : 'transparent'
        }}
      >
        <div className="p-4 relative">
          {/* Strategy Configuration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <select 
                className="text-white px-3 py-1 rounded border border-gray-500 text-sm"
                style={{ backgroundColor: '#2A2A2A' }}
                value={item.action}
                onChange={(e) => onActionChange(item.id, e.target.value as 'Buy' | 'Sell')}
              >
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </select>
              
              <select 
                className="text-white px-3 py-1 rounded border border-gray-500 text-sm"
                style={{ backgroundColor: '#2A2A2A' }}
                value={item.operator}
                onChange={(e) => onStrategyChange(item.id, { operator: e.target.value as '<' | '>' | '=' })}
              >
                <option value="<">&lt;</option>
                <option value=">">&gt;</option>
                <option value="=">=</option>
              </select>
              
              <input 
                type="number" 
                value={item.threshold}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  const limits = getValidationLimits(item.name, 'threshold');
                  if (!isNaN(value) && value >= limits.min && value <= limits.max) {
                    onStrategyChange(item.id, { threshold: value });
                  }
                }}
                min={getValidationLimits(item.name, 'threshold').min}
                max={getValidationLimits(item.name, 'threshold').max}
                className={`text-white px-3 py-1 rounded text-sm w-16 ${
                  isValidValue(item.threshold, item.name, 'threshold') 
                    ? 'border border-gray-500' 
                    : 'border-2 border-red-500'
                }`}
                style={{ backgroundColor: '#2A2A2A' }}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-300 text-sm">Period:</span>
              <input 
                type="number"
                value={item.period}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  const limits = getValidationLimits(item.name, 'period');
                  if (!isNaN(value) && value >= limits.min && value <= limits.max) {
                    onStrategyChange(item.id, { period: value });
                  }
                }}
                min={getValidationLimits(item.name, 'period').min}
                max={getValidationLimits(item.name, 'period').max}
                className={`text-white px-3 py-1 rounded text-sm w-16 ${
                  isValidValue(item.period, item.name, 'period') 
                    ? 'border border-gray-500' 
                    : 'border-2 border-red-500'
                }`}
                style={{ backgroundColor: '#2A2A2A' }}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-300 text-sm">Trade %:</span>
              <input 
                type="number"
                step="0.01"
                value={item.trade_percent}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  const limits = getValidationLimits(item.name, 'trade_percent');
                  if (!isNaN(value) && value >= limits.min && value <= limits.max) {
                    onStrategyChange(item.id, { trade_percent: value });
                  }
                }}
                min={getValidationLimits(item.name, 'trade_percent').min}
                max={getValidationLimits(item.name, 'trade_percent').max}
                className={`text-white px-3 py-1 rounded text-sm w-16 ${
                  isValidValue(item.trade_percent, item.name, 'trade_percent') 
                    ? 'border border-gray-500' 
                    : 'border-2 border-red-500'
                }`}
                style={{ backgroundColor: '#2A2A2A' }}
              />
            </div>

            {/* MACD-specific fields */}
            {item.name === 'MACD' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">Fast Period:</span>
                  <input 
                    type="number"
                    value={item.fast_period || 12}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      const limits = getValidationLimits(item.name, 'fast_period');
                      if (!isNaN(value) && value >= limits.min && value <= limits.max) {
                        onStrategyChange(item.id, { fast_period: value });
                      }
                    }}
                    min={getValidationLimits(item.name, 'fast_period').min}
                    max={getValidationLimits(item.name, 'fast_period').max}
                    className={`text-white px-3 py-1 rounded text-sm w-16 ${
                      isValidValue(item.fast_period || 12, item.name, 'fast_period') 
                        ? 'border border-gray-500' 
                        : 'border-2 border-red-500'
                    }`}
                    style={{ backgroundColor: '#2A2A2A' }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">Slow Period:</span>
                  <input 
                    type="number"
                    value={item.slow_period || 26}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      const limits = getValidationLimits(item.name, 'slow_period');
                      if (!isNaN(value) && value >= limits.min && value <= limits.max) {
                        onStrategyChange(item.id, { slow_period: value });
                      }
                    }}
                    min={getValidationLimits(item.name, 'slow_period').min}
                    max={getValidationLimits(item.name, 'slow_period').max}
                    className={`text-white px-3 py-1 rounded text-sm w-16 ${
                      isValidValue(item.slow_period || 26, item.name, 'slow_period') 
                        ? 'border border-gray-500' 
                        : 'border-2 border-red-500'
                    }`}
                    style={{ backgroundColor: '#2A2A2A' }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">Signal Period:</span>
                  <input 
                    type="number"
                    value={item.signal_period || 9}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      const limits = getValidationLimits(item.name, 'signal_period');
                      if (!isNaN(value) && value >= limits.min && value <= limits.max) {
                        onStrategyChange(item.id, { signal_period: value });
                      }
                    }}
                    min={getValidationLimits(item.name, 'signal_period').min}
                    max={getValidationLimits(item.name, 'signal_period').max}
                    className={`text-white px-3 py-1 rounded text-sm w-16 ${
                      isValidValue(item.signal_period || 9, item.name, 'signal_period') 
                        ? 'border border-gray-500' 
                        : 'border-2 border-red-500'
                    }`}
                    style={{ backgroundColor: '#2A2A2A' }}
                  />
                </div>
              </>
            )}
          </div>
          
          {/* Delete Button */}
          <button
            onClick={() => onDelete(item.id)}
            className="absolute bottom-2 right-2 p-1 rounded hover:bg-red-600/20 transition-colors group"
            title="Delete strategy"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="currentColor"
              className="text-gray-400 group-hover:text-red-400 transition-colors"
            >
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface StrategyPanelProps {
  onBacktestComplete?: (result: BacktestResponse | null) => void;
}

const StrategyPanel: React.FC<StrategyPanelProps> = ({ onBacktestComplete }) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [strategyName, setStrategyName] = useState('Strategy Name');
  const [isEditingName, setIsEditingName] = useState(false);

  const [strategyItems, setStrategyItems] = useState<StrategyItem[]>([
    { id: 'moving-average', name: 'Moving Average', number: 1, color: '#10b981', action: 'Buy', threshold: 50, period: 20, operator: '<', trade_percent: 0.25 },
    { id: 'macd', name: 'MACD', number: 2, color: '#ef4444', action: 'Buy', threshold: 0, period: 12, operator: '>', trade_percent: 0.25, fast_period: 12, slow_period: 26, signal_period: 9 },
    { id: 'rsi', name: 'RSI', number: 3, color: '#10b981', action: 'Buy', threshold: 30, period: 14, operator: '<', trade_percent: 0.25 }
  ]);
  
  const [isRunningBacktest, setIsRunningBacktest] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResponse | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleNameDoubleClick = () => {
    setIsEditingName(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStrategyName(e.target.value);
  };

  const handleNameSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingName(false);
    }
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
  };

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setStrategyItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update numbers to reflect new order
        return newItems.map((item, index) => ({
          ...item,
          number: index + 1
        }));
      });
    }
  }

  const handleDeleteStrategy = (id: string) => {
    setStrategyItems((items) => {
      const filtered = items.filter(item => item.id !== id);
      // Update numbers to reflect new order
      return filtered.map((item, index) => ({
        ...item,
        number: index + 1
      }));
    });
    // Close the item if it was open
    setOpenItems(prev => prev.filter(itemId => itemId !== id));
  };

  const handleAddStrategy = () => {
    const newId = `rsi-${Date.now()}`;
    
    setStrategyItems((items) => {
      const newItem: StrategyItem = {
        id: newId,
        name: 'RSI',
        number: items.length + 1,
        color: '#10b981', // Green color
        action: 'Buy', // Default to Buy
        threshold: 30, // RSI oversold default
        period: 14, // RSI default period
        operator: '<', // Buy when RSI < threshold
        trade_percent: 0.25 // Default 25% allocation
      };
      return [...items, newItem];
    });
  };

  const handleActionChange = (id: string, action: 'Buy' | 'Sell') => {
    setStrategyItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, action } : item
      )
    );
  };

  const handleStrategyChange = (id: string, updates: Partial<StrategyItem>) => {
    setStrategyItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const mapStrategyToBackendName = (strategyName: string, action: 'Buy' | 'Sell'): string => {
    const strategyMap: { [key: string]: { buy: string; sell: string } } = {
      'RSI': { buy: 'rsi_oversold', sell: 'rsi_overbought' },
      'Moving Average': { buy: 'sma_buy', sell: 'sma_sell' },
      'MACD': { buy: 'macd_buy', sell: 'macd_sell' },
      'Bollinger Bands': { buy: 'sma_buy', sell: 'sma_sell' }, // Using SMA for now
      'Stochastic': { buy: 'rsi_oversold', sell: 'rsi_overbought' } // Using RSI for now
    };
    
    return strategyMap[strategyName]?.[action.toLowerCase() as 'buy' | 'sell'] || 'rsi_oversold';
  };

  const convertStrategyToBackend = (strategy: StrategyItem) => {
    const backendStrategy: any = {
      name: mapStrategyToBackendName(strategy.name, strategy.action),
      trade_percent: strategy.trade_percent,
      threshold: strategy.threshold,
      period: strategy.period
    };

    // Add MACD-specific fields if present
    if (strategy.name === 'MACD') {
      backendStrategy.fast_period = strategy.fast_period || 12;
      backendStrategy.slow_period = strategy.slow_period || 26;
      backendStrategy.signal_period = strategy.signal_period || 9;
    }

    return backendStrategy;
  };

  const handleRunBacktest = async () => {
    if (isRunningBacktest) return; // Prevent multiple simultaneous requests
    
    setIsRunningBacktest(true);
    
    try {
      console.log('Running backtest with strategies:', strategyItems);
      
      // Separate strategies by action
      const buyStrategies = strategyItems
        .filter(s => s.action === 'Buy')
        .map(convertStrategyToBackend);
      
      const sellStrategies = strategyItems
        .filter(s => s.action === 'Sell')
        .map(convertStrategyToBackend);

      console.log('Converted buy strategies:', buyStrategies);
      console.log('Converted sell strategies:', sellStrategies);

      // Prepare backtest request
      const backtestRequest = {
        ticker: 'SPY',
        starting_value: 10000,
        buy_strategies: buyStrategies,
        sell_strategies: sellStrategies,
        start_date: undefined, // Use all available data
        end_date: undefined
      };

      console.log('Sending backtest request:', backtestRequest);

      // Call the API
      const result = await runBacktest(backtestRequest);
      
      console.log('Backtest completed successfully!');
      console.log('Backtest ID:', result.b_id);
      console.log('Starting value:', result.result.starting_value);
      console.log('Final value:', result.result.final_value);
      console.log('Total trades:', result.result.trades.length);
      console.log('Full result:', result);

      // Set the result and show the modal
      setBacktestResult(result);
      setShowResultModal(true);

      // Notify parent component of the new results
      if (onBacktestComplete) {
        onBacktestComplete(result);
      }

    } catch (error) {
      console.error('Backtest failed:', error);
      // TODO: Show user-friendly error message
    } finally {
      setIsRunningBacktest(false);
    }
  };

  // Calculate performance metrics
  const calculateMetrics = (result: BacktestResult) => {
    const totalReturn = result.final_value - result.starting_value;
    const returnPercentage = ((result.final_value - result.starting_value) / result.starting_value) * 100;
    const totalTrades = result.trades.length;
    
    // Calculate win rate
    let wins = 0;
    let totalGain = 0;
    let totalLoss = 0;
    
    // Group trades into buy-sell pairs
    const buyTrades = result.trades.filter(trade => trade.action === 'buy');
    const sellTrades = result.trades.filter(trade => trade.action === 'sell');
    
    const tradePairs = Math.min(buyTrades.length, sellTrades.length);
    
    for (let i = 0; i < tradePairs; i++) {
      const buyPrice = buyTrades[i].price;
      const sellPrice = sellTrades[i].price;
      const profit = sellPrice - buyPrice;
      
      if (profit > 0) {
        wins++;
        totalGain += profit;
      } else {
        totalLoss += Math.abs(profit);
      }
    }
    
    const winRate = tradePairs > 0 ? (wins / tradePairs) * 100 : 0;
    const avgGain = wins > 0 ? totalGain / wins : 0;
    const avgLoss = (tradePairs - wins) > 0 ? totalLoss / (tradePairs - wins) : 0;
    
    return {
      totalReturn,
      returnPercentage,
      totalTrades,
      tradePairs,
      winRate,
      avgGain,
      avgLoss
    };
  };

  const BacktestResultModal = () => {
    if (!backtestResult || !showResultModal) return null;
    
    const metrics = calculateMetrics(backtestResult.result);
    
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(31, 31, 31, 0.8)' }}>
        <div 
          className="rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
          style={{ backgroundColor: '#2A2A2A' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid #3E3E3E' }}>
            <h2 className="text-2xl font-semibold" style={{ color: '#F9FAFB' }}>Backtest Results</h2>
            <button
              onClick={() => setShowResultModal(false)}
              className="p-2 rounded-full transition-colors"
              style={{ color: '#6b7280' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#F9FAFB';
                e.currentTarget.style.backgroundColor = '#3E3E3E';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#3E3E3E' }}>
                <div className="text-sm" style={{ color: '#6b7280' }}>Starting Value</div>
                <div className="text-xl font-semibold" style={{ color: '#F9FAFB' }}>
                  ${backtestResult.result.starting_value.toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#3E3E3E' }}>
                <div className="text-sm" style={{ color: '#6b7280' }}>Final Value</div>
                <div className="text-xl font-semibold" style={{ color: '#F9FAFB' }}>
                  ${backtestResult.result.final_value.toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#3E3E3E' }}>
                <div className="text-sm" style={{ color: '#6b7280' }}>Total Return</div>
                <div className="text-xl font-semibold" style={{ 
                  color: metrics.totalReturn >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn.toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#3E3E3E' }}>
                <div className="text-sm" style={{ color: '#6b7280' }}>Return %</div>
                <div className="text-xl font-semibold" style={{ 
                  color: metrics.returnPercentage >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {metrics.returnPercentage >= 0 ? '+' : ''}{metrics.returnPercentage.toFixed(2)}%
                </div>
              </div>
            </div>
            
            {/* Performance Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#3E3E3E' }}>
                <div className="text-sm" style={{ color: '#6b7280' }}>Total Trades</div>
                <div className="text-xl font-semibold" style={{ color: '#F9FAFB' }}>{metrics.totalTrades}</div>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#3E3E3E' }}>
                <div className="text-sm" style={{ color: '#6b7280' }}>Trade Pairs</div>
                <div className="text-xl font-semibold" style={{ color: '#F9FAFB' }}>{metrics.tradePairs}</div>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#3E3E3E' }}>
                <div className="text-sm" style={{ color: '#6b7280' }}>Win Rate</div>
                <div className="text-xl font-semibold" style={{ color: '#F9FAFB' }}>{metrics.winRate.toFixed(1)}%</div>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#3E3E3E' }}>
                <div className="text-sm" style={{ color: '#6b7280' }}>Backtest ID</div>
                <div className="text-sm font-mono" style={{ color: '#6b7280' }}>{backtestResult.b_id}</div>
              </div>
            </div>
            
            {/* Trades Table */}
            <div className="rounded-lg" style={{ backgroundColor: '#3E3E3E' }}>
              <div className="p-4" style={{ borderBottom: '1px solid #2A2A2A' }}>
                <h3 className="text-lg font-semibold" style={{ color: '#F9FAFB' }}>Trade History</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0" style={{ backgroundColor: '#2A2A2A' }}>
                    <tr>
                      <th className="text-left p-3 text-sm font-medium" style={{ color: '#6b7280' }}>Action</th>
                      <th className="text-right p-3 text-sm font-medium" style={{ color: '#6b7280' }}>Price</th>
                      <th className="text-left p-3 text-sm font-medium" style={{ color: '#6b7280' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backtestResult.result.trades.map((trade, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #2A2A2A' }}>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded text-xs font-semibold" style={{
                            backgroundColor: trade.action === 'buy' ? '#10b981' : '#ef4444',
                            color: '#F9FAFB'
                          }}>
                            {trade.action.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono" style={{ color: '#F9FAFB' }}>
                          ${trade.price.toFixed(2)}
                        </td>
                        <td className="p-3 font-mono" style={{ color: '#6b7280' }}>
                          {new Date(trade.timestamp).toLocaleDateString()} {new Date(trade.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full p-4 relative" style={{ backgroundColor: '#1F1F1F' }}>
      <div 
        className="w-full h-full rounded-lg relative"
        style={{ 
          backgroundColor: '#2A2A2A',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          paddingBottom: '80px' // Make room for the backtest button
        }}
      >
        {/* Header */}
        <div className="mb-6 pt-4 px-4">
          {isEditingName ? (
            <input
              type="text"
              value={strategyName}
              onChange={handleNameChange}
              onKeyDown={handleNameSubmit}
              onBlur={handleNameBlur}
              autoFocus
              className="w-full text-xl font-semibold text-center bg-transparent border-b-2 border-gray-400 focus:border-white outline-none transition-colors duration-200"
              style={{ color: '#F9FAFB' }}
            />
          ) : (
            <div
              onDoubleClick={handleNameDoubleClick}
              className="text-xl font-semibold text-center cursor-pointer px-2 py-1 rounded transition-all duration-200 border-b-2 border-transparent hover:border-gray-500/50"
              style={{ 
                color: '#F9FAFB',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3E3E3E'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Double-click to edit"
            >
              {strategyName}
            </div>
          )}
        </div>

        {/* Accordion Items */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={strategyItems.map(item => item.id)} 
            strategy={verticalListSortingStrategy}
          >
            <div>
              {strategyItems.map((item) => {
                const isOpen = openItems.includes(item.id);
                
                return (
                  <SortableStrategyItem
                    key={item.id}
                    item={item}
                    isOpen={isOpen}
                    onToggle={toggleItem}
                    onDelete={handleDeleteStrategy}
                    onActionChange={handleActionChange}
                    onStrategyChange={handleStrategyChange}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
        
        {/* Add Strategy Button */}
        <div className="mt-4 p-4">
          <button
            onClick={handleAddStrategy}
            className="w-full flex items-center justify-center gap-2 p-3 rounded transition-all duration-200 hover:bg-gray-600/50"
            style={{ backgroundColor: '#2A2A2A', border: '1px dashed #6b7280' }}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              className="text-gray-400"
            >
              <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
            </svg>
            <span 
              className="text-sm font-medium"
              style={{ color: '#9ca3af' }}
            >
              Add Strategy
            </span>
          </button>
        </div>
        
        {/* Run Backtest Button - Absolutely positioned at bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleRunBacktest}
            disabled={isRunningBacktest}
            className={`w-full flex items-center justify-center gap-2 p-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 ${
              isRunningBacktest 
                ? 'cursor-not-allowed' 
                : 'hover:bg-green-700 cursor-pointer'
            }`}
            style={{ backgroundColor: isRunningBacktest ? '#6b7280' : '#10b981' }}
          >
            {isRunningBacktest ? (
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none"
                className="text-white animate-spin"
              >
                <circle 
                  cx="10" 
                  cy="10" 
                  r="8" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeDasharray="32" 
                  strokeDashoffset="32"
                >
                  <animate 
                    attributeName="stroke-dasharray" 
                    dur="2s" 
                    values="0 32;16 16;0 32;0 32" 
                    repeatCount="indefinite"
                  />
                  <animate 
                    attributeName="stroke-dashoffset" 
                    dur="2s" 
                    values="0;-16;-32;-32" 
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            ) : (
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                className="text-white"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
              </svg>
            )}
            <span 
              className="text-lg font-semibold text-white"
            >
              {isRunningBacktest ? 'Running Backtest...' : 'Run Backtest'}
            </span>
          </button>
        </div>
      </div>
      
      {/* Backtest Result Modal */}
      <BacktestResultModal />
    </div>
  );
};

export default StrategyPanel;