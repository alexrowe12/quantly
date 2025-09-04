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

  const getValidationLimits = (strategyName: string, field: 'threshold' | 'period' | 'trade_percent') => {
    const limits = {
      'Moving Average': { threshold: { min: 0, max: 1000 }, period: { min: 2, max: 200 }, trade_percent: { min: 0.01, max: 1.0 } },
      'MACD': { threshold: { min: -100, max: 100 }, period: { min: 5, max: 50 }, trade_percent: { min: 0.01, max: 1.0 } },
      'RSI': { threshold: { min: 0, max: 100 }, period: { min: 2, max: 50 }, trade_percent: { min: 0.01, max: 1.0 } },
      'Bollinger Bands': { threshold: { min: 0, max: 10 }, period: { min: 5, max: 100 }, trade_percent: { min: 0.01, max: 1.0 } },
      'Stochastic': { threshold: { min: 0, max: 100 }, period: { min: 5, max: 50 }, trade_percent: { min: 0.01, max: 1.0 } }
    };
    
    return limits[strategyName as keyof typeof limits]?.[field] || { min: 0, max: 1000 };
  };

  const isValidValue = (value: number, strategyName: string, field: 'threshold' | 'period' | 'trade_percent') => {
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
          maxHeight: isOpen ? '200px' : '0px',
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

const StrategyPanel: React.FC = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [strategyName, setStrategyName] = useState('Strategy Name');
  const [isEditingName, setIsEditingName] = useState(false);

  const [strategyItems, setStrategyItems] = useState<StrategyItem[]>([
    { id: 'moving-average', name: 'Moving Average', number: 1, color: '#10b981', action: 'Buy', threshold: 50, period: 20, operator: '<', trade_percent: 0.25 },
    { id: 'macd', name: 'MACD', number: 2, color: '#ef4444', action: 'Buy', threshold: 0, period: 12, operator: '>', trade_percent: 0.25 },
    { id: 'rsi', name: 'RSI', number: 3, color: '#10b981', action: 'Buy', threshold: 30, period: 14, operator: '<', trade_percent: 0.25 }
  ]);

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

  const handleRunBacktest = () => {
    // TODO: Implement backtest API call
    console.log('Running backtest with strategies:', strategyItems);
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
            className="w-full flex items-center justify-center gap-2 p-4 rounded-lg transition-all duration-200 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            style={{ backgroundColor: '#10b981' }}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              className="text-white"
            >
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
            </svg>
            <span 
              className="text-lg font-semibold text-white"
            >
              Run Backtest
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyPanel;