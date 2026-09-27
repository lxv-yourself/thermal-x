import {
  ThermalEvent,
  ThermalEventFeatures,
  EventClassification,
  ClassificationLabel,
  ClassificationEvidence,
} from '@/types';

export interface ClassificationResult {
  label: ClassificationLabel;
  confidence: number;
  method: 'rule_based' | 'ml_assisted';
  evidence: ClassificationEvidence[];
  isUncertain: boolean;
  uncertaintyReason: string | null;
}

/**
 * Transparent, explainable rule-based baseline classification engine
 * adhering to SIH26162 specification.
 */
export function classifyThermalEvent(
  event: ThermalEvent,
  features: ThermalEventFeatures
): ClassificationResult {
  const evidence: ClassificationEvidence[] = [];
  const scores: Record<ClassificationLabel, number> = {
    industrial_fire: 0,
    persistent_industrial: 0,
    gas_flare: 0,
    wildfire: 0,
    agricultural_burning: 0,
    mining_activity: 0,
    uncertain: 0,
  };

  const distKm = features.nearest_facility_distance_km;
  const facilityType = event.nearest_facility_type;
  const facilityName = event.nearest_facility_name;

  // 1. Spatial Proximity & Facility Context
  if (distKm !== null && distKm <= 1.0) {
    if (facilityType === 'refinery' || facilityType === 'petrochemical') {
      scores.gas_flare += 25;
      scores.persistent_industrial += 25;
      scores.industrial_fire += 20;
      evidence.push({
        factor: 'High Proximity to Petrochemical/Refinery',
        value: `${(distKm * 1000).toFixed(0)}m from ${facilityName} (${facilityType})`,
        weight: 0.85,
        supports: ['gas_flare', 'persistent_industrial', 'industrial_fire'],
      });
    } else if (facilityType === 'thermal_power' || facilityType === 'steel') {
      scores.persistent_industrial += 35;
      scores.industrial_fire += 15;
      evidence.push({
        factor: 'Direct Thermal Power / Metallurgical Proximity',
        value: `${(distKm * 1000).toFixed(0)}m from ${facilityName} (${facilityType})`,
        weight: 0.85,
        supports: ['persistent_industrial', 'industrial_fire'],
      });
    } else if (facilityType === 'mining') {
      scores.mining_activity += 40;
      evidence.push({
        factor: 'Mining Area Co-location',
        value: `${(distKm * 1000).toFixed(0)}m from active mining corridor`,
        weight: 0.85,
        supports: ['mining_activity'],
      });
    }
  } else if (distKm !== null && distKm <= 3.0) {
    scores.persistent_industrial += 15;
    scores.industrial_fire += 10;
    evidence.push({
      factor: 'Vicinity to Industrial Zone',
      value: `${distKm.toFixed(1)} km from ${facilityName || 'industrial facility'}`,
      weight: 0.6,
      supports: ['persistent_industrial', 'industrial_fire'],
    });
  } else {
    // Far from known industrial facilities
    scores.wildfire += 20;
    scores.agricultural_burning += 20;
    evidence.push({
      factor: 'Isolated from Industrial Infrastructure',
      value: distKm !== null ? `${distKm.toFixed(1)} km to nearest facility` : 'No industrial facilities in 15km radius',
      weight: 0.7,
      supports: ['wildfire', 'agricultural_burning'],
    });
  }

  // 2. Temporal Persistence & Recurrence
  if (features.recurrence_days >= 5 || features.duration_hours >= 72) {
    scores.persistent_industrial += 35;
    scores.gas_flare += 30;
    scores.mining_activity += 25;
    scores.wildfire -= 25;
    scores.agricultural_burning -= 35;
    evidence.push({
      factor: 'High Temporal Persistence',
      value: `Recurring over ${features.recurrence_days} days (${features.duration_hours.toFixed(0)}h span)`,
      weight: 0.9,
      supports: ['persistent_industrial', 'gas_flare', 'mining_activity'],
    });
  } else if (features.duration_hours <= 24 && features.detection_count <= 5) {
    scores.agricultural_burning += 25;
    scores.industrial_fire += 15;
    scores.persistent_industrial -= 25;
    evidence.push({
      factor: 'Transient Thermal Episode',
      value: `Single-day event lasting ~${features.duration_hours.toFixed(1)} hours with ${features.detection_count} detections`,
      weight: 0.75,
      supports: ['agricultural_burning', 'industrial_fire'],
    });
  }

  // 3. Thermal Intensity (FRP) & Temperature
  if (features.frp_max >= 250) {
    scores.industrial_fire += 40;
    scores.wildfire += 35;
    scores.persistent_industrial -= 20;
    evidence.push({
      factor: 'Extreme Thermal Radiative Power',
      value: `Peak FRP of ${features.frp_max.toFixed(1)} MW indicates massive active combustion`,
      weight: 0.95,
      supports: ['industrial_fire', 'wildfire'],
    });
  } else if (features.frp_max >= 80 && features.frp_avg >= 50) {
    scores.gas_flare += 20;
    scores.persistent_industrial += 15;
    scores.wildfire += 15;
    evidence.push({
      factor: 'Moderate-High Continuous Thermal Output',
      value: `Mean FRP ${features.frp_avg.toFixed(1)} MW with peak ${features.frp_max.toFixed(1)} MW`,
      weight: 0.75,
      supports: ['gas_flare', 'persistent_industrial'],
    });
  } else if (features.frp_max <= 40) {
    scores.agricultural_burning += 20;
    scores.mining_activity += 15;
    evidence.push({
      factor: 'Low-to-Moderate Radiative Signature',
      value: `Max FRP ${features.frp_max.toFixed(1)} MW typical of surface burning or ground heat`,
      weight: 0.6,
      supports: ['agricultural_burning', 'mining_activity'],
    });
  }

  // 4. Land Cover Context
  if (features.land_cover === 'industrial' || features.land_cover === 'urban') {
    scores.industrial_fire += 20;
    scores.persistent_industrial += 25;
    scores.gas_flare += 20;
    evidence.push({
      factor: 'Industrial / Built-up Land Cover',
      value: 'Satellite land cover shows developed industrial/urban surface',
      weight: 0.8,
      supports: ['industrial_fire', 'persistent_industrial', 'gas_flare'],
    });
  } else if (features.land_cover === 'forest') {
    scores.wildfire += 35;
    evidence.push({
      factor: 'Forest Canopy Land Cover',
      value: 'Located in woodland/forest canopy biome',
      weight: 0.85,
      supports: ['wildfire'],
    });
  } else if (features.land_cover === 'agriculture') {
    scores.agricultural_burning += 35;
    evidence.push({
      factor: 'Cropland / Agricultural Land Cover',
      value: 'Surrounding parcel classified as cultivated agricultural land',
      weight: 0.85,
      supports: ['agricultural_burning'],
    });
  } else if (features.land_cover === 'barren_mining') {
    scores.mining_activity += 35;
    evidence.push({
      factor: 'Barren / Open Pit Land Cover',
      value: 'Earth observation indicates bare ground / excavation terrain',
      weight: 0.8,
      supports: ['mining_activity'],
    });
  }

  // 5. Day vs Night Distribution
  if (features.night_detections > 0 && features.day_detections > 0) {
    scores.gas_flare += 15;
    scores.persistent_industrial += 15;
    evidence.push({
      factor: '24-Hour Continuous Operation',
      value: `Observed during both day (${features.day_detections}) and night (${features.night_detections}) passes`,
      weight: 0.7,
      supports: ['gas_flare', 'persistent_industrial'],
    });
  }

  // Find candidate class with highest score
  const candidateKeys: ClassificationLabel[] = [
    'industrial_fire',
    'persistent_industrial',
    'gas_flare',
    'wildfire',
    'agricultural_burning',
    'mining_activity',
  ];

  let topClass: ClassificationLabel = 'uncertain';
  let topScore = -Infinity;
  let secondScore = -Infinity;

  candidateKeys.forEach((key) => {
    const s = scores[key];
    if (s > topScore) {
      secondScore = topScore;
      topScore = s;
      topClass = key;
    } else if (s > secondScore) {
      secondScore = s;
    }
  });

  // Calculate normalized confidence (0 - 100)
  let confidence = Math.min(95, Math.max(25, Math.round(topScore * 0.95)));

  // Uncertainty & Abstention rules
  let isUncertain = false;
  let uncertaintyReason: string | null = null;

  // Margin check: If top 2 classes are too close or detection count is tiny
  const scoreMargin = topScore - secondScore;
  if (features.detection_count < 3 && topScore < 50) {
    isUncertain = true;
    confidence = Math.min(confidence, 35);
    topClass = 'uncertain';
    uncertaintyReason =
      'Insufficient observation count (< 3 passes). Satellite thermal footprint is sparse; manual analyst review advised.';
  } else if (scoreMargin < 12 && topScore < 60) {
    isUncertain = true;
    confidence = Math.min(confidence, 45);
    topClass = 'uncertain';
    uncertaintyReason = `Conflicting spatial and temporal evidence between ${topClass.replace('_', ' ')} and alternative classes. Classification confidence below review threshold.`;
  }

  return {
    label: topClass,
    confidence,
    method: 'rule_based',
    evidence,
    isUncertain,
    uncertaintyReason,
  };
}
