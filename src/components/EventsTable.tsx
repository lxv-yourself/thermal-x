'use client';

import React, { useState } from 'react';
import { ThermalEvent, ClassificationLabel, PriorityLevel, EventLifecycle } from '@/types';

interface EventsTableProps {
  events: ThermalEvent[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  onRefresh: () => void;
}

export function EventsTable({
  events,
  selectedEventId,
  onSelectEvent,
  onRefresh,
}: EventsTableProps) {
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterLifecycle, setFilterLifecycle] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'frp' | 'date' | 'priority' | 'confidence'>('date');

  const filtered = events.filter((e) => {
    if (filterClass !== 'all' && e.classification !== filterClass) return false;
    if (filterPriority !== 'all' && e.priority !== filterPriority) return false;
    if (filterLifecycle !== 'all' && e.lifecycle !== filterLifecycle) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'frp') return b.max_frp - a.max_frp;
    if (sortBy === 'confidence') return b.classification_confidence - a.classification_confidence;
    if (sortBy === 'priority') return b.priority_score - a.priority_score;
    return new Date(b.last_detected).getTime() - new Date(a.last_detected).getTime();
  });

  function handleExportCsv() {
    window.open('/api/export?format=csv', '_blank');
  }

  function handleExportGeoJson() {
    window.open('/api/export?format=geojson', '_blank');
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-mono">
            Thermal Events Registry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Spatio-temporally clustered satellite hotspot incidents enriched with industrial context
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded bg-surface-850 hover:bg-surface-800 text-slate-300 text-xs font-mono border border-surface-700 transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportGeoJson}
            className="px-3 py-1.5 rounded bg-surface-850 hover:bg-surface-800 text-slate-300 text-xs font-mono border border-surface-700 transition-colors"
          >
            Export GeoJSON
          </button>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded bg-thermal-500 hover:bg-thermal-400 text-surface-950 font-bold text-xs font-mono transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-surface-900 border border-surface-700/80 rounded-lg text-xs font-mono">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Classification:</span>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-surface-800 border border-surface-700 rounded px-2 py-1 text-slate-300 outline-none"
          >
            <option value="all">All Classes</option>
            <option value="industrial_fire">Industrial Fire</option>
            <option value="persistent_industrial">Persistent Industrial</option>
            <option value="gas_flare">Gas Flare</option>
            <option value="wildfire">Wildfire</option>
            <option value="agricultural_burning">Agricultural</option>
            <option value="mining_activity">Mining</option>
            <option value="uncertain">Uncertain</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-surface-800 border border-surface-700 rounded px-2 py-1 text-slate-300 outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Lifecycle:</span>
          <select
            value={filterLifecycle}
            onChange={(e) => setFilterLifecycle(e.target.value)}
            className="bg-surface-800 border border-surface-700 rounded px-2 py-1 text-slate-300 outline-none"
          >
            <option value="all">All Lifecycles</option>
            <option value="detected">Detected</option>
            <option value="monitoring">Monitoring</option>
            <option value="persistent">Persistent</option>
            <option value="abnormal">Abnormal</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 ml-auto">
          <span className="text-slate-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-surface-800 border border-surface-700 rounded px-2 py-1 text-slate-300 outline-none"
          >
            <option value="date">Latest Detection</option>
            <option value="frp">Peak FRP</option>
            <option value="priority">Priority Score</option>
            <option value="confidence">AI Confidence</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="flex-1 bg-surface-900 border border-surface-700/80 rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-850 text-slate-400 font-mono text-[10px] uppercase tracking-wider sticky top-0 border-b border-surface-700">
              <tr>
                <th className="p-3">Event ID</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Peak FRP</th>
                <th className="p-3">Facility Context</th>
                <th className="p-3">Lifecycle</th>
                <th className="p-3">Last Detected</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800 font-mono">
              {sorted.map((ev) => {
                const isSelected = ev.id === selectedEventId;
                return (
                  <tr
                    key={ev.id}
                    onClick={() => onSelectEvent(ev.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-surface-800 text-white border-l-2 border-thermal-400'
                        : 'hover:bg-surface-850/60 text-slate-300'
                    }`}
                  >
                    <td className="p-3 font-bold text-white">
                      {ev.id}
                      {ev.requires_review && (
                        <span className="ml-1.5 px-1 py-0.2 rounded bg-danger-500/20 text-danger-400 text-[9px]">
                          REVIEW
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-sans font-medium text-slate-200 capitalize">
                        {ev.classification.replace('_', ' ')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {ev.classification_confidence}% conf · {ev.classification_method}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          ev.priority === 'critical'
                            ? 'bg-danger-500/20 text-danger-400 border border-danger-500/30'
                            : ev.priority === 'high'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : ev.priority === 'medium'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        }`}
                      >
                        {ev.priority} ({ev.priority_score})
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white">{ev.max_frp.toFixed(1)} MW</div>
                      <div className="text-[10px] text-slate-500">avg {ev.avg_frp.toFixed(1)} MW</div>
                    </td>
                    <td className="p-3">
                      {ev.nearest_facility_name ? (
                        <div>
                          <div className="text-slate-200 font-sans">{ev.nearest_facility_name}</div>
                          <div className="text-[10px] text-slate-500">
                            {ev.nearest_facility_distance_km} km · {ev.nearest_facility_type}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">None in 5km</span>
                      )}
                    </td>
                    <td className="p-3 uppercase text-[10px] text-slate-400">{ev.lifecycle}</td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {ev.last_detected.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(ev.id);
                        }}
                        className="px-2 py-1 rounded bg-surface-750 hover:bg-surface-700 text-slate-200 text-[11px]"
                      >
                        Inspect ↗
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
