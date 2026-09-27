// Core domain types for Thermal-X

export type ClassificationLabel =
  | 'industrial_fire'
  | 'persistent_industrial'
  | 'gas_flare'
  | 'wildfire'
  | 'agricultural_burning'
  | 'mining_activity'
  | 'uncertain';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export type EventLifecycle =
  | 'detected'
  | 'monitoring'
  | 'persistent'
  | 'abnormal'
  | 'resolved';

export type BaselineStatus = 'normal' | 'elevated' | 'abnormal' | 'insufficient_history';

export type LandCoverClass =
  | 'industrial'
  | 'forest'
  | 'agriculture'
  | 'barren_mining'
  | 'water'
  | 'urban'
  | 'unknown';

export type FacilityType =
  | 'refinery'
  | 'petrochemical'
  | 'thermal_power'
  | 'steel'
  | 'mining'
  | 'lng'
  | 'industrial_general'
  | 'other';

export interface FIRMSObservation {
  id: string;
  latitude: number;
  longitude: number;
  brightness: number; // Kelvin
  scan: number;
  track: number;
  acq_date: string; // YYYY-MM-DD
  acq_time: string; // HHMM
  satellite: string;
  confidence: number | string; // numeric 0-100 or 'low'|'nominal'|'high'
  version: string;
  bright_t31: number;
  frp: number; // Fire Radiative Power MW
  daynight: 'D' | 'N';
  type: number; // 0=presumed vegetation, 1=active volcano, 2=other static, 3=offshore
  source?: string;
  is_demo?: boolean;
}

export interface ThermalEvent {
  id: string;
  first_detected: string;
  last_detected: string;
  detection_count: number;
  centroid_lat: number;
  centroid_lon: number;
  max_frp: number;
  avg_frp: number;
  frp_trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  avg_brightness: number;
  max_brightness: number;
  avg_confidence: number;
  duration_hours: number;
  classification: ClassificationLabel;
  classification_confidence: number; // 0-100
  classification_method: 'rule_based' | 'ml_assisted';
  priority: PriorityLevel;
  priority_score: number; // 0-100
  lifecycle: EventLifecycle;
  nearest_facility_id: string | null;
  nearest_facility_name: string | null;
  nearest_facility_type: FacilityType | null;
  nearest_facility_distance_km: number | null;
  land_cover: LandCoverClass;
  land_cover_source: string;
  baseline_status: BaselineStatus;
  baseline_deviation: number | null;
  is_demo: boolean;
  requires_review: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThermalEventFeatures {
  event_id: string;
  frp_max: number;
  frp_avg: number;
  frp_min: number;
  frp_std: number;
  frp_trend_slope: number;
  brightness_max: number;
  brightness_avg: number;
  confidence_avg: number;
  detection_count: number;
  duration_hours: number;
  detection_frequency_per_day: number;
  recurrence_days: number;
  day_detections: number;
  night_detections: number;
  area_km2: number;
  is_persistent: boolean;
  has_industrial_context: boolean;
  nearest_facility_distance_km: number | null;
  land_cover: LandCoverClass;
  computed_at: string;
}

export interface IndustrialFacility {
  id: string;
  name: string;
  type: FacilityType;
  latitude: number;
  longitude: number;
  osm_id: string | null;
  country: string;
  region: string | null;
  description: string | null;
  source: 'osm' | 'demo' | 'manual';
  is_demo: boolean;
  created_at: string;
}

export interface EventClassification {
  id: string;
  event_id: string;
  label: ClassificationLabel;
  confidence: number;
  method: 'rule_based' | 'ml_assisted' | 'manual';
  evidence: ClassificationEvidence[];
  is_uncertain: boolean;
  uncertainty_reason: string | null;
  classified_at: string;
  classified_by: string | null;
}

export interface ClassificationEvidence {
  factor: string;
  value: string;
  weight: number; // contribution to classification
  supports: ClassificationLabel[];
}

export interface EventStatusHistory {
  id: string;
  event_id: string;
  previous_status: EventLifecycle | null;
  new_status: EventLifecycle;
  reason: string;
  changed_at: string;
  changed_by: string | null;
}

export interface FacilityBaseline {
  facility_id: string;
  observation_period_days: number;
  avg_monthly_detections: number;
  avg_frp: number;
  max_frp: number;
  active_days_per_month: number;
  last_computed: string;
}

export interface EventBaseline {
  event_id: string;
  historical_avg_frp: number | null;
  historical_detection_freq: number | null;
  current_frp: number;
  current_detection_freq: number;
  deviation_score: number | null;
  status: BaselineStatus;
  computed_at: string;
}

export interface AuditLog {
  id: string;
  event_id: string | null;
  action: string;
  actor: string;
  details: string;
  created_at: string;
}

export interface Alert {
  id: string;
  event_id: string;
  type: 'new_critical' | 'status_change' | 'frp_spike' | 'persistent_detected';
  message: string;
  severity: PriorityLevel;
  is_read: boolean;
  created_at: string;
}

export interface DataProviderStatus {
  name: string;
  status: 'connected' | 'limited' | 'unavailable' | 'demo';
  last_updated: string | null;
  message: string;
}

export interface IncidentReport {
  event_id: string;
  generated_at: string;
  event: ThermalEvent;
  features: ThermalEventFeatures | null;
  classification: EventClassification | null;
  facility: IndustrialFacility | null;
  timeline: EventStatusHistory[];
  observations: FIRMSObservation[];
  data_sources: string[];
}

// Filter types for UI
export interface EventFilters {
  dateFrom?: string;
  dateTo?: string;
  classifications?: ClassificationLabel[];
  priorities?: PriorityLevel[];
  lifecycles?: EventLifecycle[];
  facilityTypes?: FacilityType[];
  landCovers?: LandCoverClass[];
  minConfidence?: number;
  isDemo?: boolean;
  searchQuery?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Analytics
export interface AnalyticsSummary {
  total_events: number;
  active_events: number;
  high_priority_events: number;
  persistent_sources: number;
  new_detections_24h: number;
  facilities_monitored: number;
  events_by_classification: Record<ClassificationLabel, number>;
  events_by_priority: Record<PriorityLevel, number>;
  events_by_lifecycle: Record<EventLifecycle, number>;
  avg_frp: number;
  max_frp: number;
  data_freshness: Record<string, string | null>;
}

export interface WeatherContext {
  temperature_c: number;
  humidity_percent: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  precipitation_mm: number;
}

export interface SatellitePass {
  satellite: string;
  sensor: string;
  expected_at: string;
  orbit_type: 'ascending' | 'descending';
  resolution_m: number;
}
