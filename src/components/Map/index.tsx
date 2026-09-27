'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const DynamicGISMap = dynamic(() => import('./GISMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500 font-mono text-xs">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin mb-3"></div>
      INITIALIZING GEOSPATIAL ENGINE...
    </div>
  ),
});

export default DynamicGISMap;
