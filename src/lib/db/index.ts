import fs from 'fs';
import path from 'path';
import {
  FIRMSObservation,
  ThermalEvent,
  IndustrialFacility,
  ThermalEventFeatures,
  EventClassification,
  ClassificationEvidence,
  ClassificationLabel,
  EventStatusHistory,
  FacilityBaseline,
  EventBaseline,
  AuditLog,
  Alert,
  EventFilters,
  PaginatedResult,
} from '@/types';
import { buildDemoScenarios, DEMO_FACILITIES } from '@/lib/data/demoData';

interface DbData {
  observations: FIRMSObservation[];
  events: ThermalEvent[];
  facilities: IndustrialFacility[];
  eventFeatures: Record<string, ThermalEventFeatures>;
  classifications: Record<string, EventClassification>;
  eventStatusHistory: EventStatusHistory[];
  facilityBaselines: Record<string, FacilityBaseline>;
  eventBaselines: Record<string, EventBaseline>;
  provenance: Array<{
    id: string;
    event_id: string;
    source_name: string;
    source_type: string;
    retrieved_at: string;
    url?: string;
    notes?: string;
  }>;
  reviews: Array<{
    id: string;
    event_id: string;
    reviewer: string;
    original_classification: string;
    updated_classification: string;
    notes: string;
    reviewed_at: string;
  }>;
  auditLogs: AuditLog[];
  alerts: Alert[];
  settings: Record<string, string>;
}

const DATA_FILE = path.resolve(process.cwd(), 'thermal-x-data.json');

class DatabaseEngine {
  private data: DbData;
  private initialized: boolean = false;

  constructor() {
    this.data = this.createEmptyDb();
    this.init();
  }

  private createEmptyDb(): DbData {
    return {
      observations: [],
      events: [],
      facilities: [],
      eventFeatures: {},
      classifications: {},
      eventStatusHistory: [],
      facilityBaselines: {},
      eventBaselines: {},
      provenance: [],
      reviews: [],
      auditLogs: [],
      alerts: [],
      settings: {
        clustering_distance_km: '5',
        clustering_time_window_hours: '24',
        persistence_threshold_days: '3',
        priority_frp_weight: '0.35',
        priority_persistence_weight: '0.25',
        priority_facility_weight: '0.25',
        priority_deviation_weight: '0.15',
        confidence_review_threshold: '40',
        demo_mode: 'true',
        refresh_interval_minutes: '30',
      },
    };
  }

  private init() {
    if (this.initialized) return;

    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure default collections exist if schema updated
        if (!this.data.observations) this.data.observations = [];
        if (!this.data.events) this.data.events = [];
        if (!this.data.facilities) this.data.facilities = [];
        if (!this.data.eventFeatures) this.data.eventFeatures = {};
        if (!this.data.classifications) this.data.classifications = {};
        if (!this.data.eventStatusHistory) this.data.eventStatusHistory = [];
        if (!this.data.facilityBaselines) this.data.facilityBaselines = {};
        if (!this.data.eventBaselines) this.data.eventBaselines = {};
        if (!this.data.provenance) this.data.provenance = [];
        if (!this.data.reviews) this.data.reviews = [];
        if (!this.data.auditLogs) this.data.auditLogs = [];
        if (!this.data.alerts) this.data.alerts = [];
        if (!this.data.settings) this.data.settings = {};
      } else {
        this.seedDemoData();
      }
    } catch {
      this.seedDemoData();
    }

    if (this.data.events.length === 0 || this.data.facilities.length === 0) {
      this.seedDemoData();
    }

    this.initialized = true;
  }

  private persist() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  public seedDemoData(force = false) {
    if (!force && this.data.events.length > 0) return;

    this.data.facilities = [...DEMO_FACILITIES];
    const scenarios = buildDemoScenarios();

    this.data.events = [];
    this.data.observations = [];
    this.data.eventFeatures = {};
    this.data.classifications = {};
    this.data.eventStatusHistory = [];
    this.data.eventBaselines = {};
    this.data.provenance = [];
    this.data.alerts = [];
    this.data.auditLogs = [];

    scenarios.forEach((sc) => {
      this.data.events.push(sc.event);
      this.data.observations.push(...sc.observations);

      // Features
      this.data.eventFeatures[sc.event.id] = {
        event_id: sc.event.id,
        frp_max: sc.event.max_frp,
        frp_avg: sc.event.avg_frp,
        frp_min: sc.event.avg_frp * 0.4,
        frp_std: sc.event.avg_frp * 0.25,
        frp_trend_slope: sc.event.frp_trend === 'increasing' ? 1.4 : sc.event.frp_trend === 'decreasing' ? -1.1 : 0.05,
        brightness_max: sc.event.max_brightness,
        brightness_avg: sc.event.avg_brightness,
        confidence_avg: sc.event.avg_confidence,
        detection_count: sc.event.detection_count,
        duration_hours: sc.event.duration_hours,
        detection_frequency_per_day: +(sc.event.detection_count / Math.max(1, sc.event.duration_hours / 24)).toFixed(2),
        recurrence_days: Math.round(sc.event.duration_hours / 24),
        day_detections: Math.floor(sc.event.detection_count * 0.6),
        night_detections: Math.ceil(sc.event.detection_count * 0.4),
        area_km2: +(Math.PI * Math.pow(Math.max(0.5, (sc.event.nearest_facility_distance_km || 1) * 0.8), 2)).toFixed(2),
        is_persistent: sc.event.lifecycle === 'persistent',
        has_industrial_context: !!sc.event.nearest_facility_id,
        nearest_facility_distance_km: sc.event.nearest_facility_distance_km,
        land_cover: sc.event.land_cover,
        computed_at: sc.event.updated_at,
      };

      // Classification evidence
      const evidence: ClassificationEvidence[] = [];
      if (sc.event.nearest_facility_name) {
        evidence.push({
          factor: 'Proximity to Industrial Facility',
          value: `${sc.event.nearest_facility_distance_km} km from ${sc.event.nearest_facility_name} (${sc.event.nearest_facility_type})`,
          weight: 0.85,
          supports: [sc.event.classification] as ClassificationLabel[],
        });
      }
      if (sc.event.duration_hours > 72) {
        evidence.push({
          factor: 'Temporal Persistence',
          value: `Observed across ${Math.round(sc.event.duration_hours / 24)} days with stable recurrence`,
          weight: 0.78,
          supports: ['persistent_industrial', 'gas_flare', 'mining_activity'] as ClassificationLabel[],
        });
      }
      if (sc.event.max_frp > 150) {
        evidence.push({
          factor: 'Thermal Intensity (FRP)',
          value: `Peak FRP of ${sc.event.max_frp.toFixed(1)} MW indicates intense combustion`,
          weight: 0.82,
          supports: ['industrial_fire', 'wildfire'] as ClassificationLabel[],
        });
      }
      evidence.push({
        factor: 'Land Cover Context',
        value: `Corresponds to ${sc.event.land_cover} land-use category`,
        weight: 0.65,
        supports: [sc.event.classification] as ClassificationLabel[],
      });

      this.data.classifications[sc.event.id] = {
        id: `cls-${sc.event.id}`,
        event_id: sc.event.id,
        label: sc.event.classification,
        confidence: sc.event.classification_confidence,
        method: sc.event.classification_method,
        evidence,
        is_uncertain: sc.event.classification === 'uncertain',
        uncertainty_reason:
          sc.event.classification === 'uncertain'
            ? 'Low detection count and conflicting spatial context require human verification.'
            : null,
        classified_at: sc.event.updated_at,
        classified_by: 'system_rule_engine',
      };

      // Status history
      this.data.eventStatusHistory.push(
        {
          id: `hist-${sc.event.id}-1`,
          event_id: sc.event.id,
          previous_status: null,
          new_status: 'detected',
          reason: 'Initial FIRMS hotspot cluster detected',
          changed_at: sc.event.first_detected,
          changed_by: 'system',
        },
        {
          id: `hist-${sc.event.id}-2`,
          event_id: sc.event.id,
          previous_status: 'detected',
          new_status: sc.event.lifecycle,
          reason: `Auto-transitioned based on temporal pattern and FRP characteristics`,
          changed_at: sc.event.updated_at,
          changed_by: 'system',
        }
      );

      // Event baseline
      this.data.eventBaselines[sc.event.id] = {
        event_id: sc.event.id,
        historical_avg_frp: sc.event.avg_frp * 0.8,
        historical_detection_freq: +(sc.event.detection_count * 0.7).toFixed(1),
        current_frp: sc.event.avg_frp,
        current_detection_freq: sc.event.detection_count,
        deviation_score: sc.event.baseline_deviation,
        status: sc.event.baseline_status,
        computed_at: sc.event.updated_at,
      };

      // Provenance
      this.data.provenance.push(
        {
          id: `prov-${sc.event.id}-1`,
          event_id: sc.event.id,
          source_name: 'NASA FIRMS',
          source_type: 'Satellite Thermal Hotspots (MODIS / VIIRS)',
          retrieved_at: sc.event.updated_at,
          url: 'https://firms.modaps.eosdis.nasa.gov',
          notes: 'Near real-time thermal anomalies',
        },
        {
          id: `prov-${sc.event.id}-2`,
          event_id: sc.event.id,
          source_name: 'OpenStreetMap / Overpass',
          source_type: 'Industrial Infrastructure Points & Polygons',
          retrieved_at: sc.event.updated_at,
          url: 'https://overpass-api.de',
          notes: 'Free open geospatial infrastructure database',
        },
        {
          id: `prov-${sc.event.id}-3`,
          event_id: sc.event.id,
          source_name: 'Copernicus Global Land Cover',
          source_type: '100m Land Cover Epoch',
          retrieved_at: sc.event.updated_at,
          url: 'https://land.copernicus.eu',
          notes: 'Open-access global land monitoring service',
        }
      );

      // Alerts for high priority / abnormal
      if (sc.event.priority === 'critical' || sc.event.priority === 'high') {
        this.data.alerts.push({
          id: `alt-${sc.event.id}`,
          event_id: sc.event.id,
          type: sc.event.priority === 'critical' ? 'new_critical' : 'frp_spike',
          message: `Elevated thermal intensity detected at ${sc.event.nearest_facility_name || 'unidentified location'} (Peak FRP: ${sc.event.max_frp.toFixed(1)} MW)`,
          severity: sc.event.priority,
          is_read: false,
          created_at: sc.event.updated_at,
        });
      }
    });

    // Facility baselines
    DEMO_FACILITIES.forEach((fac) => {
      this.data.facilityBaselines[fac.id] = {
        facility_id: fac.id,
        observation_period_days: 90,
        avg_monthly_detections: 18.5,
        avg_frp: 54.2,
        max_frp: 180.0,
        active_days_per_month: 22.0,
        last_computed: new Date().toISOString(),
      };
    });

    // Initial audit log
    this.data.auditLogs.push({
      id: 'audit-001',
      event_id: null,
      action: 'system_initialized',
      actor: 'system',
      details: 'Thermal-X database populated with reference industrial baseline and demo scenarios',
      created_at: new Date().toISOString(),
    });

    this.persist();
  }

  // --- EVENTS ---
  public getEvents(filters?: EventFilters): ThermalEvent[] {
    let list = [...this.data.events];

    if (!filters) return list;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.id.toLowerCase().includes(q) ||
          e.classification.toLowerCase().includes(q) ||
          (e.nearest_facility_name && e.nearest_facility_name.toLowerCase().includes(q)) ||
          e.priority.toLowerCase().includes(q) ||
          e.lifecycle.toLowerCase().includes(q)
      );
    }

    if (filters.classifications && filters.classifications.length > 0) {
      list = list.filter((e) => filters.classifications!.includes(e.classification));
    }

    if (filters.priorities && filters.priorities.length > 0) {
      list = list.filter((e) => filters.priorities!.includes(e.priority));
    }

    if (filters.lifecycles && filters.lifecycles.length > 0) {
      list = list.filter((e) => filters.lifecycles!.includes(e.lifecycle));
    }

    if (filters.facilityTypes && filters.facilityTypes.length > 0) {
      list = list.filter(
        (e) => e.nearest_facility_type && filters.facilityTypes!.includes(e.nearest_facility_type)
      );
    }

    if (filters.landCovers && filters.landCovers.length > 0) {
      list = list.filter((e) => filters.landCovers!.includes(e.land_cover));
    }

    if (filters.minConfidence !== undefined) {
      list = list.filter((e) => e.classification_confidence >= filters.minConfidence!);
    }

    if (filters.isDemo !== undefined) {
      list = list.filter((e) => e.is_demo === filters.isDemo);
    }

    if (filters.dateFrom) {
      list = list.filter((e) => new Date(e.last_detected) >= new Date(filters.dateFrom!));
    }

    if (filters.dateTo) {
      list = list.filter((e) => new Date(e.first_detected) <= new Date(filters.dateTo!));
    }

    return list;
  }

  public getEventById(id: string): ThermalEvent | null {
    return this.data.events.find((e) => e.id === id) || null;
  }

  public insertEvent(event: ThermalEvent) {
    const idx = this.data.events.findIndex((e) => e.id === event.id);
    if (idx >= 0) {
      this.data.events[idx] = event;
    } else {
      this.data.events.push(event);
    }
    this.persist();
  }

  public updateEvent(id: string, updates: Partial<ThermalEvent>): ThermalEvent | null {
    const idx = this.data.events.findIndex((e) => e.id === id);
    if (idx === -1) return null;

    const current = this.data.events[idx];
    const updated = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.data.events[idx] = updated;
    this.persist();
    return updated;
  }

  // --- OBSERVATIONS ---
  public getObservations(eventId?: string): FIRMSObservation[] {
    if (eventId) {
      return this.data.observations.filter((o) => (o as any).event_id === eventId || o.id.includes(eventId));
    }
    return this.data.observations;
  }

  public insertObservations(obs: FIRMSObservation[]) {
    this.data.observations.push(...obs);
    this.persist();
  }

  // --- FACILITIES ---
  public getFacilities(type?: string): IndustrialFacility[] {
    if (type) {
      return this.data.facilities.filter((f) => f.type === type);
    }
    return this.data.facilities;
  }

  public getFacilityById(id: string): IndustrialFacility | null {
    return this.data.facilities.find((f) => f.id === id) || null;
  }

  public insertFacility(fac: IndustrialFacility) {
    const idx = this.data.facilities.findIndex((f) => f.id === fac.id);
    if (idx >= 0) {
      this.data.facilities[idx] = fac;
    } else {
      this.data.facilities.push(fac);
    }
    this.persist();
  }

  // --- FEATURES ---
  public getEventFeatures(eventId: string): ThermalEventFeatures | null {
    return this.data.eventFeatures[eventId] || null;
  }

  public setEventFeatures(eventId: string, features: ThermalEventFeatures) {
    this.data.eventFeatures[eventId] = features;
    this.persist();
  }

  // --- CLASSIFICATION ---
  public getClassification(eventId: string): EventClassification | null {
    return this.data.classifications[eventId] || null;
  }

  public setClassification(eventId: string, classification: EventClassification) {
    this.data.classifications[eventId] = classification;
    this.persist();
  }

  // --- STATUS HISTORY ---
  public getStatusHistory(eventId: string): EventStatusHistory[] {
    return this.data.eventStatusHistory
      .filter((h) => h.event_id === eventId)
      .sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());
  }

  public addStatusHistory(entry: EventStatusHistory) {
    this.data.eventStatusHistory.push(entry);
    this.persist();
  }

  // --- BASELINES ---
  public getFacilityBaseline(facilityId: string): FacilityBaseline | null {
    return this.data.facilityBaselines[facilityId] || null;
  }

  public setFacilityBaseline(facilityId: string, baseline: FacilityBaseline) {
    this.data.facilityBaselines[facilityId] = baseline;
    this.persist();
  }

  public getEventBaseline(eventId: string): EventBaseline | null {
    return this.data.eventBaselines[eventId] || null;
  }

  public setEventBaseline(eventId: string, baseline: EventBaseline) {
    this.data.eventBaselines[eventId] = baseline;
    this.persist();
  }

  // --- PROVENANCE ---
  public getProvenance(eventId: string) {
    return this.data.provenance.filter((p) => p.event_id === eventId);
  }

  public addProvenance(entry: {
    id: string;
    event_id: string;
    source_name: string;
    source_type: string;
    retrieved_at: string;
    url?: string;
    notes?: string;
  }) {
    this.data.provenance.push(entry);
    this.persist();
  }

  // --- REVIEWS ---
  public addReview(entry: {
    id: string;
    event_id: string;
    reviewer: string;
    original_classification: string;
    updated_classification: string;
    notes: string;
    reviewed_at: string;
  }) {
    this.data.reviews.push(entry);
    this.persist();
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(eventId?: string): AuditLog[] {
    if (eventId) {
      return this.data.auditLogs.filter((l) => l.event_id === eventId);
    }
    return this.data.auditLogs.slice(-50).reverse();
  }

  public addAuditLog(entry: AuditLog) {
    this.data.auditLogs.push(entry);
    this.persist();
  }

  // --- ALERTS ---
  public getAlerts(unreadOnly = false): Alert[] {
    if (unreadOnly) {
      return this.data.alerts.filter((a) => !a.is_read);
    }
    return this.data.alerts.slice(-30).reverse();
  }

  public markAlertRead(alertId: string) {
    const a = this.data.alerts.find((alt) => alt.id === alertId);
    if (a) {
      a.is_read = true;
      this.persist();
    }
  }

  // --- SETTINGS ---
  public getSettings(): Record<string, string> {
    return { ...this.data.settings };
  }

  public updateSetting(key: string, value: string) {
    this.data.settings[key] = value;
    this.persist();
  }
}

// Global Singleton
const globalForDb = global as unknown as { __thermalXDb?: DatabaseEngine };
const dbInstance = globalForDb.__thermalXDb || new DatabaseEngine();
if (process.env.NODE_ENV !== 'production') globalForDb.__thermalXDb = dbInstance;

export function getDb(): DatabaseEngine {
  return dbInstance;
}

export default getDb;
