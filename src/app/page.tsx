'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { FilterBar } from '@/components/Filters/FilterBar';
import DynamicGISMap from '@/components/Map';
import { EventList } from '@/components/Events/EventList';
import { EventDetail } from '@/components/Events/EventDetail';
import { AnalyticsModal } from '@/components/Analytics/AnalyticsModal';
import { ExportModal } from '@/components/Export/ExportModal';
import { ThermalEvent, IndustrialFacility } from '@/types';

export default function Dashboard() {
  const [events, setEvents] = useState<ThermalEvent[]>([]);
  const [facilities, setFacilities] = useState<IndustrialFacility[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Filters state
  const [classification, setClassification] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [minFrp, setMinFrp] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Load initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [eventsRes, facilitiesRes, analyticsRes] = await Promise.all([
        fetch('/api/events?limit=200').then((r) => r.json()),
        fetch('/api/facilities').then((r) => r.json()),
        fetch('/api/analytics').then((r) => r.json()),
      ]);

      if (eventsRes.success) setEvents(eventsRes.data || []);
      if (facilitiesRes.success) setFacilities(facilitiesRes.facilities || []);
      if (analyticsRes.success) setAnalyticsData(analyticsRes.stats || null);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync FIRMS pipeline
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/firms/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter events client-side for smooth performance
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (classification && e.classification !== classification) return false;
      if (priority && e.priority !== priority) return false;
      if (minFrp > 0 && (e.max_frp || 0) < minFrp) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const facilityMatch = e.nearest_facility_name?.toLowerCase().includes(q);
        const idMatch = e.id.toLowerCase().includes(q);
        const typeMatch = e.nearest_facility_type?.toLowerCase().includes(q);
        if (!facilityMatch && !idMatch && !typeMatch) return false;
      }
      return true;
    });
  }, [events, classification, priority, minFrp, searchQuery]);

  const stats = useMemo(() => {
    const critical = events.filter((e) => e.priority === 'critical').length;
    const high = events.filter((e) => e.priority === 'high').length;
    const totalFrp = events.reduce((s, e) => s + (e.max_frp || 0), 0);
    const avgFrp = events.length > 0 ? totalFrp / events.length : 0;

    return {
      totalEvents: events.length,
      criticalCount: critical,
      highCount: high,
      avgFrp: +avgFrp.toFixed(1),
    };
  }, [events]);

  const handleResetFilters = () => {
    setClassification('');
    setPriority('');
    setMinFrp(0);
    setSearchQuery('');
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden font-sans"
      style={{ background: '#0a0702' }}
    >
      {/* Top Navigation */}
      <Navbar
        stats={stats}
        onSync={handleSync}
        isSyncing={isSyncing}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Filter Toolbar */}
      <FilterBar
        classification={classification}
        priority={priority}
        minFrp={minFrp}
        searchQuery={searchQuery}
        onClassificationChange={setClassification}
        onPriorityChange={setPriority}
        onMinFrpChange={setMinFrp}
        onSearchChange={setSearchQuery}
        onReset={handleResetFilters}
      />

      {/* Main Command Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Incident Feed — wider */}
        <div className="w-96 md:w-[420px] flex-shrink-0 h-full flex flex-col z-10">
          <EventList
            events={filteredEvents}
            selectedEventId={selectedEventId}
            onSelectEvent={(id) => setSelectedEventId(id)}
            isLoading={isLoading}
          />
        </div>

        {/* Center: Interactive GIS Map */}
        <div className="flex-1 h-full relative">
          <DynamicGISMap
            events={filteredEvents}
            facilities={facilities}
            selectedEventId={selectedEventId}
            onSelectEvent={(id) => setSelectedEventId(id)}
          />
        </div>

        {/* Right Drawer: Event Telemetry & Explainability */}
        {selectedEventId && (
          <div className="flex-shrink-0 h-full z-20" style={{ boxShadow: '-8px 0 32px rgba(0,0,0,0.6)' }}>
            <EventDetail
              eventId={selectedEventId}
              onClose={() => setSelectedEventId(null)}
              onStatusUpdated={() => fetchData()}
            />
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        stats={analyticsData}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        eventCount={events.length}
      />
    </div>
  );
}

