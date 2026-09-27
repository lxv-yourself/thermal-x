'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ValidationData {
  dataset_configured: boolean;
  status_message: string;
  methodology_note: string;
  evaluation_criteria: Array<{
    dimension: string;
    target_metric: string;
    status: string;
  }>;
  false_positive_analysis: Array<{
    pair: string;
    challenge: string;
    thermal_x_mitigation: string;
    risk_level: string;
  }>;
}

export function ValidationView() {
  const [data, setData] = useState<ValidationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    axios
      .get('/api/validation')
      .then((res) => {
        if (res.data.success) {
          setData(res.data.data);
        }
      })
      .catch((err) => console.error('Failed to load validation:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
        Loading validation architecture and false positive analysis...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-5 overflow-y-auto font-sans">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight font-mono">
          Model Validation & False Positive Analysis
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Scientific integrity framework, uncertainty disclosure, and operational edge-case mitigation (SIH26162)
        </p>
      </div>

      {/* Scientific Honesty Notice Banner */}
      <div className="p-4 rounded-lg bg-surface-900 border-l-4 border-l-amber-500 border border-surface-700/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 font-bold font-mono text-xs uppercase tracking-wider">
              SCIENTIFIC INTEGRITY DISCLOSURE
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              VALIDATION DATASET NOT CONFIGURED
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">ZERO METRIC FABRICATION</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-mono">
          {data.status_message}
        </p>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {data.methodology_note}
        </p>
      </div>

      {/* Benchmark Criteria */}
      <div className="p-5 rounded-lg bg-surface-900 border border-surface-700/80 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-surface-700 pb-2">
          <span className="font-bold text-slate-200 uppercase tracking-wider">
            ANALYTICAL BASELINE VALIDATION CRITERIA
          </span>
          <span className="text-[10px] text-emerald-400">4 / 4 CRITERIA ACTIVE</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {data.evaluation_criteria.map((item, idx) => (
            <div key={idx} className="p-3 rounded bg-surface-850 border border-surface-750 space-y-1">
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span>{item.dimension}</span>
                <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{item.target_metric}</p>
            </div>
          ))}
        </div>
      </div>

      {/* False Positive Analysis Section */}
      <div className="p-5 rounded-lg bg-surface-900 border border-surface-700/80 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-surface-700 pb-2">
          <span className="font-bold text-slate-200 uppercase tracking-wider">
            FALSE POSITIVE MITIGATION ANALYSIS
          </span>
          <span className="text-[10px] text-slate-500">OPERATIONAL CONFLICT RESOLUTION</span>
        </div>

        <div className="space-y-3">
          {data.false_positive_analysis.map((fp, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-surface-850 border border-surface-750 space-y-2 font-mono text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{fp.pair}</span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    fp.risk_level === 'Critical'
                      ? 'bg-danger-500/20 text-danger-400 border border-danger-500/30'
                      : fp.risk_level === 'High'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  Ambiguity Risk: {fp.risk_level}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] font-bold">Inherent Confusion: </span>
                <span className="text-slate-300 text-[11px] font-sans">{fp.challenge}</span>
              </div>

              <div className="p-2.5 rounded bg-surface-800 border border-surface-700 text-[11px]">
                <span className="text-thermal-300 font-bold">Thermal-X Mitigation: </span>
                <span className="text-slate-300 font-sans">{fp.thermal_x_mitigation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
