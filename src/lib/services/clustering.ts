import { FIRMSObservation, ThermalEvent, LandCoverClass, EventLifecycle } from '@/types';

// Haversine formula to compute great-circle distance between two points in km
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface ClusteringOptions {
  spatialThresholdKm: number; // max distance between points in a cluster
  temporalWindowHours: number; // max time difference between detections
}

const DEFAULT_OPTIONS: ClusteringOptions = {
  spatialThresholdKm: 5.0,
  temporalWindowHours: 48.0,
};

function parseObservationDateTime(obs: FIRMSObservation): Date {
  // acq_date is YYYY-MM-DD, acq_time is HHMM (e.g. "0430")
  const dateStr = obs.acq_date;
  const timeStr = String(obs.acq_time).padStart(4, '0');
  const hours = timeStr.slice(0, 2);
  const minutes = timeStr.slice(2, 4);
  return new Date(`${dateStr}T${hours}:${minutes}:00Z`);
}

/**
 * Spatio-temporal DBSCAN-inspired clustering of FIRMS hotspots
 */
export function clusterHotspots(
  observations: FIRMSObservation[],
  options: Partial<ClusteringOptions> = {}
): Map<string, FIRMSObservation[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const clusters = new Map<string, FIRMSObservation[]>();
  const visited = new Set<string>();
  let clusterIndex = 1;

  // Sort observations by acquisition time
  const sorted = [...observations].sort(
    (a, b) =>
      parseObservationDateTime(a).getTime() -
      parseObservationDateTime(b).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (visited.has(current.id)) continue;

    visited.add(current.id);
    const currentCluster: FIRMSObservation[] = [current];
    const queue: FIRMSObservation[] = [current];

    while (queue.length > 0) {
      const point = queue.shift()!;
      const pointTime = parseObservationDateTime(point).getTime();

      for (let j = 0; j < sorted.length; j++) {
        const candidate = sorted[j];
        if (visited.has(candidate.id)) continue;

        const candidateTime = parseObservationDateTime(candidate).getTime();
        const timeDiffHours = Math.abs(candidateTime - pointTime) / (1000 * 60 * 60);

        if (timeDiffHours <= opts.temporalWindowHours) {
          const dist = haversineDistance(
            point.latitude,
            point.longitude,
            candidate.latitude,
            candidate.longitude
          );

          if (dist <= opts.spatialThresholdKm) {
            visited.add(candidate.id);
            currentCluster.push(candidate);
            queue.push(candidate);
          }
        }
      }
    }

    const clusterId = `evt-clustered-${String(clusterIndex++).padStart(3, '0')}`;
    clusters.set(clusterId, currentCluster);
  }

  return clusters;
}

/**
 * Aggregates a cluster of observations into a ThermalEvent
 */
export function aggregateClusterToEvent(
  clusterId: string,
  observations: FIRMSObservation[],
  existingEvent?: Partial<ThermalEvent>
): ThermalEvent {
  if (observations.length === 0) {
    throw new Error('Cannot aggregate empty observation cluster');
  }

  // Calculate centroids & stats
  let totalLat = 0;
  let totalLon = 0;
  let totalFrp = 0;
  let maxFrp = -Infinity;
  let totalBrightness = 0;
  let maxBrightness = -Infinity;
  let totalConfidence = 0;

  const dates: Date[] = [];

  observations.forEach((obs) => {
    totalLat += obs.latitude;
    totalLon += obs.longitude;
    const frp = obs.frp || 0;
    totalFrp += frp;
    if (frp > maxFrp) maxFrp = frp;

    const b = obs.brightness || 0;
    totalBrightness += b;
    if (b > maxBrightness) maxBrightness = b;

    let conf = 50;
    if (typeof obs.confidence === 'number') conf = obs.confidence;
    else if (obs.confidence === 'high') conf = 90;
    else if (obs.confidence === 'nominal') conf = 70;
    else if (obs.confidence === 'low') conf = 30;
    totalConfidence += conf;

    dates.push(parseObservationDateTime(obs));
  });

  const count = observations.length;
  dates.sort((a, b) => a.getTime() - b.getTime());

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const durationHours = Math.max(
    0.5,
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60)
  );

  // FRP trend determination
  let frpTrend: 'increasing' | 'decreasing' | 'stable' | 'volatile' = 'stable';
  if (observations.length >= 3) {
    const half = Math.floor(observations.length / 2);
    const firstHalfFrp =
      observations.slice(0, half).reduce((sum, o) => sum + (o.frp || 0), 0) /
      half;
    const secondHalfFrp =
      observations.slice(half).reduce((sum, o) => sum + (o.frp || 0), 0) /
      (observations.length - half);

    const diff = secondHalfFrp - firstHalfFrp;
    if (diff > 15) frpTrend = 'increasing';
    else if (diff < -15) frpTrend = 'decreasing';
    else frpTrend = 'stable';
  }

  // Lifecycle inference
  let lifecycle: EventLifecycle = 'detected';
  if (durationHours > 72 || count > 15) {
    lifecycle = 'persistent';
  } else if (durationHours > 12) {
    lifecycle = 'monitoring';
  }
  if (maxFrp > 250) {
    lifecycle = 'abnormal';
  }

  const nowStr = new Date().toISOString();

  return {
    id: existingEvent?.id || clusterId,
    first_detected: firstDate.toISOString(),
    last_detected: lastDate.toISOString(),
    detection_count: count,
    centroid_lat: +(totalLat / count).toFixed(5),
    centroid_lon: +(totalLon / count).toFixed(5),
    max_frp: +maxFrp.toFixed(1),
    avg_frp: +(totalFrp / count).toFixed(1),
    frp_trend: frpTrend,
    avg_brightness: +(totalBrightness / count).toFixed(1),
    max_brightness: +maxBrightness.toFixed(1),
    avg_confidence: Math.round(totalConfidence / count),
    duration_hours: +durationHours.toFixed(1),
    classification: existingEvent?.classification || 'uncertain',
    classification_confidence: existingEvent?.classification_confidence || 40,
    classification_method: existingEvent?.classification_method || 'rule_based',
    priority: existingEvent?.priority || 'low',
    priority_score: existingEvent?.priority_score || 20,
    lifecycle: existingEvent?.lifecycle || lifecycle,
    nearest_facility_id: existingEvent?.nearest_facility_id || null,
    nearest_facility_name: existingEvent?.nearest_facility_name || null,
    nearest_facility_type: existingEvent?.nearest_facility_type || null,
    nearest_facility_distance_km: existingEvent?.nearest_facility_distance_km || null,
    land_cover: existingEvent?.land_cover || 'unknown',
    land_cover_source: existingEvent?.land_cover_source || 'estimated',
    baseline_status: existingEvent?.baseline_status || 'insufficient_history',
    baseline_deviation: existingEvent?.baseline_deviation || null,
    is_demo: observations.some((o) => o.is_demo),
    requires_review: existingEvent?.requires_review || false,
    reviewed_by: existingEvent?.reviewed_by || null,
    reviewed_at: existingEvent?.reviewed_at || null,
    created_at: existingEvent?.created_at || nowStr,
    updated_at: nowStr,
  };
}
