'use client';

import React from 'react';
import { ThermalEvent } from '@/types';

interface EventListProps {
  events: ThermalEvent[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  isLoading: boolean;
}

const priorityConfig: Record<string, { label: string; dot: string; card: string; border: string }> = {
  critical: {
    label: 'CRITICAL',
    dot: '#ef4444',
    card: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.3)',
  },
  high: {
    label: 'HIGH',
    dot: '#f97316',
    card: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.3)',
  },
  medium: {
    label: 'MEDIUM',
    dot: '#fbbf24',
    card: 'rgba(251,191,36,0.07)',
    border: 'rgba(251,191,36,0.25)',
  },
  low: {
    label: 'LOW',
    dot: '#86efac',
    card: 'rgba(134,239,172,0.06)',
    border: 'rgba(134,239,172,0.2)',
  },
};

const classLabel: Record<string, string> = {
  industrial_fire: '🔥 Industrial Fire',
  gas_flare: '🕯 Gas Flare',
  persistent_industrial: '🏭 Persistent Ind.',
  wildfire: '🌲 Wildfire',
  agricultural_burning: '🌾 Agri. Burn',
  mining_activity: '⛏ Mining Activity',
  uncertain: '❓ Uncertain',
};

export const EventList: React.FC<EventListProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  isLoading,
}) => {
  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ background: '#0f0a06', borderRight: '1px solid #3d2c14' }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ background: '#0f0a06', borderBottom: '1px solid #3d2c14' }}
      >
        <div>
          <span className="text-sm font-bold text-amber-200 uppercase tracking-wider">
            Incident Feed
          </span>
          <span
            className="ml-2.5 text-xs font-mono px-2 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(180,83,9,0.3)', color: '#fcd34d', border: '1px solid rgba(180,83,9,0.4)' }}
          >
            {events.length}
          </span>
        </div>
        <span className="text-[11px] font-mono text-amber-800">BY URGENCY</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-amber-500"
              style={{ borderColor: '#3d2c14', borderTopColor: '#f59e0b', animation: 'spin 0.9s linear infinite' }}
            />
            <span className="text-xs font-mono text-amber-800">Loading thermal events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-6">
            <span className="text-3xl">🌡</span>
            <span className="text-sm text-amber-800 font-mono">No anomalies match filters</span>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#261a0a' }}>
            {events.map((evt) => {
              const isSelected = evt.id === selectedEventId;
              const cfg = priorityConfig[evt.priority] || priorityConfig.low;

              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt.id)}
                  className="px-5 py-4 cursor-pointer relative"
                  style={{
                    background: isSelected
                      ? 'rgba(180,83,9,0.18)'
                      : 'transparent',
                    borderLeft: isSelected
                      ? '3px solid #ea580c'
                      : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(61,44,20,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {/* Row 1 — Priority badge + FRP */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: cfg.dot,
                          ...(evt.priority === 'critical'
                            ? { boxShadow: `0 0 6px ${cfg.dot}` }
                            : {}),
                        }}
                      />
                      <span
                        className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md"
                        style={{ background: cfg.card, color: cfg.dot, border: `1px solid ${cfg.border}` }}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-[11px] font-mono text-amber-800/70">{evt.id.slice(0, 12)}…</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {(evt.max_frp || 0).toFixed(1)} MW
                    </span>
                  </div>

                  {/* Row 2 — Classification */}
                  <div className="mb-2">
                    <span
                      className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(180,83,9,0.2)', color: '#fcd34d', border: '1px solid rgba(180,83,9,0.35)' }}
                    >
                      {classLabel[evt.classification] || evt.classification.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Row 3 — Facility */}
                  <p className="text-[13px] text-amber-100/80 font-medium truncate mb-1">
                    {evt.nearest_facility_name || 'No facility identified nearby'}
                  </p>
                  {evt.nearest_facility_distance_km !== null && (
                    <p className="text-[11px] font-mono text-amber-800">
                      {(evt.nearest_facility_distance_km * 1000).toFixed(0)} m ·{' '}
                      {evt.nearest_facility_type?.replace(/_/g, ' ') || 'unknown type'}
                    </p>
                  )}

                  {/* Row 4 — Date + detections */}
                  <div
                    className="flex items-center justify-between text-[11px] font-mono text-amber-800 mt-3 pt-2.5"
                    style={{ borderTop: '1px solid #261a0a' }}
                  >
                    <span>
                      {evt.last_detected
                        ? new Date(evt.last_detected).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Active'}
                    </span>
                    <span>{evt.detection_count} detections</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
