import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { FIRMSProvider } from '@/lib/services/firms';
import { clusterHotspots, aggregateClusterToEvent } from '@/lib/services/clustering';
import { extractThermalFeatures } from '@/lib/services/features';
import { classifyThermalEvent } from '@/lib/services/classifier';
import { calculatePriorityScore } from '@/lib/services/priority';
import { computeEventBaseline } from '@/lib/services/baselines';
import { InfrastructureService } from '@/lib/services/infrastructure';
import { EventClassification } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const firmsProvider = new FIRMSProvider();
    const infraService = new InfrastructureService();

    // Fetch FIRMS observations or fallback demo
    const { observations, status } = await firmsProvider.fetchObservations();

    // If FIRMS observations are empty, use db observations
    const obsToCluster = observations.length > 0 ? observations : db.getObservations();

    // Cluster hotspots spatio-temporally
    const clusters = clusterHotspots(obsToCluster, {
      spatialThresholdKm: 5.0,
      temporalWindowHours: 48.0,
    });

    const newEvents = [];

    for (const [clusterId, obsList] of clusters.entries()) {
      const lat = obsList.reduce((s, o) => s + o.latitude, 0) / obsList.length;
      const lon = obsList.reduce((s, o) => s + o.longitude, 0) / obsList.length;

      const { facility, distanceKm } = infraService.findNearestFacility(lat, lon);

      const event = aggregateClusterToEvent(clusterId, obsList, {
        nearest_facility_id: facility?.id || null,
        nearest_facility_name: facility?.name || null,
        nearest_facility_type: facility?.type || null,
        nearest_facility_distance_km: distanceKm,
        land_cover: facility ? 'industrial' : 'unknown',
      });

      const features = extractThermalFeatures(event, obsList);
      const facBaseline = facility ? db.getFacilityBaseline(facility.id) : null;
      const baselineResult = computeEventBaseline(event, features, facBaseline);
      const classificationResult = classifyThermalEvent(event, features);
      const priority = calculatePriorityScore(event, features, baselineResult);

      event.classification = classificationResult.label;
      event.classification_confidence = classificationResult.confidence;
      event.priority = priority.level;
      event.priority_score = priority.score;
      event.baseline_status = baselineResult.status;
      event.baseline_deviation = baselineResult.deviation_score;

      const classification: EventClassification = {
        id: `cls-${event.id}`,
        event_id: event.id,
        label: classificationResult.label,
        confidence: classificationResult.confidence,
        method: classificationResult.method,
        evidence: classificationResult.evidence,
        is_uncertain: classificationResult.isUncertain,
        uncertainty_reason: classificationResult.uncertaintyReason,
        classified_at: new Date().toISOString(),
        classified_by: 'system_rule_engine',
      };

      db.insertEvent(event);
      db.setEventFeatures(event.id, features);
      db.setClassification(event.id, classification);

      newEvents.push(event);
    }

    return NextResponse.json({
      success: true,
      status: status.status,
      clustersCount: newEvents.length,
      observationsCount: obsToCluster.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
