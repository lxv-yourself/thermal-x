'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ThermalEvent, IndustrialFacility } from '@/types';

interface GISMapProps {
  events: ThermalEvent[];
  facilities: IndustrialFacility[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}

const GISMap: React.FC<GISMapProps> = ({
  events,
  facilities,
  selectedEventId,
  onSelectEvent,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const facilitiesLayerRef = useRef<any>(null);
  const [mapType, setMapType] = useState<'dark' | 'satellite'>('dark');
  const [showFacilities, setShowFacilities] = useState<boolean>(true);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted) return;

      if (!mapInstanceRef.current && mapContainerRef.current) {
        // Center on India / Western cluster
        const map = L.map(mapContainerRef.current, {
          center: [22.4707, 70.0577],
          zoom: 6,
          zoomControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        map.on('mousemove', (e: any) => {
          setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        });

        mapInstanceRef.current = map;
        markersLayerRef.current = L.layerGroup().addTo(map);
        facilitiesLayerRef.current = L.layerGroup().addTo(map);
      }

      // Update Basemap Tiles
      const map = mapInstanceRef.current;
      if (!map) return;

      map.eachLayer((layer: any) => {
        if (layer._url) {
          map.removeLayer(layer);
        }
      });

      if (mapType === 'dark') {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
          crossOrigin: true,
        }).addTo(map);
      } else {
        L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
            maxZoom: 18,
          }
        ).addTo(map);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [mapType]);

  // Update Markers when events or facilities change
  useEffect(() => {
    if (typeof window === 'undefined' || !mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;
      const facilitiesLayer = facilitiesLayerRef.current;
      if (!markersLayer || !facilitiesLayer) return;

      markersLayer.clearLayers();
      facilitiesLayer.clearLayers();

      // Render Facilities
      if (showFacilities) {
        facilities.forEach((fac) => {
          const facIcon = L.divIcon({
            className: 'custom-fac-icon',
            html: `<div style="
              background: #0ea5e9;
              width: 12px;
              height: 12px;
              border-radius: 2px;
              border: 1.5px solid #ffffff;
              box-shadow: 0 0 6px #0ea5e9;
            " title="${fac.name} (${fac.type})"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          });

          const marker = L.marker([fac.latitude, fac.longitude], { icon: facIcon });
          marker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
              <strong style="color: #38bdf8;">${fac.name}</strong><br/>
              <span style="color: #94a3b8;">Sector: ${fac.type.toUpperCase()}</span><br/>
              <span style="color: #94a3b8;">Region: ${fac.region || 'India'}</span>
            </div>
          `);
          facilitiesLayer.addLayer(marker);
        });
      }

      // Render Thermal Events
      events.forEach((evt) => {
        let color = '#22c55e'; // low
        let pulseClass = '';
        if (evt.priority === 'critical') {
          color = '#ef4444';
          pulseClass = 'marker-pulse-critical';
        } else if (evt.priority === 'high') {
          color = '#f97316';
        } else if (evt.priority === 'medium') {
          color = '#eab308';
        }

        const isSelected = evt.id === selectedEventId;
        const radius = Math.min(22, Math.max(8, Math.sqrt(evt.max_frp || 10) * 2.5));

        const circle = L.circleMarker([evt.centroid_lat, evt.centroid_lon], {
          radius: isSelected ? radius + 4 : radius,
          fillColor: color,
          color: isSelected ? '#ffffff' : color,
          weight: isSelected ? 3 : 1.5,
          opacity: 0.9,
          fillOpacity: isSelected ? 0.85 : 0.6,
          className: pulseClass,
        });

        circle.on('click', () => {
          onSelectEvent(evt.id);
        });

        circle.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; min-width: 180px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 700; color: ${color}; text-transform: uppercase; font-size: 11px;">
                ${evt.priority} PRIORITY
              </span>
              <span style="color: #94a3b8; font-size: 10px;">${evt.id}</span>
            </div>
            <strong style="font-size: 13px; color: #f8fafc;">
              ${evt.classification.replace(/_/g, ' ').toUpperCase()}
            </strong>
            <div style="margin-top: 6px; color: #cbd5e1; font-size: 11px;">
              <div>Max FRP: <b>${(evt.max_frp || 0).toFixed(1)} MW</b></div>
              <div>Hotspots: <b>${evt.detection_count} detections</b></div>
              <div>Nearest: <b>${evt.nearest_facility_name || 'None within radius'}</b></div>
              ${
                evt.nearest_facility_distance_km !== null
                  ? `<div>Distance: <b>${(evt.nearest_facility_distance_km * 1000).toFixed(0)}m</b></div>`
                  : ''
              }
            </div>
          </div>
        `);

        markersLayer.addLayer(circle);
      });
    });
  }, [events, facilities, selectedEventId, showFacilities, onSelectEvent]);

  // Center on selected event
  useEffect(() => {
    if (!selectedEventId || !mapInstanceRef.current) return;
    const evt = events.find((e) => e.id === selectedEventId);
    if (evt) {
      mapInstanceRef.current.flyTo([evt.centroid_lat, evt.centroid_lon], 11, {
        duration: 1.2,
      });
    }
  }, [selectedEventId, events]);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-slate-950 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Layer Controls & Map Tools */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 p-2 rounded-lg shadow-xl text-xs font-mono">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 pb-1">
          GIS Layers
        </div>
        <button
          onClick={() => setMapType(mapType === 'dark' ? 'satellite' : 'dark')}
          className="flex items-center justify-between gap-2 px-2 py-1 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 text-slate-200 transition"
        >
          <span>Basemap</span>
          <span className="text-cyan-400 capitalize">{mapType}</span>
        </button>

        <button
          onClick={() => setShowFacilities(!showFacilities)}
          className={`flex items-center justify-between gap-2 px-2 py-1 rounded border transition ${
            showFacilities
              ? 'bg-sky-950/60 border-sky-700/60 text-sky-200'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <span>Facilities</span>
          <span>{showFacilities ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* HUD Info Overlay */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-md text-[11px] font-mono text-slate-300 flex items-center gap-4 shadow-lg">
        <div>
          VISIBLE EVENTS: <span className="text-white font-bold">{events.length}</span>
        </div>
        {mouseCoords && (
          <div className="text-slate-400 border-l border-slate-800 pl-4 hidden sm:block">
            {mouseCoords.lat.toFixed(4)}°N, {mouseCoords.lng.toFixed(4)}°E
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-14 z-20 hidden md:flex items-center gap-3 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-md text-[11px] font-mono shadow-lg">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
          Critical
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
          High
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
          Medium
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          Low
        </span>
        <span className="flex items-center gap-1.5 border-l border-slate-700 pl-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block"></span>
          Facility
        </span>
      </div>
    </div>
  );
};

export default GISMap;
