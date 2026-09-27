'use client';

import React from 'react';

interface FilterBarProps {
  classification: string;
  priority: string;
  minFrp: number;
  searchQuery: string;
  onClassificationChange: (val: string) => void;
  onPriorityChange: (val: string) => void;
  onMinFrpChange: (val: number) => void;
  onSearchChange: (val: string) => void;
  onReset: () => void;
}

const selectStyle: React.CSSProperties = {
  background: '#0f0a06',
  border: '1px solid #3d2c14',
  color: '#f5ede0',
  borderRadius: '10px',
  padding: '8px 12px',
  fontSize: '13px',
  fontFamily: 'inherit',
  outline: 'none',
  cursor: 'pointer',
};

export const FilterBar: React.FC<FilterBarProps> = ({
  classification,
  priority,
  minFrp,
  searchQuery,
  onClassificationChange,
  onPriorityChange,
  onMinFrpChange,
  onSearchChange,
  onReset,
}) => {
  const hasFilters = classification || priority || minFrp > 0 || searchQuery;

  return (
    <div
      className="px-6 py-4 flex flex-wrap items-center gap-4"
      style={{
        background: '#0f0a06',
        borderBottom: '1px solid #3d2c14',
      }}
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[240px]">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-700 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by facility, event ID, or location..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            background: '#0f0a06',
            border: '1px solid #3d2c14',
            color: '#f5ede0',
            borderRadius: '10px',
            padding: '9px 36px',
            fontSize: '13px',
            width: '100%',
            outline: 'none',
          }}
          className="placeholder-amber-900"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-700 hover:text-amber-400 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Classification Filter */}
      <div className="flex items-center gap-2.5">
        <span className="text-[12px] text-amber-700 font-semibold tracking-wide uppercase">Class</span>
        <select value={classification} onChange={(e) => onClassificationChange(e.target.value)} style={selectStyle}>
          <option value="">All Classifications</option>
          <option value="gas_flare">Gas Flare</option>
          <option value="persistent_industrial">Persistent Industrial</option>
          <option value="industrial_fire">Industrial Fire Anomaly</option>
          <option value="wildfire">Wildfire / Forest Fire</option>
          <option value="agricultural_burning">Agricultural Burn</option>
          <option value="mining_activity">Mining Activity</option>
          <option value="uncertain">Uncertain / Abstain</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-2.5">
        <span className="text-[12px] text-amber-700 font-semibold tracking-wide uppercase">Priority</span>
        <select value={priority} onChange={(e) => onPriorityChange(e.target.value)} style={selectStyle}>
          <option value="">All Priorities</option>
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
      </div>

      {/* Min FRP Slider */}
      <div
        className="flex items-center gap-3 px-4 py-2 rounded-xl"
        style={{ background: '#0f0a06', border: '1px solid #3d2c14' }}
      >
        <span className="text-[12px] text-amber-700 font-semibold uppercase tracking-wide">Min FRP</span>
        <input
          type="range"
          min="0"
          max="200"
          step="5"
          value={minFrp}
          onChange={(e) => onMinFrpChange(Number(e.target.value))}
          className="w-24 cursor-pointer"
          style={{ accentColor: '#ea580c' }}
        />
        <span className="font-mono text-amber-400 text-sm w-16 text-right font-bold">{minFrp} MW</span>
      </div>

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={onReset}
          className="text-sm text-red-400 hover:text-red-300 underline font-semibold ml-auto"
        >
          ↺ Reset Filters
        </button>
      )}
    </div>
  );
};
