import { ThermalEvent } from '@/types';
import Papa from 'papaparse';

export function eventsToGeoJSON(events: ThermalEvent[]): any {
  return {
    type: 'FeatureCollection',
    metadata: {
      generated_at: new Date().toISOString(),
      platform: 'Thermal-X SIH26162',
      count: events.length,
    },
    features: events.map((event) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [event.centroid_lon, event.centroid_lat],
      },
      properties: {
        id: event.id,
        classification: event.classification,
        classification_confidence: event.classification_confidence,
        priority: event.priority,
        priority_score: event.priority_score,
        max_frp: event.max_frp,
        avg_frp: event.avg_frp,
        detection_count: event.detection_count,
        first_detected: event.first_detected,
        last_detected: event.last_detected,
        nearest_facility: event.nearest_facility_name,
        facility_type: event.nearest_facility_type,
        distance_to_facility_km: event.nearest_facility_distance_km,
        operational_lifecycle: event.lifecycle,
      },
    })),
  };
}

export function eventsToCSV(events: ThermalEvent[]): string {
  const flatData = events.map((e) => ({
    Event_ID: e.id,
    Classification: e.classification,
    Classification_Confidence: e.classification_confidence,
    Priority: e.priority,
    Priority_Score: e.priority_score,
    Latitude: e.centroid_lat,
    Longitude: e.centroid_lon,
    Max_FRP_MW: e.max_frp,
    Avg_FRP_MW: e.avg_frp,
    Observations: e.detection_count,
    First_Detected: e.first_detected,
    Last_Detected: e.last_detected,
    Nearest_Facility: e.nearest_facility_name || 'N/A',
    Facility_Type: e.nearest_facility_type || 'N/A',
    Distance_km: e.nearest_facility_distance_km !== null ? e.nearest_facility_distance_km.toFixed(2) : 'N/A',
    Lifecycle: e.lifecycle,
  }));

  return Papa.unparse(flatData);
}
