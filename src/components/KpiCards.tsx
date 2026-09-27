'use client';

import React from 'react';
import { AnalyticsSummary } from '@/types';

interface KpiCardsProps {
  analytics: AnalyticsSummary | null;
  onFilterPriority?: (p: string) => void;
  onFilterLifecycle?: (l: string) => void;
}

export function KpiCards({ analytics }: KpiCardsProps) {
  if (!analytics) return null;

  const cards = [
    {
      title: 'ACTIVE THERMAL EVENTS',
      value: analytics.active_events,
      sub: `${analytics.events_by_lifecycle.monitoring || 0} monitoring · ${analytics.events_by_lifecycle.detected || 0} newly detected`,
      icon: '🔥',
      border: 'border-l-thermal-500',
    },
    {
      title: 'HIGH / CRITICAL PRIORITY',
      value: analytics.high_priority_events,
      sub: `${analytics.events_by_priority.critical || 0} critical escalation · ${analytics.events_by_priority.high || 0} high urgency`,
      icon: '⚠️',
      border: 'border-l-danger-500',
    },
    {
      title: 'PERSISTENT SOURCES',
      value: analytics.persistent_sources,
      sub: 'Flare stacks, power boilers & continuous smelters',
      icon: '🏭',
      border: 'border-l-amber-500',
    },
    {
      title: 'FACILITIES MONITORED',
      value: analytics.facilities_monitored,
      sub: 'Refineries, thermal power, steel & mining corridors',
      icon: '🌐',
      border: 'border-l-blue-500',
    },
    {
      title: 'PEAK RADIATIVE INTENSITY',
      value: `${analytics.max_frp.toFixed(0)} MW`,
      sub: `Fleet average FRP: ${analytics.avg_frp.toFixed(1)} MW`,
      icon: '📈',
      border: 'border-l-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`bg-surface-900 border border-surface-700/70 ${c.border} border-l-4 rounded-md p-3.5 shadow-sm transition-all hover:border-surface-600`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold font-mono tracking-wider">{c.title}</span>
            <span className="text-sm">{c.icon}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">{c.value}</div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
