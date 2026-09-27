'use client';

import React from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventCount: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  eventCount,
}) => {
  if (!isOpen) return null;

  const handleDownload = (format: 'geojson' | 'csv') => {
    window.open(`/api/export?format=${format}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
            <h2 className="font-bold text-white text-sm">Export Thermal-X Intelligence Data</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs font-sans">
          <p className="text-slate-300">
            Export <strong className="text-white font-mono">{eventCount} active events</strong> with
            calculated FRP metrics, infrastructure proximity, classification labels, and geographic
            coordinates.
          </p>

          <div className="space-y-3">
            {/* GeoJSON Option */}
            <div
              onClick={() => handleDownload('geojson')}
              className="p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-lg cursor-pointer transition flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-white">GeoJSON FeatureCollection</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Compatible with QGIS, ArcGIS, Mapbox, and Leaflet
                </div>
              </div>
              <span className="text-cyan-400 font-mono text-xs font-bold">.geojson →</span>
            </div>

            {/* CSV Option */}
            <div
              onClick={() => handleDownload('csv')}
              className="p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-orange-500/50 rounded-lg cursor-pointer transition flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-white">Tabular CSV Report</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Full attribute table for Excel, Pandas, and reporting
                </div>
              </div>
              <span className="text-orange-400 font-mono text-xs font-bold">.csv →</span>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
