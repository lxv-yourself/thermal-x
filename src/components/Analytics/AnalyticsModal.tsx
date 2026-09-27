'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: any;
}

const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#a855f7', '#64748b'];

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  if (!isOpen || !stats) return null;

  const classificationData = Object.entries(stats.classificationCounts || {}).map(
    ([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value,
    })
  );

  const priorityData = Object.entries(stats.priorityCounts || {}).map(([name, value]) => ({
    name: name.toUpperCase(),
    value,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <h2 className="font-bold text-white text-base font-sans">
              Thermal-X Operational Analytics & System Telemetry
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400">TRACKED CLUSTERS</span>
              <div className="text-xl font-bold text-white mt-1">{stats.totalEvents}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400">CRITICAL ANOMALIES</span>
              <div className="text-xl font-bold text-rose-400 mt-1">{stats.criticalCount}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400">MEAN FRP POWER</span>
              <div className="text-xl font-bold text-amber-400 mt-1">{stats.avgFrp} MW</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400">MONITORED SITES</span>
              <div className="text-xl font-bold text-sky-400 mt-1">{stats.totalFacilities}</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Classification Breakdown */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-xs font-mono font-semibold text-slate-300 block mb-3 uppercase">
                Source Classification Distribution
              </span>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classificationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name }) => name}
                      fontSize={10}
                    >
                      {classificationData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority Urgency Breakdown */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-xs font-mono font-semibold text-slate-300 block mb-3 uppercase">
                Priority Tier Breakdown
              </span>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="value" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
            <strong>Geospatial Engine:</strong> Multi-sensor VIIRS (375m) & MODIS (1km) integration,
            DBSCAN spatio-temporal radius clustering, Overpass infrastructure mapping, and
            transparent explainable classification.
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
