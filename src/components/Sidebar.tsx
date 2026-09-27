'use client';

import React from 'react';

export type NavTab =
  | 'monitor'
  | 'events'
  | 'facilities'
  | 'analytics'
  | 'validation'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadAlertCount: number;
}

export function Sidebar({ currentTab, onSelectTab, unreadAlertCount }: SidebarProps) {
  const navItems: { id: NavTab; label: string; icon: string; badge?: number }[] = [
    { id: 'monitor', label: 'Live Monitor', icon: '📡' },
    { id: 'events', label: 'Thermal Events', icon: '🔥' },
    { id: 'facilities', label: 'Facilities Registry', icon: '🏭' },
    { id: 'analytics', label: 'Intelligence & Trends', icon: '📊' },
    { id: 'validation', label: 'Model Validation', icon: '🔬' },
    { id: 'reports', label: 'Incident Reports', icon: '📑' },
    { id: 'settings', label: 'Settings & Config', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-surface-900 border-r border-surface-700/60 flex flex-col justify-between select-none z-30 shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-surface-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-thermal-600 to-amber-400 flex items-center justify-center shadow-lg shadow-thermal-500/20">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-tight text-white font-mono">Thermal-X</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-thermal-500/20 text-thermal-300 font-semibold border border-thermal-500/30">
                  SIH26162
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                AI Industrial Thermal Intel
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-surface-800 text-white border-l-2 border-thermal-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-850'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-danger-500/20 text-danger-400 border border-danger-500/30">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-surface-700/60 bg-surface-950/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-slate-400 font-mono">PIPELINE STATUS</span>
          <span className="flex items-center space-x-1 text-[11px] text-success-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse"></span>
            <span>ACTIVE</span>
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          FIRMS → Context → Baseline → Explainable AI Classification
        </p>
      </div>
    </aside>
  );
}
