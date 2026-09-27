import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { firmsProvider } from '@/lib/services/firms';
import { clusterHotspots, aggregateClusterToEvent } from '@/lib/services/clustering';
import { extractThermalFeatures } from '@/lib/services/features';
import { classifyThermalEvent } from '@/lib/services/classifier';
import { calculatePriorityScore } from '@/lib/services/priority';
import { computeEventBaseline, computeFacilityBaseline } from '@/lib/services/baselines';
import { infrastructureService } from '@/lib/services/infrastructure';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json().catch(() => ({}));
    const { source, dayRange, apiKey } = body;

    // Ingest observations (or fetch demo fallback)
    const { observations, status } = await firmsProvider.fetchObservations({
      source,
      dayRange,
      apiKey,
    });

    if (observations.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No new observations retrieved from FIRMS. Using existing events.',
        provider_status: status,
      });
    }

    // Cluster observations into events
    const clusters = clusterHotspots(observations);
    const newEvents = [];

    for (const [clusterId, obsList] of clusters.entries()) {
      const event = aggregateClusterToEvent(clusterId, obsList);

      // Match nearest facility
      const { facility, distanceKm } = infrastructureService.findNearestFacility(
        event.centroid_lat,
        event.centroid_lon
      );

      if (facility) {
        event.nearest_facility_id = facility.id;
        event.nearest_facility_name = facility.name;
        event.nearest_facility_type = facility.type;
        event.nearest_facility_distance_km = distanceKm;
      }

      // Feature extraction
      const features = extractThermalFeatures(event, obsList);
      db.setEventFeatures(event.id, features);

      // Facility baseline
      const facilityBaseline = facility ? db.getFacilityBaseline(facility.id) : null;

      // Event baseline
      const baseline = computeEventBaseline(event, features, facilityBaseline);
      db.setEventBaseline(event.id, baseline);
      event.baseline_status = baseline.status;
      event.baseline_deviation = baseline.deviation_score;

      // Classification
      const classification = classifyThermalEvent(event, features);
      event.classification = classification.label;
      event.classification_confidence = classification.confidence;
      event.requires_review = classification.isUncertain;

      db.setClassification(event.id, {
        id: `cls-${event.id}`,
        event_id: event.id,
        label: classification.label,
        confidence: classification.confidence,
        method: classification.method,
        evidence: classification.evidence,
        is_uncertain: classification.isUncertain,
        uncertainty_reason: classification.uncertaintyReason,
        classified_at: new Date().toISOString(),
        classified_by: 'system_rule_engine',
      });

      // Priority scoring
      const priority = calculatePriorityScore(event, features, baseline);
      event.priority = priority.level;
      event.priority_score = priority.score;

      // Save event & observations
      db.insertEvent(event);
      db.insertObservations(obsList);
      newEvents.push(event);
    }

    db.addAuditLog({
      id: `audit-${Date.now()}`,
      event_id: null,
      action: 'firms_ingested',
      actor: 'system',
      details: `Ingested ${observations.length} observations forming ${newEvents.length} clustered events`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      observations_count: observations.length,
      events_created: newEvents.length,
      provider_status: status,
    });
  } catch (err: any) {
    console.error('Error during ingestion:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
