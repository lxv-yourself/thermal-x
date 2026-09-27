'use client';

import React, { useEffect, useState } from 'react';

interface NavbarProps {
  stats: {
    totalEvents: number;
    criticalCount: number;
    highCount: number;
    avgFrp: number;
  };
  onSync: () => void;
  isSyncing: boolean;
  onOpenAnalytics: () => void;
  onOpenExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  onSync,
  isSyncing,
  onOpenAnalytics,
  onOpenExport,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="h-20 border-b border-[#3d2c14] px-6 flex items-center justify-between z-30 select-none"
      style={{ background: 'linear-gradient(to right, #0f0a06, #1a1108, #0f0a06)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-base shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #b45309 0%, #ea580c 50%, #f59e0b 100%)',
            boxShadow: '0 4px 20px rgba(234, 88, 12, 0.4)',
          }}
        >
          TX
        </div>
        <div>
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-tight text-amber-50 text-xl">THERMAL-X</span>
            <span
              className="text-[11px] uppercase font-bold px-2 py-0.5 rounded tracking-widest"
              style={{
                background: 'rgba(180, 83, 9, 0.25)',
                color: '#fcd34d',
                border: '1px solid rgba(180, 83, 9, 0.5)',
              }}
            >
              SIH26162
            </span>
          </div>
          <p className="text-[12px] text-amber-700/80 font-mono hidden sm:block mt-0.5">
            Industrial Fire & Persistent Thermal Intelligence Platform
          </p>
        </div>
      </div>

      {/* Live KPIs */}
      <div className="hidden md:flex items-center gap-3 text-[13px] font-mono">
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: '#1a1108', border: '1px solid #3d2c14' }}
        >
          <span className="text-amber-700">TRACKED</span>
          <span className="font-bold text-amber-200 text-base">{stats.totalEvents}</span>
        </div>

        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.3)' }}
        >
          <span
            className="inline-block w-2.5 h-2.5 rounded-full bg-red-500"
            style={{ animation: 'pulse 1.5s infinite' }}
          />
          <span className="text-red-400">CRITICAL</span>
          <span className="font-bold text-red-300 text-base">{stats.criticalCount}</span>
        </div>

        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: '#1a1108', border: '1px solid #3d2c14' }}
        >
          <span className="text-amber-700">AVG FRP</span>
          <span className="font-bold text-amber-400 text-base">{stats.avgFrp} MW</span>
        </div>

        <div
          className="text-amber-800 text-[11px] border-l pl-3 ml-1 leading-tight"
          style={{ borderColor: '#3d2c14' }}
        >
          {timeStr || 'SYNCHRONIZING...'}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-2 text-amber-100 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
          style={{
            background: isSyncing ? 'rgba(245,158,11,0.15)' : '#1a1108',
            border: '1px solid #3d2c14',
          }}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isSyncing ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={isSyncing ? { animation: 'spin 1s linear infinite' } : {}}
          />
          {isSyncing ? 'Ingesting FIRMS...' : 'Sync Pipeline'}
        </button>

        <button
          onClick={onOpenAnalytics}
          className="flex items-center gap-2 text-amber-100 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
          style={{ background: '#1a1108', border: '1px solid #3d2c14' }}
        >
          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Analytics
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
          style={{
            background: 'linear-gradient(135deg, #b45309, #ea580c)',
            boxShadow: '0 2px 12px rgba(234, 88, 12, 0.35)',
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export
        </button>
      </div>
    </header>
  );
};
