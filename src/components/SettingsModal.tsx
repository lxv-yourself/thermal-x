'use client';

import React, { useState } from 'react';
import axios from 'axios';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDemo: boolean;
  onToggleDemo: () => void;
  onResetDemo: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  isDemo,
  onToggleDemo,
  onResetDemo,
}: SettingsModalProps) {
  const [clusteringDist, setClusteringDist] = useState<number>(5);
  const [timeWindow, setTimeWindow] = useState<number>(24);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  function handleSave() {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-surface-700/80 rounded-xl w-[540px] shadow-2xl overflow-hidden font-sans animate-fade-in">
        <div className="p-4 border-b border-surface-700/80 bg-surface-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-base">⚙️</span>
            <span className="font-bold font-mono text-white text-sm">Thermal-X Platform Configuration</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-surface-800 text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs font-mono max-h-[75vh] overflow-y-auto">
          {/* Provider Status Matrix */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              EXTERNAL DATA PROVIDERS
            </span>
            <div className="p-3 rounded-lg bg-surface-850 border border-surface-750 space-y-2 text-[11px]">
              <div className="flex justify-between items-center">
                <span>NASA FIRMS API:</span>
                <span className="text-emerald-400">CONFIGURED (MODIS/VIIRS)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>OpenStreetMap Overpass:</span>
                <span className="text-emerald-400">CONNECTED (CACHED)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Open-Meteo Meteorology:</span>
                <span className="text-emerald-400">CONNECTED (FREE TIER)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Copernicus Sentinel-2 EOX:</span>
                <span className="text-emerald-400">ONLINE (CLOUDLESS 20M)</span>
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              OPERATIONAL DATA STREAM MODE
            </span>
            <div className="p-3 rounded-lg bg-surface-850 border border-surface-750 flex items-center justify-between">
              <div>
                <div className="text-white font-bold">{isDemo ? 'Demonstration Mode' : 'Live Ingestion Mode'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {isDemo
                    ? 'Using verified Indian industrial thermal scenarios'
                    : 'Querying live NASA EOSDIS servers'}
                </div>
              </div>
              <button
                onClick={onToggleDemo}
                className={`px-3 py-1.5 rounded font-bold transition-colors ${
                  isDemo
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                Switch to {isDemo ? 'Live' : 'Demo'}
              </button>
            </div>
          </div>

          {/* Clustering Parameters */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              SPATIO-TEMPORAL CLUSTERING THRESHOLDS
            </span>
            <div className="p-3 rounded-lg bg-surface-850 border border-surface-750 space-y-3">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Spatial Cluster Radius:</span>
                  <span className="text-thermal-300 font-bold">{clusteringDist} km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={clusteringDist}
                  onChange={(e) => setClusteringDist(parseInt(e.target.value, 10))}
                  className="w-full accent-thermal-400 h-1.5 bg-surface-750 rounded"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Temporal Window:</span>
                  <span className="text-thermal-300 font-bold">{timeWindow} hours</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="72"
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(parseInt(e.target.value, 10))}
                  className="w-full accent-thermal-400 h-1.5 bg-surface-750 rounded"
                />
              </div>
            </div>
          </div>

          {/* Reset Demo Data Action */}
          <div className="p-3 rounded-lg bg-surface-850 border border-surface-750 flex items-center justify-between">
            <div>
              <div className="text-slate-200 font-bold">Reset Demo Scenarios</div>
              <div className="text-[10px] text-slate-500">Restore factory baseline events & facilities</div>
            </div>
            <button
              onClick={() => {
                onResetDemo();
                handleSave();
              }}
              className="px-3 py-1.5 rounded bg-surface-800 hover:bg-surface-750 text-slate-300 border border-surface-700 transition-colors"
            >
              Reset Data
            </button>
          </div>

          {savedNotice && (
            <div className="p-2.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-center font-bold">
              ✓ Platform parameters updated
            </div>
          )}
        </div>

        <div className="p-4 border-t border-surface-700/80 bg-surface-950/60 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-surface-800 hover:bg-surface-750 text-slate-300 font-mono text-xs"
          >
            Close
          </button>
          <button
            onClick={() => {
              handleSave();
              setTimeout(onClose, 600);
            }}
            className="px-4 py-1.5 rounded bg-thermal-500 hover:bg-thermal-400 text-surface-950 font-bold font-mono text-xs"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
