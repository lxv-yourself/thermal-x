'use client';

import React, { useState } from 'react';
import { Alert } from '@/types';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isDemo: boolean;
  onToggleDemo: () => void;
  alerts: Alert[];
  onSelectEvent: (eventId: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function TopBar({
  searchQuery,
  onSearchChange,
  isDemo,
  onToggleDemo,
  alerts,
  onSelectEvent,
  onRefresh,
  isRefreshing,
}: TopBarProps) {
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const unreadAlerts = alerts.filter((a) => !a.is_read);

  return (
    <header className="h-14 bg-surface-900 border-b border-surface-700/60 px-5 flex items-center justify-between z-20 shrink-0">
      {/* Search Input */}
      <div className="flex items-center space-x-3 w-96">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events, facilities (IOCL, Dadri, Tata), coordinates..."
            className="w-full pl-9 pr-4 py-1.5 bg-surface-850 border border-surface-700 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-thermal-400 focus:ring-1 focus:ring-thermal-400 font-sans transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Freshness & Status Badges */}
      <div className="hidden lg:flex items-center space-x-4 text-xs font-mono">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-surface-850 border border-surface-700/80">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-slate-400">FIRMS:</span>
          <span className="text-slate-200">{isDemo ? 'Sample NRT' : 'Connected'}</span>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-surface-850 border border-surface-700/80">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span className="text-slate-400">Overpass Context:</span>
          <span className="text-slate-200">Active</span>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-surface-850 border border-surface-700/80">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="text-slate-400">Engine:</span>
          <span className="text-slate-200">Rule-Based</span>
        </div>
      </div>

      {/* Controls & Actions */}
      <div className="flex items-center space-x-3">
        {/* Demo Mode Toggle */}
        <button
          onClick={onToggleDemo}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
            isDemo
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
          }`}
          title="Toggle between Demo and Live Data"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          <span>{isDemo ? 'DEMO DATA ACTIVE' : 'LIVE DATA MODE'}</span>
        </button>

        {/* Sync/Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 text-slate-400 hover:text-slate-100 bg-surface-850 hover:bg-surface-800 border border-surface-700 rounded-md transition-colors disabled:opacity-50"
          title="Refresh Hotspot Observations"
        >
          <span className={`inline-block ${isRefreshing ? 'animate-spin' : ''}`}>🔄</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className="relative p-1.5 text-slate-400 hover:text-slate-100 bg-surface-850 hover:bg-surface-800 border border-surface-700 rounded-md transition-colors"
            title="Operational Alerts"
          >
            <span>🔔</span>
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-900 border border-surface-700 rounded-lg shadow-2xl py-2 z-50 animate-slide-in-up">
              <div className="px-3 py-1.5 border-b border-surface-700/70 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Thermal Alerts ({alerts.length})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">NRT FEED</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-surface-800">
                {alerts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No active alerts.</div>
                ) : (
                  alerts.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        onSelectEvent(a.event_id);
                        setShowAlertsDropdown(false);
                      }}
                      className="p-3 hover:bg-surface-800/80 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            a.severity === 'critical'
                              ? 'bg-danger-500/20 text-danger-400 border border-danger-500/30'
                              : 'bg-warning-500/20 text-warning-400 border border-warning-500/30'
                          }`}
                        >
                          {a.severity}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {a.created_at.slice(11, 16)} UTC
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium leading-snug">{a.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
