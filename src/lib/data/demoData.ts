import { randomUUID } from 'crypto';
import {
  FIRMSObservation,
  ThermalEvent,
  IndustrialFacility,
  ClassificationLabel,
  LandCoverClass,
} from '@/types';

// Generate realistic UUID using crypto
function generateId(): string { // using randomUUID
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return randomUUID();
}

function id() {
  return generateId();
}

// Demo industrial facilities across India (SIH focus: India)
export const DEMO_FACILITIES: IndustrialFacility[] = [
  {
    id: 'fac-001',
    name: 'IOCL Panipat Refinery',
    type: 'refinery',
    latitude: 29.3909,
    longitude: 76.9635,
    osm_id: null,
    country: 'IN',
    region: 'Haryana',
    description: 'Indian Oil Corporation Panipat Refinery - one of largest refineries in India',
    source: 'demo',
    is_demo: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'fac-002',
    name: 'NTPC Dadri Thermal Power',
    type: 'thermal_power',
    latitude: 28.5515,
    longitude: 77.5567,
    osm_id: null,
    country: 'IN',
    region: 'Uttar Pradesh',
    description: 'NTPC Dadri Super Thermal Power Station - 1820 MW capacity',
    source: 'demo',
    is_demo: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'fac-003',
    name: 'Tata Steel Jamshedpur',
    type: 'steel',
    latitude: 22.8046,
    longitude: 86.2029,
    osm_id: null,
    country: 'IN',
    region: 'Jharkhand',
    description: 'Tata Steel integrated steel plant, Jamshedpur',
    source: 'demo',
    is_demo: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'fac-004',
    name: 'ONGC Sibsagar Gas Flare',
    type: 'petrochemical',
    latitude: 26.9787,
    longitude: 94.6386,
    osm_id: null,
    country: 'IN',
    region: 'Assam',
    description: 'ONGC oil field with known gas flaring operations',
    source: 'demo',
    is_demo: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'fac-005',
    name: 'Odisha Mining Corridor',
    type: 'mining',
    latitude: 22.1647,
    longitude: 85.2167,
    osm_id: null,
    country: 'IN',
    region: 'Odisha',
    description: 'Iron ore mining belt, Keonjhar district',
    source: 'demo',
    is_demo: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'fac-006',
    name: 'Reliance Jamnagar Refinery',
    type: 'refinery',
    latitude: 22.4707,
    longitude: 70.0577,
    osm_id: null,
    country: 'IN',
    region: 'Gujarat',
    description: 'Reliance Industries Jamnagar - world\'s largest single-location refinery',
    source: 'demo',
    is_demo: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'fac-007',
    name: 'SAIL Bhilai Steel Plant',
    type: 'steel',
    latitude: 21.2189,
    longitude: 81.4291,
    osm_id: null,
    country: 'IN',
    region: 'Chhattisgarh',
    description: 'Steel Authority of India, Bhilai Steel Plant',
    source: 'demo',
    is_demo: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'fac-008',
    name: 'NTPC Vindhyachal Super Thermal',
    type: 'thermal_power',
    latitude: 24.0975,
    longitude: 82.6672,
    osm_id: null,
    country: 'IN',
    region: 'Madhya Pradesh',
    description: 'NTPC Vindhyachal - 4760 MW, one of India\'s largest thermal plants',
    source: 'demo',
    is_demo: true,
    created_at: '2024-01-01T00:00:00Z',
  },
];

// Helper to generate observations around a point
function makeObservations(
  eventId: string,
  lat: number,
  lon: number,
  startDays: number,
  count: number,
  baseFrp: number,
  frpVariance: number,
  satellite: string = 'AQUA',
  isDemo: boolean = true
): FIRMSObservation[] {
  const obs: FIRMSObservation[] = [];
  const now = new Date('2024-09-20T00:00:00Z');

  for (let i = 0; i < count; i++) {
    const daysAgo = startDays - Math.floor(i * (startDays / count));
    const d = new Date(now.getTime() - daysAgo * 86400000);
    const frp = Math.max(1, baseFrp + (Math.random() - 0.5) * frpVariance);
    const brightness = 300 + frp * 2 + Math.random() * 20;

    obs.push({
      id: `obs-${eventId}-${i}`,
      latitude: lat + (Math.random() - 0.5) * 0.02,
      longitude: lon + (Math.random() - 0.5) * 0.02,
      brightness,
      scan: 0.9 + Math.random() * 0.4,
      track: 0.9 + Math.random() * 0.4,
      acq_date: d.toISOString().split('T')[0],
      acq_time: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      satellite,
      confidence: Math.floor(60 + Math.random() * 35),
      version: '6.1NRT',
      bright_t31: brightness - 10 - Math.random() * 15,
      frp,
      daynight: Math.random() > 0.5 ? 'D' : 'N',
      type: 0,
      source: 'demo_firms',
      is_demo: isDemo,
    });
  }
  return obs;
}

export interface DemoScenario {
  event: ThermalEvent;
  observations: FIRMSObservation[];
  facility: IndustrialFacility | null;
}

export function buildDemoScenarios(): DemoScenario[] {
  const scenarios: DemoScenario[] = [];

  // 1. Persistent industrial thermal source (thermal power plant)
  const e1: ThermalEvent = {
    id: 'evt-demo-001',
    first_detected: '2024-08-30T06:00:00Z',
    last_detected: '2024-09-20T12:00:00Z',
    detection_count: 42,
    centroid_lat: 28.5515,
    centroid_lon: 77.5567,
    max_frp: 87.4,
    avg_frp: 68.2,
    frp_trend: 'stable',
    avg_brightness: 441.2,
    max_brightness: 489.3,
    avg_confidence: 84,
    duration_hours: 504,
    classification: 'persistent_industrial',
    classification_confidence: 91,
    classification_method: 'rule_based',
    priority: 'medium',
    priority_score: 52,
    lifecycle: 'persistent',
    nearest_facility_id: 'fac-002',
    nearest_facility_name: 'NTPC Dadri Thermal Power',
    nearest_facility_type: 'thermal_power',
    nearest_facility_distance_km: 0.3,
    land_cover: 'industrial',
    land_cover_source: 'estimated',
    baseline_status: 'normal',
    baseline_deviation: 8,
    is_demo: true,
    requires_review: false,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2024-08-30T06:00:00Z',
    updated_at: '2024-09-20T12:00:00Z',
  };
  scenarios.push({
    event: e1,
    observations: makeObservations('evt-demo-001', 28.5515, 77.5567, 21, 42, 68, 25),
    facility: DEMO_FACILITIES[1],
  });

  // 2. Sudden industrial fire at refinery
  const e2: ThermalEvent = {
    id: 'evt-demo-002',
    first_detected: '2024-09-18T14:30:00Z',
    last_detected: '2024-09-19T08:00:00Z',
    detection_count: 8,
    centroid_lat: 29.3909,
    centroid_lon: 76.9635,
    max_frp: 342.7,
    avg_frp: 218.4,
    frp_trend: 'decreasing',
    avg_brightness: 523.6,
    max_brightness: 601.8,
    avg_confidence: 90,
    duration_hours: 17.5,
    classification: 'industrial_fire',
    classification_confidence: 88,
    classification_method: 'rule_based',
    priority: 'critical',
    priority_score: 94,
    lifecycle: 'abnormal',
    nearest_facility_id: 'fac-001',
    nearest_facility_name: 'IOCL Panipat Refinery',
    nearest_facility_type: 'refinery',
    nearest_facility_distance_km: 0.15,
    land_cover: 'industrial',
    land_cover_source: 'estimated',
    baseline_status: 'abnormal',
    baseline_deviation: 340,
    is_demo: true,
    requires_review: true,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2024-09-18T14:30:00Z',
    updated_at: '2024-09-19T08:00:00Z',
  };
  scenarios.push({
    event: e2,
    observations: makeObservations('evt-demo-002', 29.3909, 76.9635, 2, 8, 218, 150, 'TERRA'),
    facility: DEMO_FACILITIES[0],
  });

  // 3. Agricultural burning
  const e3: ThermalEvent = {
    id: 'evt-demo-003',
    first_detected: '2024-09-10T08:00:00Z',
    last_detected: '2024-09-15T16:00:00Z',
    detection_count: 23,
    centroid_lat: 30.3398,
    centroid_lon: 74.9734,
    max_frp: 48.2,
    avg_frp: 28.6,
    frp_trend: 'volatile',
    avg_brightness: 362.4,
    max_brightness: 398.1,
    avg_confidence: 71,
    duration_hours: 128,
    classification: 'agricultural_burning',
    classification_confidence: 79,
    classification_method: 'rule_based',
    priority: 'low',
    priority_score: 21,
    lifecycle: 'resolved',
    nearest_facility_id: null,
    nearest_facility_name: null,
    nearest_facility_type: null,
    nearest_facility_distance_km: null,
    land_cover: 'agriculture',
    land_cover_source: 'estimated',
    baseline_status: 'elevated',
    baseline_deviation: 45,
    is_demo: true,
    requires_review: false,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2024-09-10T08:00:00Z',
    updated_at: '2024-09-15T16:00:00Z',
  };
  scenarios.push({
    event: e3,
    observations: makeObservations('evt-demo-003', 30.3398, 74.9734, 10, 23, 28, 20, 'SUOMI-NPP'),
    facility: null,
  });

  // 4. Wildfire / Forest fire in Western Ghats
  const e4: ThermalEvent = {
    id: 'evt-demo-004',
    first_detected: '2024-09-12T11:00:00Z',
    last_detected: '2024-09-17T20:00:00Z',
    detection_count: 31,
    centroid_lat: 15.3173,
    centroid_lon: 75.7139,
    max_frp: 195.3,
    avg_frp: 112.7,
    frp_trend: 'increasing',
    avg_brightness: 478.2,
    max_brightness: 541.7,
    avg_confidence: 83,
    duration_hours: 129,
    classification: 'wildfire',
    classification_confidence: 84,
    classification_method: 'rule_based',
    priority: 'high',
    priority_score: 73,
    lifecycle: 'monitoring',
    nearest_facility_id: null,
    nearest_facility_name: null,
    nearest_facility_type: null,
    nearest_facility_distance_km: null,
    land_cover: 'forest',
    land_cover_source: 'estimated',
    baseline_status: 'abnormal',
    baseline_deviation: 180,
    is_demo: true,
    requires_review: false,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2024-09-12T11:00:00Z',
    updated_at: '2024-09-17T20:00:00Z',
  };
  scenarios.push({
    event: e4,
    observations: makeObservations('evt-demo-004', 15.3173, 75.7139, 8, 31, 112, 80, 'AQUA'),
    facility: null,
  });

  // 5. Mining-related thermal activity
  const e5: ThermalEvent = {
    id: 'evt-demo-005',
    first_detected: '2024-08-20T06:00:00Z',
    last_detected: '2024-09-20T12:00:00Z',
    detection_count: 38,
    centroid_lat: 22.1647,
    centroid_lon: 85.2167,
    max_frp: 62.4,
    avg_frp: 41.3,
    frp_trend: 'stable',
    avg_brightness: 389.5,
    max_brightness: 421.2,
    avg_confidence: 76,
    duration_hours: 774,
    classification: 'mining_activity',
    classification_confidence: 73,
    classification_method: 'rule_based',
    priority: 'medium',
    priority_score: 44,
    lifecycle: 'persistent',
    nearest_facility_id: 'fac-005',
    nearest_facility_name: 'Odisha Mining Corridor',
    nearest_facility_type: 'mining',
    nearest_facility_distance_km: 0.8,
    land_cover: 'barren_mining',
    land_cover_source: 'estimated',
    baseline_status: 'normal',
    baseline_deviation: 12,
    is_demo: true,
    requires_review: false,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2024-08-20T06:00:00Z',
    updated_at: '2024-09-20T12:00:00Z',
  };
  scenarios.push({
    event: e5,
    observations: makeObservations('evt-demo-005', 22.1647, 85.2167, 31, 38, 41, 22, 'NOAA-20'),
    facility: DEMO_FACILITIES[4],
  });

  // 6. Gas flare (ONGC Assam)
  const e6: ThermalEvent = {
    id: 'evt-demo-006',
    first_detected: '2024-09-01T00:00:00Z',
    last_detected: '2024-09-20T18:00:00Z',
    detection_count: 56,
    centroid_lat: 26.9787,
    centroid_lon: 94.6386,
    max_frp: 125.6,
    avg_frp: 98.4,
    frp_trend: 'stable',
    avg_brightness: 462.8,
    max_brightness: 511.4,
    avg_confidence: 88,
    duration_hours: 474,
    classification: 'gas_flare',
    classification_confidence: 86,
    classification_method: 'rule_based',
    priority: 'medium',
    priority_score: 48,
    lifecycle: 'persistent',
    nearest_facility_id: 'fac-004',
    nearest_facility_name: 'ONGC Sibsagar Gas Flare',
    nearest_facility_type: 'petrochemical',
    nearest_facility_distance_km: 0.2,
    land_cover: 'industrial',
    land_cover_source: 'estimated',
    baseline_status: 'normal',
    baseline_deviation: 5,
    is_demo: true,
    requires_review: false,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-09-20T18:00:00Z',
  };
  scenarios.push({
    event: e6,
    observations: makeObservations('evt-demo-006', 26.9787, 94.6386, 19, 56, 98, 30, 'SUOMI-NPP'),
    facility: DEMO_FACILITIES[3],
  });

  // 7. Uncertain event (weak/conflicting signals)
  const e7: ThermalEvent = {
    id: 'evt-demo-007',
    first_detected: '2024-09-19T04:00:00Z',
    last_detected: '2024-09-20T06:00:00Z',
    detection_count: 3,
    centroid_lat: 23.2599,
    centroid_lon: 77.4126,
    max_frp: 18.4,
    avg_frp: 14.2,
    frp_trend: 'volatile',
    avg_brightness: 328.6,
    max_brightness: 341.2,
    avg_confidence: 48,
    duration_hours: 26,
    classification: 'uncertain',
    classification_confidence: 28,
    classification_method: 'rule_based',
    priority: 'low',
    priority_score: 18,
    lifecycle: 'detected',
    nearest_facility_id: null,
    nearest_facility_name: null,
    nearest_facility_type: null,
    nearest_facility_distance_km: null,
    land_cover: 'unknown',
    land_cover_source: 'estimated',
    baseline_status: 'insufficient_history',
    baseline_deviation: null,
    is_demo: true,
    requires_review: true,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2024-09-19T04:00:00Z',
    updated_at: '2024-09-20T06:00:00Z',
  };
  scenarios.push({
    event: e7,
    observations: makeObservations('evt-demo-007', 23.2599, 77.4126, 1, 3, 14, 8, 'TERRA'),
    facility: null,
  });

  return scenarios;
}
