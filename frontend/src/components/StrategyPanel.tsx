'use client';

import React, { useState } from 'react';

interface StrategyItem {
  id: string;
  name: string;
  number: number;
  color: string;
}

const StrategyPanel: React.FC = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [strategyName, setStrategyName] = useState('Strategy Name');
  const [isEditingName, setIsEditingName] = useState(false);

  const strategyItems: StrategyItem[] = [
    { id: 'moving-average', name: 'Moving Average', number: 1, color: '#10b981' },
    { id: 'macd', name: 'MACD', number: 2, color: '#ef4444' },
    { id: 'rsi', name: 'Relative Strength Index', number: 3, color: '#10b981' }
  ];

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

  return (
    <div className="w-full h-full p-4" style={{ backgroundColor: '#1F1F1F' }}>
      <div 
        className="w-full h-full rounded-lg"
        style={{ 
          backgroundColor: '#2A2A2A',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
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
        <div>
        {strategyItems.map((item) => {
          const isOpen = openItems.includes(item.id);
          
          return (
            <div key={item.id} className="border-b border-gray-600">
              {/* Accordion Header */}
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full flex items-center justify-between p-4 text-left transition-all duration-300 ease-in-out hover:bg-gray-600/50"
                style={{ backgroundColor: isOpen ? '#3E3E3E' : '#2A2A2A' }}
              >
                <div className="flex items-center gap-3">
                  {/* Grid Icon */}
                  <div className="grid grid-cols-2 gap-1 w-4 h-4">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  </div>
                  
                  <span 
                    className="text-lg font-medium"
                    style={{ color: '#F9FAFB' }}
                  >
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Number Badge */}
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: item.color }}
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
                <div className="p-4">
                  {/* Placeholder content - will be customized per strategy */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <select 
                        className="text-white px-3 py-1 rounded border border-gray-500 text-sm"
                        style={{ backgroundColor: '#2A2A2A' }}
                        defaultValue="Buy"
                      >
                        <option>Buy</option>
                        <option>Sell</option>
                      </select>
                      
                      <select 
                        className="text-white px-3 py-1 rounded border border-gray-500 text-sm"
                        style={{ backgroundColor: '#2A2A2A' }}
                        defaultValue="<"
                      >
                        <option>&lt;</option>
                        <option>&gt;</option>
                        <option>=</option>
                      </select>
                      
                      <input 
                        type="number" 
                        defaultValue="30"
                        className="text-white px-3 py-1 rounded border border-gray-500 text-sm w-16"
                        style={{ backgroundColor: '#2A2A2A' }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="#9ca3af">
                          <path d="M8 0L10 6H16L11 10L13 16L8 12L3 16L5 10L0 6H6L8 0Z"/>
                        </svg>
                        <input 
                          type="number" 
                          defaultValue="1"
                          className="text-white px-3 py-1 rounded border border-gray-500 text-sm w-12"
                          style={{ backgroundColor: '#2A2A2A' }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 text-sm">Period:</span>
                      <input 
                        type="number" 
                        defaultValue="14"
                        className="text-white px-3 py-1 rounded border border-gray-500 text-sm w-16"
                        style={{ backgroundColor: '#2A2A2A' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default StrategyPanel;