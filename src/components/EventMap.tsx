'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ThermalEvent, IndustrialFacility, FIRMSObservation } from '@/types';

interface EventMapProps {
  events: ThermalEvent[];
  facilities: IndustrialFacility[];
  observations?: FIRMSObservation[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  onSelectFacility?: (facilityId: string) => void;
}

export function EventMap({
  events,
  facilities,
  observations = [],
  selectedEventId,
  onSelectEvent,
  onSelectFacility,
}: EventMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{
    eventMarkers: any[];
    facilityMarkers: any[];
    hotspotMarkers: any[];
    sentinelLayer: any;
  }>({
    eventMarkers: [],
    facilityMarkers: [],
    hotspotMarkers: [],
    sentinelLayer: null,
  });

  const [showHotspots, setShowHotspots] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showSentinel, setShowSentinel] = useState(false);
  const [timeFilterDays, setTimeFilterDays] = useState<number>(30);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let L: any;
    if (typeof window !== 'undefined') {
      L = (window as any).L;
    }

    if (!L) {
      // Dynamic import of leaflet
      import('leaflet').then((leafletModule) => {
        L = leafletModule.default;
        initMap(L);
      });
    } else {
      initMap(L);
    }

    function initMap(Leaflet: any) {
      if (mapInstanceRef.current) return;

      // Center map around India (SIH context)
      const map = Leaflet.map(mapContainerRef.current, {
        center: [23.5937, 78.9629],
        zoom: 5,
        zoomControl: false,
        attributionControl: false,
      });

      // Free CartoDB Dark Matter tiles (no API key required)
      Leaflet.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
        }
      ).addTo(map);

      // Attribution control bottom right
      Leaflet.control
        .attribution({ position: 'bottomright', prefix: false })
        .addAttribution('&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a> | NASA FIRMS')
        .addTo(map);

      // Zoom control top right
      Leaflet.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
      renderLayers(Leaflet);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Layers when data or toggles change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const L = (window as any).L || require('leaflet');
    renderLayers(L);
  }, [events, facilities, observations, selectedEventId, showHotspots, showFacilities, showSentinel, timeFilterDays]);

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical':
        return '#e03030';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#facc15';
      case 'low':
      default:
        return '#38bdf8';
    }
  }

  function renderLayers(L: any) {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous event and facility markers
    layersRef.current.eventMarkers.forEach((m) => m.remove());
    layersRef.current.facilityMarkers.forEach((m) => m.remove());
    layersRef.current.hotspotMarkers.forEach((m) => m.remove());
    layersRef.current.eventMarkers = [];
    layersRef.current.facilityMarkers = [];
    layersRef.current.hotspotMarkers = [];

    // Sentinel-2 Overlay Toggle
    if (showSentinel) {
      if (!layersRef.current.sentinelLayer) {
        // Free Sentinel-2 cloudless layer from EOX
        layersRef.current.sentinelLayer = L.tileLayer(
          'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg',
          { opacity: 0.65, maxZoom: 14 }
        ).addTo(map);
      }
    } else {
      if (layersRef.current.sentinelLayer) {
        layersRef.current.sentinelLayer.remove();
        layersRef.current.sentinelLayer = null;
      }
    }

    // Filter events by time range
    const now = new Date('2024-09-21T00:00:00Z').getTime(); // Reference point for demo
    const filteredEvents = events.filter((e) => {
      const eventTime = new Date(e.last_detected).getTime();
      const diffDays = (now - eventTime) / (1000 * 60 * 60 * 24);
      return diffDays <= timeFilterDays;
    });

    // 1. Render Facilities
    if (showFacilities) {
      facilities.forEach((fac) => {
        const marker = L.circleMarker([fac.latitude, fac.longitude], {
          radius: 6,
          fillColor: '#6366f1',
          fillOpacity: 0.8,
          color: '#ffffff',
          weight: 1.5,
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #e2e8f0;">
            <div style="font-weight: 700; color: #818cf8; margin-bottom: 2px;">${fac.name}</div>
            <div style="color: #94a3b8; font-size: 11px;">Type: <span style="text-transform: capitalize; color: #cbd5e1;">${fac.type.replace('_', ' ')}</span></div>
            <div style="color: #94a3b8; font-size: 11px;">Source: ${fac.source.toUpperCase()}</div>
          </div>
        `);

        marker.on('click', () => {
          if (onSelectFacility) onSelectFacility(fac.id);
        });

        layersRef.current.facilityMarkers.push(marker);
      });
    }

    // 2. Render FIRMS Hotspot observations (if toggled)
    if (showHotspots && observations.length > 0) {
      observations.slice(0, 300).forEach((obs) => {
        const marker = L.circleMarker([obs.latitude, obs.longitude], {
          radius: 3,
          fillColor: '#f59e0b',
          fillOpacity: 0.4,
          color: '#d97706',
          weight: 0.5,
        }).addTo(map);

        layersRef.current.hotspotMarkers.push(marker);
      });
    }

    // 3. Render Thermal Events
    filteredEvents.forEach((ev) => {
      const isSelected = ev.id === selectedEventId;
      const color = getPriorityColor(ev.priority);
      const radius = Math.min(22, Math.max(9, Math.sqrt(ev.max_frp) * 1.2));

      // Outer glow/pulse for critical
      if (ev.priority === 'critical') {
        const pulse = L.circleMarker([ev.centroid_lat, ev.centroid_lon], {
          radius: radius + 8,
          fillColor: color,
          fillOpacity: 0.2,
          color: color,
          weight: 1,
          dashArray: '3, 3',
        }).addTo(map);
        layersRef.current.eventMarkers.push(pulse);
      }

      const marker = L.circleMarker([ev.centroid_lat, ev.centroid_lon], {
        radius: isSelected ? radius + 4 : radius,
        fillColor: color,
        fillOpacity: isSelected ? 0.95 : 0.85,
        color: isSelected ? '#ffffff' : color,
        weight: isSelected ? 3 : 1.5,
      }).addTo(map);

      marker.bindTooltip(`
        <div style="font-family: inherit; font-size: 11px; padding: 2px;">
          <div style="font-weight: 700; color: ${color}; text-transform: uppercase;">${ev.classification.replace('_', ' ')}</div>
          <div style="color: #cbd5e1;">Max FRP: <b>${ev.max_frp.toFixed(1)} MW</b></div>
          <div style="color: #94a3b8; font-size: 10px;">Status: ${ev.lifecycle} · Priority: ${ev.priority.toUpperCase()}</div>
        </div>
      `, { permanent: false, direction: 'top' });

      marker.on('click', () => {
        onSelectEvent(ev.id);
      });

      layersRef.current.eventMarkers.push(marker);
    });

    // If an event is selected, smoothly pan to it
    if (selectedEventId) {
      const sel = events.find((e) => e.id === selectedEventId);
      if (sel) {
        map.flyTo([sel.centroid_lat, sel.centroid_lon], Math.max(map.getZoom(), 8), {
          duration: 0.8,
        });
      }
    }
  }

  return (
    <div className="relative w-full h-full bg-surface-950 overflow-hidden">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Control Bar - Floating Top Left */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col space-y-2 pointer-events-auto">
        <div className="bg-surface-900/90 backdrop-blur-md border border-surface-700/80 rounded-lg p-3 shadow-xl space-y-2.5 w-64 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-surface-700/70 pb-1.5">
            <span className="font-bold text-slate-200 tracking-wider">GIS LAYERS</span>
            <span className="text-[10px] text-thermal-400">LEAFLET NATIVE</span>
          </div>

          <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-thermal-400"></span>
              <span>Thermal Events ({events.length})</span>
            </span>
            <input type="checkbox" checked={true} readOnly className="accent-thermal-400 rounded" />
          </label>

          <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              <span>Industrial Facilities ({facilities.length})</span>
            </span>
            <input
              type="checkbox"
              checked={showFacilities}
              onChange={(e) => setShowFacilities(e.target.checked)}
              className="accent-indigo-400 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>FIRMS Raw Hotspots</span>
            </span>
            <input
              type="checkbox"
              checked={showHotspots}
              onChange={(e) => setShowHotspots(e.target.checked)}
              className="accent-amber-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Sentinel-2 WMS Layer</span>
            </span>
            <input
              type="checkbox"
              checked={showSentinel}
              onChange={(e) => setShowSentinel(e.target.checked)}
              className="accent-emerald-400 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Time Window Slider */}
        <div className="bg-surface-900/90 backdrop-blur-md border border-surface-700/80 rounded-lg p-3 shadow-xl w-64 text-xs font-mono">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400">TIME WINDOW</span>
            <span className="text-thermal-300 font-bold">{timeFilterDays} DAYS</span>
          </div>
          <input
            type="range"
            min="1"
            max="60"
            value={timeFilterDays}
            onChange={(e) => setTimeFilterDays(parseInt(e.target.value, 10))}
            className="w-full accent-thermal-400 cursor-pointer h-1.5 bg-surface-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>24h</span>
            <span>7d</span>
            <span>30d</span>
            <span>60d</span>
          </div>
        </div>
      </div>

      {/* Priority Legend - Bottom Left */}
      <div className="absolute bottom-4 left-4 z-[400] bg-surface-900/90 backdrop-blur-md border border-surface-700/80 rounded-lg p-3 shadow-xl text-[11px] font-mono pointer-events-auto">
        <div className="font-bold text-slate-300 mb-2 tracking-wider text-[10px] uppercase">
          PRIORITY SEVERITY
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-danger-500 border border-white/40"></span>
            <span className="text-slate-300">Critical (&gt;80)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 border border-white/40"></span>
            <span className="text-slate-300">High (60-80)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400 border border-white/40"></span>
            <span className="text-slate-300">Medium (35-60)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-sky-400 border border-white/40"></span>
            <span className="text-slate-300">Low (&lt;35)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
