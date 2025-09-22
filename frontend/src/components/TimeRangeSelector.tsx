'use client';

import React from 'react';

interface TimeRangeSelectorProps {
  selectedRange: number;
  onRangeChange: (days: number) => void;
  className?: string;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  className = ""
}) => {
  const ranges = [
    { days: 5, label: '5D' },
    { days: 30, label: '30D' },
    { days: 100, label: '100D' },
    { days: 365, label: '1Y' }
  ];

  return (
    <div 
      className={`time-range-selector ${className} z-10`}
      style={{
        backgroundColor: '#2A2A2A',
        padding: '8px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {/* Label */}
      <span 
        className="text-sm font-medium mr-2"
        style={{ color: '#9ca3af' }}
      >
        Range:
      </span>

      {/* Range Options */}
      {ranges.map((range) => {
        const isSelected = selectedRange === range.days;
        
        return (
          <button
            key={range.days}
            onClick={() => onRangeChange(range.days)}
            className={`px-3 py-1 text-sm font-medium rounded transition-all duration-200 ${
              isSelected ? '' : 'text-gray-400 hover:text-gray-200'
            }`}
            style={{
              backgroundColor: isSelected ? '#F9FAFB' : 'transparent',
              border: isSelected ? '1px solid #F9FAFB' : '1px solid #4b5563',
              borderColor: isSelected ? '#F9FAFB' : '#4b5563',
              color: isSelected ? '#1F1F1F' : undefined
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = '#374151';
                e.currentTarget.style.borderColor = '#6b7280';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#4b5563';
              }
            }}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
};

export default TimeRangeSelector;