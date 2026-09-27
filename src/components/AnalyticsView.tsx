'use client';

import React from 'react';
import { AnalyticsSummary, ThermalEvent } from '@/types';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary | null;
  events: ThermalEvent[];
  onSelectEvent: (id: string) => void;
}

export function AnalyticsView({ analytics, events, onSelectEvent }: AnalyticsViewProps) {
  if (!analytics) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
        Loading intelligence analytics...
      </div>
    );
  }

  const classData = Object.entries(analytics.events_by_classification).map(([k, v]) => ({
    name: k.replace('_', ' ').toUpperCase(),
    count: v,
    pct: analytics.total_events > 0 ? ((v / analytics.total_events) * 100).toFixed(0) : '0',
  }));

  const priorityData = Object.entries(analytics.events_by_priority).map(([k, v]) => ({
    name: k.toUpperCase(),
    count: v,
    pct: analytics.total_events > 0 ? ((v / analytics.total_events) * 100).toFixed(0) : '0',
  }));

  return (
    <div className="flex-1 flex flex-col p-6 space-y-5 overflow-y-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight font-mono">
          Intelligence & Analytics Workspace
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Macro thermal distributions, classification breakdowns, and baseline telemetry trends
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-lg bg-surface-900 border border-surface-700/80">
          <div className="text-slate-400 text-[10px] uppercase">TOTAL MONITORED EVENTS</div>
          <div className="text-2xl font-bold text-white mt-1">{analytics.total_events}</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">
            {analytics.active_events} currently active
          </div>
        </div>

        <div className="p-4 rounded-lg bg-surface-900 border border-surface-700/80">
          <div className="text-slate-400 text-[10px] uppercase">CRITICAL / HIGH PRIORITY</div>
          <div className="text-2xl font-bold text-danger-400 mt-1">
            {analytics.high_priority_events}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Requiring emergency verification</div>
        </div>

        <div className="p-4 rounded-lg bg-surface-900 border border-surface-700/80">
          <div className="text-slate-400 text-[10px] uppercase">PERSISTENT INDUSTRIAL SOURCES</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {analytics.persistent_sources}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Recurrent flaring & power generation</div>
        </div>

        <div className="p-4 rounded-lg bg-surface-900 border border-surface-700/80">
          <div className="text-slate-400 text-[10px] uppercase">FLEET AVERAGE FRP</div>
          <div className="text-2xl font-bold text-white mt-1">
            {analytics.avg_frp.toFixed(1)} MW
          </div>
          <div className="text-[11px] text-purple-400 mt-0.5">
            Peak single event: {analytics.max_frp.toFixed(0)} MW
          </div>
        </div>
      </div>

      {/* Grid: Classification Breakdown & Priority Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        {/* Classification Breakdown */}
        <div className="p-5 rounded-lg bg-surface-900 border border-surface-700/80 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-surface-700 pb-2">
            <span className="font-bold text-slate-200 uppercase tracking-wider">
              CLASSIFICATION DISTRIBUTION
            </span>
            <span className="text-[10px] text-slate-500">EXPLAINABLE AI ENGINE</span>
          </div>

          <div className="space-y-3">
            {classData.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300 font-sans">{item.name}</span>
                  <span className="text-slate-400">
                    {item.count} events ({item.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded bg-surface-800 overflow-hidden">
                  <div
                    className="h-full bg-thermal-400 transition-all duration-300"
                    style={{ width: `${item.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="p-5 rounded-lg bg-surface-900 border border-surface-700/80 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-surface-700 pb-2">
            <span className="font-bold text-slate-200 uppercase tracking-wider">
              OPERATIONAL PRIORITY PROFILE
            </span>
            <span className="text-[10px] text-slate-500">MULTI-FACTOR MODEL</span>
          </div>

          <div className="space-y-3">
            {priorityData.map((item) => {
              const color =
                item.name === 'CRITICAL'
                  ? 'bg-danger-500'
                  : item.name === 'HIGH'
                  ? 'bg-orange-500'
                  : item.name === 'MEDIUM'
                  ? 'bg-amber-400'
                  : 'bg-sky-400';

              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300">{item.name}</span>
                    <span className="text-slate-400">
                      {item.count} events ({item.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded bg-surface-800 overflow-hidden">
                    <div
                      className={`h-full ${color} transition-all duration-300`}
                      style={{ width: `${item.pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* High-Intensity Events Spotlight */}
      <div className="p-5 rounded-lg bg-surface-900 border border-surface-700/80 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-surface-700 pb-2">
          <span className="font-bold text-slate-200 uppercase tracking-wider">
            HIGH-INTENSITY THERMAL SPOTLIGHT
          </span>
          <span className="text-[10px] text-slate-500">SORTED BY RADIATIVE POWER (MW)</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[...events]
            .sort((a, b) => b.max_frp - a.max_frp)
            .slice(0, 3)
            .map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev.id)}
                className="p-3.5 rounded bg-surface-850 border border-surface-750 hover:border-thermal-400 cursor-pointer transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px]">{ev.id}</span>
                  <span className="text-[10px] font-bold text-danger-400">
                    {ev.max_frp.toFixed(1)} MW
                  </span>
                </div>
                <div className="text-slate-300 font-sans text-xs capitalize">
                  {ev.classification.replace('_', ' ')}
                </div>
                <div className="text-[10px] text-slate-500">
                  {ev.nearest_facility_name || 'Isolated thermal incident'}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
