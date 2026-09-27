import { ThermalEvent, ThermalEventFeatures, EventClassification, IndustrialFacility, EventStatusHistory, FIRMSObservation, IncidentReport } from '@/types';
import { getDb } from '@/lib/db';

export function buildIncidentReport(eventId: string): IncidentReport | null {
  const db = getDb();
  const event = db.getEventById(eventId);
  if (!event) return null;

  const features = db.getEventFeatures(eventId);
  const classification = db.getClassification(eventId);
  const facility = event.nearest_facility_id ? db.getFacilityById(event.nearest_facility_id) : null;
  const timeline = db.getStatusHistory(eventId);
  const observations = db.getObservations(eventId);
  const provenance = db.getProvenance(eventId);

  const dataSources = provenance.map((p) => `${p.source_name} (${p.source_type})`);
  if (dataSources.length === 0) {
    dataSources.push('NASA FIRMS Satellite Thermal Observations', 'OpenStreetMap Industrial Infrastructure');
  }

  return {
    event_id: eventId,
    generated_at: new Date().toISOString(),
    event,
    features,
    classification,
    facility,
    timeline,
    observations,
    data_sources: dataSources,
  };
}

export function formatIncidentReportAsText(report: IncidentReport): string {
  const e = report.event;
  const c = report.classification;
  const f = report.features;

  return `
================================================================================
                    THERMAL-X INDUSTRIAL THERMAL INCIDENT REPORT
                AI-Powered Industrial Thermal Intelligence (SIH26162)
================================================================================

REPORT ID: RPT-${e.id}
GENERATED AT: ${report.generated_at}

1. EVENT IDENTIFICATION
--------------------------------------------------------------------------------
Event ID:             ${e.id}
Lifecycle Status:     ${e.lifecycle.toUpperCase()}
Priority Level:       ${e.priority.toUpperCase()} (Score: ${e.priority_score}/100)
Classification:       ${e.classification.replace('_', ' ').toUpperCase()}
Confidence:           ${e.classification_confidence}% (${e.classification_method})
Human Review State:   ${e.requires_review ? 'HUMAN REVIEW REQUIRED' : 'AUTO-VALIDATED'}
Reviewed By:          ${e.reviewed_by || 'Unassigned'} ${e.reviewed_at ? `on ${e.reviewed_at}` : ''}

2. SPATIAL & INFRASTRUCTURE CONTEXT
--------------------------------------------------------------------------------
Coordinates:          ${e.centroid_lat.toFixed(5)}° N, ${e.centroid_lon.toFixed(5)}° E
Nearest Facility:     ${e.nearest_facility_name || 'None identified within 5km'}
Facility Type:        ${e.nearest_facility_type || 'N/A'}
Distance to Facility: ${e.nearest_facility_distance_km !== null ? `${(e.nearest_facility_distance_km * 1000).toFixed(0)} meters` : 'N/A'}
Land Cover Context:   ${e.land_cover.toUpperCase()} (${e.land_cover_source})

3. THERMAL DYNAMICS & SATELLITE OBSERVATIONS
--------------------------------------------------------------------------------
Detection Period:     ${e.first_detected} to ${e.last_detected}
Duration:             ${e.duration_hours.toFixed(1)} hours
Observation Count:    ${e.detection_count} satellite passes
Maximum FRP:          ${e.max_frp.toFixed(1)} MW
Average FRP:          ${e.avg_frp.toFixed(1)} MW
FRP Trend:            ${e.frp_trend.toUpperCase()}
Mean Brightness:      ${e.avg_brightness.toFixed(1)} K (Max: ${e.max_brightness.toFixed(1)} K)
Historical Baseline:  ${e.baseline_status.toUpperCase()} ${e.baseline_deviation ? `(+${e.baseline_deviation}% deviation)` : ''}

4. EXPLAINABLE CLASSIFICATION EVIDENCE
--------------------------------------------------------------------------------
${c?.evidence?.map((ev) => `• [Weight: ${(ev.weight * 100).toFixed(0)}%] ${ev.factor}: ${ev.value}`).join('\n') || '• Rule-based spatial and temporal feature baseline evaluation'}
${c?.is_uncertain ? `\n[!] UNCERTAINTY NOTICE:\n${c.uncertainty_reason}` : ''}

5. EVENT TIMELINE
--------------------------------------------------------------------------------
${report.timeline.map((t) => `• ${t.changed_at.slice(0, 16).replace('T', ' ')}: Status -> ${t.new_status} (${t.reason})`).join('\n')}

6. DATA PROVENANCE
--------------------------------------------------------------------------------
${report.data_sources.map((src) => `• ${src}`).join('\n')}

--------------------------------------------------------------------------------
DISCLAIMER:
Satellite-derived observations are analytical evidence and should be independently
verified before operational response or regulatory enforcement.
Thermal-X Prototype — Problem Statement SIH26162.
================================================================================
`.trim();
}
