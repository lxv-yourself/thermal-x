import { FIRMSObservation, ThermalEvent, ThermalEventFeatures } from '@/types';
import { haversineDistance } from './clustering';

/**
 * Reusable feature extraction service for Thermal-X
 */
export function extractThermalFeatures(
  event: ThermalEvent,
  observations: FIRMSObservation[]
): ThermalEventFeatures {
  const count = observations.length;
  if (count === 0) {
    return {
      event_id: event.id,
      frp_max: event.max_frp,
      frp_avg: event.avg_frp,
      frp_min: event.avg_frp,
      frp_std: 0,
      frp_trend_slope: 0,
      brightness_max: event.max_brightness,
      brightness_avg: event.avg_brightness,
      confidence_avg: event.avg_confidence,
      detection_count: event.detection_count,
      duration_hours: event.duration_hours,
      detection_frequency_per_day: +(event.detection_count / Math.max(1, event.duration_hours / 24)).toFixed(2),
      recurrence_days: Math.round(event.duration_hours / 24),
      day_detections: Math.floor(event.detection_count * 0.6),
      night_detections: Math.ceil(event.detection_count * 0.4),
      area_km2: 1.0,
      is_persistent: event.lifecycle === 'persistent',
      has_industrial_context: !!event.nearest_facility_id,
      nearest_facility_distance_km: event.nearest_facility_distance_km,
      land_cover: event.land_cover,
      computed_at: new Date().toISOString(),
    };
  }

  // FRP stats
  const frps = observations.map((o) => o.frp || 0);
  const frpMax = Math.max(...frps);
  const frpMin = Math.min(...frps);
  const frpAvg = frps.reduce((a, b) => a + b, 0) / count;
  const variance = frps.reduce((acc, val) => acc + Math.pow(val - frpAvg, 2), 0) / count;
  const frpStd = Math.sqrt(variance);

  // Linear regression slope for FRP trend
  let frpTrendSlope = 0;
  if (count > 1) {
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    for (let i = 0; i < count; i++) {
      sumX += i;
      sumY += frps[i];
      sumXY += i * frps[i];
      sumXX += i * i;
    }
    const denom = count * sumXX - sumX * sumX;
    if (denom !== 0) {
      frpTrendSlope = +( (count * sumXY - sumX * sumY) / denom ).toFixed(3);
    }
  }

  // Brightness stats
  const btemps = observations.map((o) => o.brightness || 0);
  const bMax = Math.max(...btemps);
  const bAvg = btemps.reduce((a, b) => a + b, 0) / count;

  // Confidence avg
  const confidences = observations.map((o) => {
    if (typeof o.confidence === 'number') return o.confidence;
    if (o.confidence === 'high') return 90;
    if (o.confidence === 'nominal') return 70;
    return 30;
  });
  const confAvg = confidences.reduce((a, b) => a + b, 0) / count;

  // Day vs night
  const dayDetections = observations.filter((o) => o.daynight === 'D').length;
  const nightDetections = observations.filter((o) => o.daynight === 'N').length;

  // Estimated spatial extent area (km²) from max distance to centroid
  let maxRadiusKm = 0.5;
  observations.forEach((o) => {
    const d = haversineDistance(event.centroid_lat, event.centroid_lon, o.latitude, o.longitude);
    if (d > maxRadiusKm) maxRadiusKm = d;
  });
  const areaKm2 = +(Math.PI * Math.pow(maxRadiusKm, 2)).toFixed(2);

  // Recurrence across unique days
  const uniqueDates = new Set(observations.map((o) => o.acq_date));
  const recurrenceDays = uniqueDates.size;
  const durationDays = Math.max(1, event.duration_hours / 24);
  const detectionFrequencyPerDay = +(count / durationDays).toFixed(2);

  const isPersistent = recurrenceDays >= 3 || event.duration_hours >= 72;
  const hasIndustrialContext =
    event.nearest_facility_distance_km !== null &&
    event.nearest_facility_distance_km <= 3.0;

  return {
    event_id: event.id,
    frp_max: +frpMax.toFixed(1),
    frp_avg: +frpAvg.toFixed(1),
    frp_min: +frpMin.toFixed(1),
    frp_std: +frpStd.toFixed(2),
    frp_trend_slope: frpTrendSlope,
    brightness_max: +bMax.toFixed(1),
    brightness_avg: +bAvg.toFixed(1),
    confidence_avg: Math.round(confAvg),
    detection_count: count,
    duration_hours: event.duration_hours,
    detection_frequency_per_day: detectionFrequencyPerDay,
    recurrence_days: recurrenceDays,
    day_detections: dayDetections,
    night_detections: nightDetections,
    area_km2: areaKm2,
    is_persistent: isPersistent,
    has_industrial_context: hasIndustrialContext,
    nearest_facility_distance_km: event.nearest_facility_distance_km,
    land_cover: event.land_cover,
    computed_at: new Date().toISOString(),
  };
}
