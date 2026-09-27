import {
  ThermalEvent,
  ThermalEventFeatures,
  FacilityBaseline,
  EventBaseline,
  BaselineStatus,
} from '@/types';

/**
 * Calculates historical baseline comparison for an event
 */
export function computeEventBaseline(
  event: ThermalEvent,
  features: ThermalEventFeatures,
  facilityBaseline: FacilityBaseline | null
): EventBaseline {
  // If no facility baseline and very few detections, insufficient history
  if (!facilityBaseline && features.detection_count < 3) {
    return {
      event_id: event.id,
      historical_avg_frp: null,
      historical_detection_freq: null,
      current_frp: features.frp_avg,
      current_detection_freq: features.detection_count,
      deviation_score: null,
      status: 'insufficient_history',
      computed_at: new Date().toISOString(),
    };
  }

  // Benchmark FRP against facility baseline if available, or regional average of 45 MW
  const benchmarkFrp = facilityBaseline ? facilityBaseline.avg_frp : 45.0;
  const benchmarkFreq = facilityBaseline ? facilityBaseline.avg_monthly_detections : 5.0;

  // Percentage deviation
  const frpDeviation = ((features.frp_avg - benchmarkFrp) / benchmarkFrp) * 100;
  const maxFrpRatio = features.frp_max / benchmarkFrp;

  let status: BaselineStatus = 'normal';
  if (frpDeviation > 150 || maxFrpRatio > 3.0) {
    status = 'abnormal';
  } else if (frpDeviation > 40 || maxFrpRatio > 1.8) {
    status = 'elevated';
  } else {
    status = 'normal';
  }

  return {
    event_id: event.id,
    historical_avg_frp: +benchmarkFrp.toFixed(1),
    historical_detection_freq: +benchmarkFreq.toFixed(1),
    current_frp: features.frp_avg,
    current_detection_freq: features.detection_count,
    deviation_score: +frpDeviation.toFixed(1),
    status,
    computed_at: new Date().toISOString(),
  };
}

/**
 * Computes/updates a facility's thermal baseline based on historical observations
 */
export function computeFacilityBaseline(
  facilityId: string,
  events: ThermalEvent[]
): FacilityBaseline {
  const facilityEvents = events.filter((e) => e.nearest_facility_id === facilityId);

  if (facilityEvents.length === 0) {
    return {
      facility_id: facilityId,
      observation_period_days: 90,
      avg_monthly_detections: 0,
      avg_frp: 0,
      max_frp: 0,
      active_days_per_month: 0,
      last_computed: new Date().toISOString(),
    };
  }

  let totalFrp = 0;
  let maxFrp = 0;
  let totalDetections = 0;

  facilityEvents.forEach((e) => {
    totalFrp += e.avg_frp * e.detection_count;
    totalDetections += e.detection_count;
    if (e.max_frp > maxFrp) maxFrp = e.max_frp;
  });

  const avgFrp = totalDetections > 0 ? totalFrp / totalDetections : 0;
  const avgMonthlyDetections = +(totalDetections / 3).toFixed(1); // 90 days = ~3 months

  return {
    facility_id: facilityId,
    observation_period_days: 90,
    avg_monthly_detections: avgMonthlyDetections,
    avg_frp: +avgFrp.toFixed(1),
    max_frp: +maxFrp.toFixed(1),
    active_days_per_month: Math.min(30, +(facilityEvents.length * 4).toFixed(1)),
    last_computed: new Date().toISOString(),
  };
}
