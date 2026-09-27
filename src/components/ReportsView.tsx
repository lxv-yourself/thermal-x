'use client';

import React, { useState } from 'react';
import { ThermalEvent } from '@/types';
import axios from 'axios';

interface ReportsViewProps {
  events: ThermalEvent[];
  selectedEventId: string | null;
}

export function ReportsView({ events, selectedEventId }: ReportsViewProps) {
  const [activeEventId, setActiveEventId] = useState<string>(selectedEventId || events[0]?.id || '');
  const [reportText, setReportText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  React.useEffect(() => {
    if (!activeEventId) return;
    setLoading(true);
    axios
      .get(`/api/export?format=report&eventId=${activeEventId}`)
      .then((res) => {
        setReportText(typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2));
      })
      .catch((err) => {
        console.error('Failed to generate report:', err);
        setReportText('Failed to generate report for selected event.');
      })
      .finally(() => setLoading(false));
  }, [activeEventId]);

  function handleDownload() {
    if (!activeEventId) return;
    window.open(`/api/export?format=report&eventId=${activeEventId}`, '_blank');
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-mono">
            Incident Reports Generator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Standardized analytical dossiers for emergency dispatch and environmental compliance
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded bg-surface-850 hover:bg-surface-800 text-slate-300 text-xs font-mono border border-surface-700 transition-colors"
          >
            🖨️ Print Report
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded bg-thermal-500 hover:bg-thermal-400 text-surface-950 font-bold text-xs font-mono transition-colors"
          >
            💾 Download Text File
          </button>
        </div>
      </div>

      {/* Event Selector */}
      <div className="flex items-center space-x-3 bg-surface-900 border border-surface-700/80 p-3 rounded-lg text-xs font-mono">
        <span className="text-slate-500">Select Event:</span>
        <select
          value={activeEventId}
          onChange={(e) => setActiveEventId(e.target.value)}
          className="bg-surface-800 border border-surface-700 rounded px-2.5 py-1 text-slate-200 outline-none w-96"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.id} — {ev.classification.replace('_', ' ').toUpperCase()} (FRP: {ev.max_frp.toFixed(1)} MW)
            </option>
          ))}
        </select>
      </div>

      {/* Report Preview */}
      <div className="flex-1 bg-surface-950 border border-surface-700/80 rounded-lg p-6 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed shadow-inner">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            Synthesizing incident dossier...
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-slate-300">{reportText}</pre>
        )}
      </div>
    </div>
  );
}
