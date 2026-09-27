'use client';

import React, { useEffect, useState } from 'react';
import {
  ThermalEvent,
  ThermalEventFeatures,
  EventClassification,
  IndustrialFacility,
  EventStatusHistory,
  FIRMSObservation,
  EventBaseline,
  FacilityBaseline,
  ClassificationLabel,
  EventLifecycle,
} from '@/types';
import axios from 'axios';

interface EventDetailDrawerProps {
  eventId: string | null;
  onClose: () => void;
  onEventUpdated?: (updatedEvent: ThermalEvent) => void;
}

interface EventDetailPayload {
  event: ThermalEvent;
  features: ThermalEventFeatures | null;
  classification: EventClassification | null;
  facility: IndustrialFacility | null;
  timeline: EventStatusHistory[];
  observations: FIRMSObservation[];
  baseline: EventBaseline | null;
  facilityBaseline: FacilityBaseline | null;
  provenance: Array<{ source_name: string; source_type: string; url?: string }>;
  weather: {
    temperature_c: number | null;
    wind_speed_kmh: number | null;
    wind_direction_deg: number | null;
    humidity_pct: number | null;
    source: string;
  };
  imagery: {
    satellite: string;
    available: boolean;
    acquisition_date: string | null;
    cloud_cover_pct: number | null;
    resolution_meters: number;
    tile_url?: string;
    source: string;
    attribution: string;
  };
  exposure: {
    estimated_population_density: string;
    distance_to_settlement_km: number;
    nearest_critical_infra: string;
    environmental_sensitivity: string;
  };
}

export function EventDetailDrawer({
  eventId,
  onClose,
  onEventUpdated,
}: EventDetailDrawerProps) {
  const [data, setData] = useState<EventDetailPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'timeline' | 'imagery' | 'provenance' | 'review'>('overview');

  // Review Form state
  const [reviewClass, setReviewClass] = useState<ClassificationLabel>('industrial_fire');
  const [reviewLifecycle, setReviewLifecycle] = useState<EventLifecycle>('monitoring');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    if (!eventId) {
      setData(null);
      return;
    }

    setLoading(true);
    axios
      .get(`/api/events/${eventId}`)
      .then((res) => {
        if (res.data.success) {
          setData(res.data.data);
          setReviewClass(res.data.data.event.classification);
          setReviewLifecycle(res.data.data.event.lifecycle);
        }
      })
      .catch((err) => console.error('Failed to load event detail:', err))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (!eventId) return null;

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId) return;
    setSubmittingReview(true);
    try {
      const res = await axios.post(`/api/events/${eventId}/review`, {
        reviewer: 'Senior Geospatial Analyst',
        classification: reviewClass,
        lifecycle: reviewLifecycle,
        notes: reviewNotes,
      });

      if (res.data.success && onEventUpdated) {
        onEventUpdated(res.data.data);
        // Refresh local payload
        const refresh = await axios.get(`/api/events/${eventId}`);
        setData(refresh.data.data);
        setActiveTab('overview');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  }

  function handleDownloadReport() {
    if (!eventId) return;
    window.open(`/api/export?format=report&eventId=${eventId}`, '_blank');
  }

  const e = data?.event;
  const c = data?.classification;
  const f = data?.features;
  const b = data?.baseline;
  const w = data?.weather;
  const img = data?.imagery;

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-surface-900 border-l border-surface-700/80 shadow-2xl z-40 flex flex-col font-sans animate-slide-in-right">
      {/* Drawer Header */}
      <div className="p-4 border-b border-surface-700/80 bg-surface-950/60 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-bold text-white tracking-tight">
              {e ? e.id : eventId}
            </span>
            {e?.is_demo && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                DEMO
              </span>
            )}
            {e?.requires_review && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-danger-500/20 text-danger-300 font-mono font-bold border border-danger-500/30 animate-pulse">
                REVIEW REQ.
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {e ? `${e.centroid_lat.toFixed(4)}°N, ${e.centroid_lon.toFixed(4)}°E` : 'Loading coordinates...'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadReport}
            className="p-1.5 rounded bg-surface-800 hover:bg-surface-750 text-slate-300 text-xs font-mono border border-surface-700"
            title="Export Incident Report"
          >
            📄 Report
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-surface-800 hover:bg-surface-750 text-slate-400 hover:text-white border border-surface-700 text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-700/80 bg-surface-900 px-3 text-xs font-mono overflow-x-auto shrink-0">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'evidence', label: 'Evidence & AI' },
          { id: 'timeline', label: 'Timeline' },
          { id: 'imagery', label: 'Satellite' },
          { id: 'provenance', label: 'Provenance' },
          { id: 'review', label: 'Review' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-thermal-400 text-thermal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading || !data || !e ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-2">
            <span className="animate-spin text-2xl">⚡</span>
            <span className="text-xs font-mono">Fetching geospatial & baseline telemetry...</span>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs">
                {/* Classification Hero Card */}
                <div className="p-3.5 rounded-lg bg-surface-850 border border-surface-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                      CLASSIFICATION
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {e.classification_method.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-base font-bold text-white uppercase tracking-tight">
                      {e.classification.replace('_', ' ')}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-thermal-300">
                        {e.classification_confidence}%
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">CONFIDENCE</div>
                    </div>
                  </div>

                  {/* Uncertainty Banner if applicable */}
                  {c?.is_uncertain && (
                    <div className="p-2.5 rounded bg-danger-500/10 border border-danger-500/30 text-danger-300 text-[11px] leading-relaxed">
                      <div className="font-bold flex items-center space-x-1 mb-0.5">
                        <span>⚠️</span>
                        <span>HUMAN REVIEW REQUIRED</span>
                      </div>
                      {c.uncertainty_reason}
                    </div>
                  )}
                </div>

                {/* Priority & Lifecycle Stats */}
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-3 rounded-lg bg-surface-850 border border-surface-700">
                    <span className="text-[10px] text-slate-400 uppercase">PRIORITY SCORE</span>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {e.priority.toUpperCase()} ({e.priority_score})
                    </div>
                    <span className="text-[10px] text-slate-500">Operational Urgency</span>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-850 border border-surface-700">
                    <span className="text-[10px] text-slate-400 uppercase">LIFECYCLE STATUS</span>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {e.lifecycle.toUpperCase()}
                    </div>
                    <span className="text-[10px] text-slate-500">Observation Phase</span>
                  </div>
                </div>

                {/* Thermal Features Grid */}
                <div className="p-3 rounded-lg bg-surface-850 border border-surface-700 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                    THERMAL RADIATIVE CHARACTERISTICS
                  </span>
                  <div className="grid grid-cols-3 gap-2 font-mono text-center">
                    <div className="p-2 rounded bg-surface-800">
                      <div className="text-slate-400 text-[10px]">PEAK FRP</div>
                      <div className="text-sm font-bold text-white">{e.max_frp.toFixed(1)} MW</div>
                    </div>
                    <div className="p-2 rounded bg-surface-800">
                      <div className="text-slate-400 text-[10px]">MEAN FRP</div>
                      <div className="text-sm font-bold text-white">{e.avg_frp.toFixed(1)} MW</div>
                    </div>
                    <div className="p-2 rounded bg-surface-800">
                      <div className="text-slate-400 text-[10px]">FRP TREND</div>
                      <div className="text-sm font-bold text-thermal-300 uppercase">{e.frp_trend}</div>
                    </div>
                    <div className="p-2 rounded bg-surface-800">
                      <div className="text-slate-400 text-[10px]">PEAK TEMP</div>
                      <div className="text-sm font-bold text-white">{e.max_brightness.toFixed(0)} K</div>
                    </div>
                    <div className="p-2 rounded bg-surface-800">
                      <div className="text-slate-400 text-[10px]">DETECTIONS</div>
                      <div className="text-sm font-bold text-white">{e.detection_count} passes</div>
                    </div>
                    <div className="p-2 rounded bg-surface-800">
                      <div className="text-slate-400 text-[10px]">DURATION</div>
                      <div className="text-sm font-bold text-white">{e.duration_hours.toFixed(0)}h</div>
                    </div>
                  </div>
                </div>

                {/* Facility & Spatial Context */}
                <div className="p-3 rounded-lg bg-surface-850 border border-surface-700 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                    INDUSTRIAL INFRASTRUCTURE CONTEXT
                  </span>
                  {e.nearest_facility_name ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-bold">{e.nearest_facility_name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                          {e.nearest_facility_type?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-slate-400">
                        Distance:{' '}
                        <b className="text-white font-mono">
                          {e.nearest_facility_distance_km !== null
                            ? `${(e.nearest_facility_distance_km * 1000).toFixed(0)} meters`
                            : 'Unknown'}
                        </b>
                      </div>
                      <div className="text-slate-400">
                        Land Cover:{' '}
                        <b className="text-white capitalize">{e.land_cover.replace('_', ' ')}</b> (
                        {e.land_cover_source})
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      No registered industrial facilities located within 5 km.
                      <div className="mt-1">
                        Land Cover:{' '}
                        <b className="text-white capitalize">{e.land_cover.replace('_', ' ')}</b>
                      </div>
                    </div>
                  )}
                </div>

                {/* Historical Baseline Deviation */}
                <div className="p-3 rounded-lg bg-surface-850 border border-surface-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                      FACILITY THERMAL BASELINE
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                        e.baseline_status === 'abnormal'
                          ? 'bg-danger-500/20 text-danger-300 border border-danger-500/30'
                          : e.baseline_status === 'elevated'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {e.baseline_status}
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Historical Baseline FRP:</span>
                      <span className="text-slate-200">
                        {b?.historical_avg_frp ? `${b.historical_avg_frp} MW` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Observed Anomaly Deviation:</span>
                      <span className="text-thermal-300 font-bold">
                        {b?.deviation_score !== null ? `+${b?.deviation_score}%` : 'Insufficient History'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Weather Context (Open-Meteo) */}
                {w && (
                  <div className="p-3 rounded-lg bg-surface-850 border border-surface-700 space-y-2 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                        METEOROLOGICAL CONDITIONS (OPEN-METEO)
                      </span>
                      <span className="text-[10px] text-slate-500">FREE OPEN API</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="p-1.5 bg-surface-800 rounded">
                        <div className="text-slate-400 text-[10px]">TEMP</div>
                        <div className="text-white font-bold">{w.temperature_c ?? '--'} °C</div>
                      </div>
                      <div className="p-1.5 bg-surface-800 rounded">
                        <div className="text-slate-400 text-[10px]">WIND</div>
                        <div className="text-white font-bold">{w.wind_speed_kmh ?? '--'} km/h</div>
                      </div>
                      <div className="p-1.5 bg-surface-800 rounded">
                        <div className="text-slate-400 text-[10px]">HUMIDITY</div>
                        <div className="text-white font-bold">{w.humidity_pct ?? '--'}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: EVIDENCE & AI EXPLAINABILITY */}
            {activeTab === 'evidence' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-850 border border-surface-700 space-y-1">
                  <div className="font-bold text-white font-mono text-sm">
                    Explainable AI Decision Audit
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Every classification is derived through deterministic geospatial, thermal, and
                    temporal evidence without fabricated model scores.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                    SUPPORTING EVIDENCE PILLARS ({c?.evidence?.length || 0})
                  </span>
                  {c?.evidence?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface-850 border border-surface-700 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{item.factor}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-thermal-500/20 text-thermal-300 border border-thermal-500/30">
                          Weight: {(item.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] font-mono leading-relaxed">
                        {item.value}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.supports.map((s) => (
                          <span
                            key={s}
                            className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-800 text-slate-400 border border-surface-700"
                          >
                            +{s.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="space-y-3 text-xs font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  EVENT PROGRESSION AUDIT TRAIL
                </span>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-700">
                  {data.timeline.map((item, i) => (
                    <div key={item.id || i} className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-thermal-400 border-2 border-surface-900"></div>
                      <div className="p-2.5 rounded bg-surface-850 border border-surface-700">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="text-thermal-300 font-bold uppercase">{item.new_status}</span>
                          <span>{item.changed_at.slice(0, 16).replace('T', ' ')} UTC</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{item.reason}</p>
                        {item.changed_by && (
                          <div className="text-[10px] text-slate-500 mt-1">
                            Triggered by: {item.changed_by}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: SATELLITE IMAGERY */}
            {activeTab === 'imagery' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-850 border border-surface-700 space-y-2">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-white">{img?.satellite} Surface Imagery</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      AVAILABLE
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Orthorectified Sentinel-2 Cloudless composite at 20-meter resolution for optical
                    cross-verification.
                  </p>

                  <div className="relative rounded border border-surface-700 overflow-hidden bg-black aspect-video flex items-center justify-center">
                    {img?.tile_url ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-surface-800 p-4 text-center">
                        <span className="text-3xl mb-2">🛰️</span>
                        <span className="font-mono text-slate-200 text-xs font-bold">
                          Sentinel-2 MSI Orthorectified Composite
                        </span>
                        <span className="font-mono text-slate-500 text-[10px] mt-1">
                          Center: {e.centroid_lat.toFixed(4)}°N, {e.centroid_lon.toFixed(4)}°E
                        </span>
                        <span className="font-mono text-emerald-400 text-[10px] mt-0.5">
                          Cloud Cover: {img.cloud_cover_pct}% · Resolution: {img.resolution_meters}m
                        </span>
                      </div>
                    ) : (
                      <div className="text-slate-500 font-mono text-[11px]">
                        Satellite tile unavailable for current coordinates.
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono">
                    Attribution: {img?.attribution}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: DATA PROVENANCE */}
            {activeTab === 'provenance' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-850 border border-surface-700 space-y-1">
                  <div className="font-bold text-white font-mono text-sm">Data Provenance Matrix</div>
                  <p className="text-slate-400 text-[11px]">
                    Traceability guarantees for all input streams used in calculating this thermal event.
                  </p>
                </div>

                <div className="space-y-2">
                  {data.provenance.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded bg-surface-850 border border-surface-700 space-y-1 font-mono"
                    >
                      <div className="flex items-center justify-between text-slate-200 font-bold">
                        <span>{p.source_name}</span>
                        {p.url && (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-thermal-300 hover:underline"
                          >
                            Source Link ↗
                          </a>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{p.source_type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: OPERATOR REVIEW & CLASSIFICATION OVERRIDE */}
            {activeTab === 'review' && (
              <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-850 border border-surface-700 space-y-1">
                  <div className="font-bold text-white font-mono">Operator Validation & Review</div>
                  <p className="text-slate-400 text-[11px]">
                    Override automated classification or lifecycle status based on ground-truth inspection.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono text-[11px]">
                    VERIFIED CLASSIFICATION
                  </label>
                  <select
                    value={reviewClass}
                    onChange={(e) => setReviewClass(e.target.value as ClassificationLabel)}
                    className="w-full p-2 bg-surface-850 border border-surface-700 rounded text-slate-200 text-xs focus:border-thermal-400 outline-none"
                  >
                    <option value="industrial_fire">Industrial Fire</option>
                    <option value="persistent_industrial">Persistent Industrial Thermal Source</option>
                    <option value="gas_flare">Gas Flare</option>
                    <option value="wildfire">Wildfire / Forest Fire</option>
                    <option value="agricultural_burning">Agricultural Burning</option>
                    <option value="mining_activity">Mining-related Thermal Activity</option>
                    <option value="uncertain">Uncertain / Human Review Required</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono text-[11px]">
                    LIFECYCLE STATUS
                  </label>
                  <select
                    value={reviewLifecycle}
                    onChange={(e) => setReviewLifecycle(e.target.value as EventLifecycle)}
                    className="w-full p-2 bg-surface-850 border border-surface-700 rounded text-slate-200 text-xs focus:border-thermal-400 outline-none"
                  >
                    <option value="detected">Detected</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="persistent">Persistent</option>
                    <option value="abnormal">Abnormal / Escalating</option>
                    <option value="resolved">Resolved / Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono text-[11px]">
                    OPERATOR JUSTIFICATION & NOTES
                  </label>
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter observation notes, verified telemetry, or operational dispatch confirmation..."
                    className="w-full p-2 bg-surface-850 border border-surface-700 rounded text-slate-200 text-xs focus:border-thermal-400 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2 px-4 rounded bg-thermal-500 hover:bg-thermal-400 text-surface-950 font-bold font-mono transition-colors disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting Review...' : 'Commit Operator Verification'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
