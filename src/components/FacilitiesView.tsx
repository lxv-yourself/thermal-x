'use client';

import React, { useState } from 'react';
import { IndustrialFacility, FacilityType, ThermalEvent } from '@/types';

interface FacilitiesViewProps {
  facilities: IndustrialFacility[];
  events: ThermalEvent[];
  onSelectEvent: (id: string) => void;
}

export function FacilitiesView({ facilities, events, onSelectEvent }: FacilitiesViewProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(facilities[0]?.id || null);

  const filtered = facilities.filter((f) => {
    if (filterType !== 'all' && f.type !== filterType) return false;
    return true;
  });

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId) || facilities[0];
  const relatedEvents = selectedFacility
    ? events.filter((e) => e.nearest_facility_id === selectedFacility.id)
    : [];

  return (
    <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight font-mono">
          Industrial Facilities & Thermal Baselines
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          90-day moving window baseline monitoring for refineries, power stations, steel complexes, and mining zones
        </p>
      </div>

      <div className="flex items-center space-x-3 bg-surface-900 border border-surface-700/80 p-3 rounded-lg text-xs font-mono">
        <span className="text-slate-500">Filter by Industry:</span>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-surface-800 border border-surface-700 rounded px-2.5 py-1 text-slate-200 outline-none"
        >
          <option value="all">All Sectors</option>
          <option value="refinery">Refinery</option>
          <option value="thermal_power">Thermal Power Plant</option>
          <option value="steel">Steel & Metallurgical</option>
          <option value="petrochemical">Petrochemical & Gas</option>
          <option value="mining">Mining & Extraction</option>
        </select>
        <span className="text-slate-500 ml-auto">
          Showing {filtered.length} of {facilities.length} monitored facilities
        </span>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Facilities List (5 cols) */}
        <div className="col-span-5 bg-surface-900 border border-surface-700/80 rounded-lg overflow-y-auto divide-y divide-surface-800">
          {filtered.map((fac) => {
            const isSelected = fac.id === selectedFacility?.id;
            const facEvents = events.filter((e) => e.nearest_facility_id === fac.id);
            const hasAbnormal = facEvents.some((e) => e.lifecycle === 'abnormal' || e.priority === 'critical');

            return (
              <div
                key={fac.id}
                onClick={() => setSelectedFacilityId(fac.id)}
                className={`p-3.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-surface-800 border-l-4 border-thermal-400'
                    : 'hover:bg-surface-850/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200 text-xs font-mono">{fac.name}</span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-750 text-indigo-300 border border-surface-700">
                    {fac.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2">
                  <span>
                    {fac.latitude.toFixed(3)}°N, {fac.longitude.toFixed(3)}°E
                  </span>
                  <span className={hasAbnormal ? 'text-danger-400 font-bold' : 'text-emerald-400'}>
                    {hasAbnormal ? '⚠️ ELEVATED ACTIVITY' : 'NORMAL BASELINE'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Facility Baseline Dashboard (7 cols) */}
        <div className="col-span-7 bg-surface-900 border border-surface-700/80 rounded-lg p-5 overflow-y-auto space-y-5">
          {selectedFacility ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white font-mono">
                    {selectedFacility.name}
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                    {selectedFacility.type.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedFacility.description}</p>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  Region: {selectedFacility.region || 'India'} · Source: {selectedFacility.source.toUpperCase()}
                </div>
              </div>

              {/* Thermal Baseline Gauges */}
              <div className="p-4 rounded-lg bg-surface-850 border border-surface-700 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">FACILITY THERMAL BASELINE</span>
                  <span className="text-[10px] text-slate-500">90-DAY WINDOW</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Normal Baseline Activity</span>
                      <span className="text-emerald-400">54.2 MW Avg FRP</span>
                    </div>
                    <div className="w-full h-2 rounded bg-surface-800 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Current Observed Activity</span>
                      <span className="text-thermal-300">
                        {relatedEvents[0] ? `${relatedEvents[0].avg_frp.toFixed(1)} MW` : 'No Active Events'}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded bg-surface-800 overflow-hidden">
                      <div
                        className="h-full bg-thermal-400"
                        style={{
                          width: `${Math.min(100, (relatedEvents[0]?.avg_frp || 20) / 1.5)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-surface-750 flex items-center justify-between">
                    <span className="text-slate-400">Baseline Deviation:</span>
                    <span
                      className={`font-bold ${
                        relatedEvents[0]?.baseline_status === 'abnormal'
                          ? 'text-danger-400'
                          : relatedEvents[0]?.baseline_status === 'elevated'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {relatedEvents[0]?.baseline_deviation
                        ? `+${relatedEvents[0].baseline_deviation}% (${relatedEvents[0].baseline_status.toUpperCase()})`
                        : 'WITHIN NORMAL ENVELOPE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Related Events Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
                  HOTSPOT EVENTS WITHIN BUFFER ({relatedEvents.length})
                </span>
                {relatedEvents.length === 0 ? (
                  <div className="p-4 rounded bg-surface-850 border border-surface-700 text-xs text-slate-500 text-center font-mono">
                    No active thermal events currently clustered within facility perimeter.
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-xs">
                    {relatedEvents.map((re) => (
                      <div
                        key={re.id}
                        onClick={() => onSelectEvent(re.id)}
                        className="p-3 rounded bg-surface-850 border border-surface-700 hover:border-thermal-400 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white uppercase">
                            {re.classification.replace('_', ' ')}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            FRP: {re.max_frp.toFixed(1)} MW · Distance: {re.nearest_facility_distance_km} km
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            re.priority === 'critical'
                              ? 'bg-danger-500/20 text-danger-400'
                              : 'bg-thermal-500/20 text-thermal-300'
                          }`}
                        >
                          {re.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">
              Select a facility to inspect thermal baseline telemetry
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
