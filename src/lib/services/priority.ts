import { ThermalEvent, ThermalEventFeatures, PriorityLevel, EventBaseline } from '@/types';

export interface PriorityScoreBreakdown {
  score: number; // 0 - 100
  level: PriorityLevel;
  factors: {
    name: string;
    weight: number;
    contribution: number;
    description: string;
  }[];
}

/**
 * Multi-factor Thermal-X Priority Scoring Model
 * Calculates operational urgency based on:
 * - Thermal intensity (FRP max & avg)
 * - Industrial proximity & critical infrastructure
 * - Historical baseline deviation (sudden anomaly)
 * - Event growth / trend
 * - Temporal persistence
 */
export function calculatePriorityScore(
  event: ThermalEvent,
  features: ThermalEventFeatures,
  baseline: EventBaseline | null
): PriorityScoreBreakdown {
  const factors = [];

  // 1. Thermal Intensity Factor (Weight: 35%)
  // Normalized FRP (20 MW = base, 300+ MW = max)
  const normFrp = Math.min(100, Math.max(0, (features.frp_max / 300) * 100));
  const frpContribution = normFrp * 0.35;
  factors.push({
    name: 'Thermal Radiative Power (FRP)',
    weight: 0.35,
    contribution: +frpContribution.toFixed(1),
    description: `Peak FRP of ${features.frp_max.toFixed(1)} MW (${normFrp > 70 ? 'Extreme' : normFrp > 40 ? 'High' : 'Moderate'} heat release)`,
  });

  // 2. Industrial Infrastructure Proximity (Weight: 25%)
  let proximityScore = 10;
  if (features.nearest_facility_distance_km !== null) {
    if (features.nearest_facility_distance_km <= 0.5) proximityScore = 100;
    else if (features.nearest_facility_distance_km <= 1.5) proximityScore = 75;
    else if (features.nearest_facility_distance_km <= 3.0) proximityScore = 50;
    else proximityScore = 25;
  }
  const proxContribution = proximityScore * 0.25;
  factors.push({
    name: 'Industrial Infrastructure Proximity',
    weight: 0.25,
    contribution: +proxContribution.toFixed(1),
    description: features.nearest_facility_distance_km !== null
      ? `${(features.nearest_facility_distance_km * 1000).toFixed(0)}m from ${event.nearest_facility_name || 'industrial facility'}`
      : 'No registered critical industrial facilities nearby',
  });

  // 3. Historical Baseline Deviation (Weight: 20%)
  let devScore = 20;
  if (baseline && baseline.deviation_score !== null) {
    if (baseline.deviation_score > 200) devScore = 100;
    else if (baseline.deviation_score > 100) devScore = 80;
    else if (baseline.deviation_score > 30) devScore = 50;
    else devScore = 20;
  }
  const devContribution = devScore * 0.20;
  factors.push({
    name: 'Baseline Thermal Anomaly Deviation',
    weight: 0.20,
    contribution: +devContribution.toFixed(1),
    description: baseline?.deviation_score !== null && baseline?.deviation_score !== undefined
      ? `+${baseline.deviation_score.toFixed(0)}% deviation above historical baseline`
      : 'Baseline history insufficient for full statistical anomaly scoring',
  });

  // 4. Persistence & Fire Growth Trend (Weight: 20%)
  let trendScore = 30;
  if (features.frp_trend_slope > 0.5) trendScore = 90;
  else if (event.lifecycle === 'persistent') trendScore = 60;
  else if (features.detection_count >= 10) trendScore = 50;
  const trendContribution = trendScore * 0.20;
  factors.push({
    name: 'Fire Dynamics & Growth Trend',
    weight: 0.20,
    contribution: +trendContribution.toFixed(1),
    description: features.frp_trend_slope > 0.5
      ? 'Rapidly escalating thermal intensity trend'
      : event.lifecycle === 'persistent'
      ? 'Established multi-day continuous thermal presence'
      : 'Stable or localized thermal footprint',
  });

  const totalScore = Math.min(100, Math.round(frpContribution + proxContribution + devContribution + trendContribution));

  let level: PriorityLevel = 'low';
  if (totalScore >= 80) level = 'critical';
  else if (totalScore >= 60) level = 'high';
  else if (totalScore >= 35) level = 'medium';
  else level = 'low';

  return {
    score: totalScore,
    level,
    factors,
  };
}
