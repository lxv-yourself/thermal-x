import {
  haversineDistance,
  clusterHotspots,
  aggregateClusterToEvent,
} from '@/lib/services/clustering';
import { extractThermalFeatures } from '@/lib/services/features';
import { classifyThermalEvent } from '@/lib/services/classifier';
import { calculatePriorityScore } from '@/lib/services/priority';
import { computeEventBaseline, computeFacilityBaseline } from '@/lib/services/baselines';
import { FIRMSObservation, ThermalEvent } from '@/types';

describe('Thermal-X Core Spatial, Thermal & AI Logic', () => {
  const mockObservations: FIRMSObservation[] = [
    {
      id: 'obs-1',
      latitude: 28.5515,
      longitude: 77.5567,
      brightness: 440,
      scan: 1,
      track: 1,
      acq_date: '2024-09-18',
      acq_time: '1200',
      satellite: 'AQUA',
      confidence: 85,
      version: '6.1NRT',
      bright_t31: 310,
      frp: 85.5,
      daynight: 'D',
      type: 0,
      source: 'FIRMS',
      is_demo: true,
    },
    {
      id: 'obs-2',
      latitude: 28.552,
      longitude: 77.557,
      brightness: 450,
      scan: 1,
      track: 1,
      acq_date: '2024-09-19',
      acq_time: '0200',
      satellite: 'TERRA',
      confidence: 90,
      version: '6.1NRT',
      bright_t31: 315,
      frp: 92.0,
      daynight: 'N',
      type: 0,
      source: 'FIRMS',
      is_demo: true,
    },
    {
      id: 'obs-3',
      latitude: 28.551,
      longitude: 77.556,
      brightness: 435,
      scan: 1,
      track: 1,
      acq_date: '2024-09-20',
      acq_time: '1330',
      satellite: 'SNPP',
      confidence: 80,
      version: '2.0NRT',
      bright_t31: 308,
      frp: 78.4,
      daynight: 'D',
      type: 0,
      source: 'FIRMS',
      is_demo: true,
    },
  ];

  test('1. Haversine distance calculates accurate geographic span', () => {
    // Delhi to Mumbai is roughly 1150-1200 km
    const dist = haversineDistance(28.6139, 77.209, 19.076, 72.8777);
    expect(dist).toBeGreaterThan(1100);
    expect(dist).toBeLessThan(1250);

    // Nearby points (less than 1 km)
    const localDist = haversineDistance(28.5515, 77.5567, 28.552, 77.557);
    expect(localDist).toBeLessThan(0.2);
  });

  test('2. Event clustering groups nearby spatial-temporal hotspots', () => {
    const clusters = clusterHotspots(mockObservations, {
      spatialThresholdKm: 5.0,
      temporalWindowHours: 72.0,
    });
    expect(clusters.size).toBe(1);
    const firstCluster = clusters.values().next().value;
    expect(firstCluster?.length).toBe(3);
  });

  test('3. Aggregate cluster into thermal event structure', () => {
    const event = aggregateClusterToEvent('test-evt-01', mockObservations);
    expect(event.id).toBe('test-evt-01');
    expect(event.detection_count).toBe(3);
    expect(event.max_frp).toBe(92.0);
    expect(event.avg_frp).toBeCloseTo(85.3, 1);
  });

  test('4. Extract thermal, temporal and spatial features', () => {
    const event = aggregateClusterToEvent('test-evt-01', mockObservations);
    const features = extractThermalFeatures(event, mockObservations);

    expect(features.frp_max).toBe(92.0);
    expect(features.recurrence_days).toBe(3);
    expect(features.day_detections).toBe(2);
    expect(features.night_detections).toBe(1);
  });

  test('5. Explainable classification produces transparent evidence and respects uncertainty', () => {
    const event = aggregateClusterToEvent('test-evt-01', mockObservations, {
      nearest_facility_id: 'fac-002',
      nearest_facility_name: 'NTPC Dadri Thermal Power',
      nearest_facility_type: 'thermal_power',
      nearest_facility_distance_km: 0.25,
      land_cover: 'industrial',
    });
    const features = extractThermalFeatures(event, mockObservations);

    const classification = classifyThermalEvent(event, features);
    expect(classification.method).toBe('rule_based');
    expect(classification.evidence.length).toBeGreaterThan(0);
    expect(['persistent_industrial', 'industrial_fire', 'gas_flare']).toContain(classification.label);

    // Test uncertainty / abstention when observations are sparse (< 3)
    const sparseEvent: ThermalEvent = {
      ...event,
      detection_count: 1,
      nearest_facility_id: null,
      nearest_facility_name: null,
      nearest_facility_type: null,
      nearest_facility_distance_km: null,
      land_cover: 'unknown',
    };
    const sparseFeatures = extractThermalFeatures(sparseEvent, [mockObservations[0]]);
    const uncertainClassification = classifyThermalEvent(sparseEvent, sparseFeatures);
    expect(uncertainClassification.isUncertain).toBe(true);
    expect(uncertainClassification.uncertaintyReason).not.toBeNull();
  });

  test('6. Priority scoring correctly balances intensity, proximity and deviation', () => {
    const event = aggregateClusterToEvent('test-evt-01', mockObservations, {
      nearest_facility_distance_km: 0.2,
      nearest_facility_name: 'Dadri Plant',
    });
    const features = extractThermalFeatures(event, mockObservations);
    const breakdown = calculatePriorityScore(event, features, null);

    expect(breakdown.score).toBeGreaterThanOrEqual(0);
    expect(breakdown.score).toBeLessThanOrEqual(100);
    expect(['critical', 'high', 'medium', 'low']).toContain(breakdown.level);
    expect(breakdown.factors.length).toBe(4);
  });

  test('7. Historical and facility baseline deviations calculate abnormal states', () => {
    const facBaseline = computeFacilityBaseline('fac-002', [
      {
        ...mockObservations[0],
        id: 'evt-hist',
        first_detected: '2024-09-01T00:00:00Z',
        last_detected: '2024-09-10T00:00:00Z',
        detection_count: 12,
        centroid_lat: 28.5515,
        centroid_lon: 77.5567,
        max_frp: 80,
        avg_frp: 50,
        frp_trend: 'stable',
        avg_brightness: 400,
        max_brightness: 420,
        avg_confidence: 80,
        duration_hours: 240,
        classification: 'persistent_industrial',
        classification_confidence: 85,
        classification_method: 'rule_based',
        priority: 'medium',
        priority_score: 45,
        lifecycle: 'persistent',
        nearest_facility_id: 'fac-002',
        nearest_facility_name: 'Dadri',
        nearest_facility_type: 'thermal_power',
        nearest_facility_distance_km: 0.3,
        land_cover: 'industrial',
        land_cover_source: 'estimated',
        baseline_status: 'normal',
        baseline_deviation: 0,
        is_demo: true,
        requires_review: false,
        reviewed_by: null,
        reviewed_at: null,
        created_at: '',
        updated_at: '',
      },
    ]);

    expect(facBaseline.avg_frp).toBe(50);

    const normalEvent = aggregateClusterToEvent('normal-evt', mockObservations);
    const features = extractThermalFeatures(normalEvent, mockObservations);
    const baselineResult = computeEventBaseline(normalEvent, features, facBaseline);

    expect(baselineResult.status).toBeDefined();
    expect(baselineResult.deviation_score).toBeDefined();
  });
});
