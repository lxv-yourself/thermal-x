import axios from 'axios';
import { IndustrialFacility, FacilityType } from '@/types';
import { haversineDistance } from './clustering';
import { getDb } from '@/lib/db';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Simple in-memory cache to prevent redundant Overpass calls
const overpassCache = new Map<string, { timestamp: number; facilities: IndustrialFacility[] }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export class InfrastructureService {
  /**
   * Find nearest facility from our database
   */
  public findNearestFacility(
    lat: number,
    lon: number,
    maxDistanceKm = 50
  ): {
    facility: IndustrialFacility | null;
    distanceKm: number | null;
  } {
    const db = getDb();
    const facilities = db.getFacilities();

    let nearest: IndustrialFacility | null = null;
    let minDistance = maxDistanceKm;

    for (const fac of facilities) {
      const dist = haversineDistance(lat, lon, fac.latitude, fac.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = fac;
      }
    }

    if (!nearest) {
      return { facility: null, distanceKm: null };
    }

    return {
      facility: nearest,
      distanceKm: +minDistance.toFixed(2),
    };
  }

  /**
   * Query Overpass API for industrial tags around a bounding box / radius
   */
  public async fetchOverpassIndustrial(
    lat: number,
    lon: number,
    radiusMeters = 15000
  ): Promise<IndustrialFacility[]> {
    const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}_${radiusMeters}`;
    const cached = overpassCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.facilities;
    }

    const query = `
      [out:json][timeout:15];
      (
        node["industrial"](around:${radiusMeters},${lat},${lon});
        node["power"="plant"](around:${radiusMeters},${lat},${lon});
        node["man_made"="petroleum_well"](around:${radiusMeters},${lat},${lon});
        node["man_made"="works"](around:${radiusMeters},${lat},${lon});
        node["landuse"="industrial"](around:${radiusMeters},${lat},${lon});
        way["landuse"="industrial"](around:${radiusMeters},${lat},${lon});
        way["power"="plant"](around:${radiusMeters},${lat},${lon});
      );
      out center 25;
    `;

    try {
      const response = await axios.post(
        OVERPASS_URL,
        `data=${encodeURIComponent(query)}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000,
        }
      );

      const elements = response.data?.elements || [];
      const facilities: IndustrialFacility[] = [];

      for (const el of elements) {
        const pLat = el.lat || el.center?.lat;
        const pLon = el.lon || el.center?.lon;
        if (!pLat || !pLon) continue;

        const tags = el.tags || {};
        const name = tags.name || tags['operator'] || `Industrial Site #${el.id}`;

        let type: FacilityType = 'industrial_general';
        const ind = (tags.industrial || tags['power'] || tags['man_made'] || '').toLowerCase();

        if (ind.includes('refinery') || ind.includes('petroleum')) type = 'refinery';
        else if (ind.includes('chemical') || ind.includes('gas')) type = 'petrochemical';
        else if (ind.includes('plant') || ind.includes('generator')) type = 'thermal_power';
        else if (ind.includes('steel') || ind.includes('metallurg')) type = 'steel';
        else if (ind.includes('mine') || ind.includes('quarry')) type = 'mining';

        facilities.push({
          id: `osm-${el.id}`,
          name,
          type,
          latitude: pLat,
          longitude: pLon,
          osm_id: String(el.id),
          country: 'IN',
          region: tags['addr:state'] || null,
          description: tags.description || `Overpass industrial feature: ${ind || 'general industrial'}`,
          source: 'osm',
          is_demo: false,
          created_at: new Date().toISOString(),
        });
      }

      overpassCache.set(cacheKey, { timestamp: Date.now(), facilities });
      return facilities;
    } catch (err: any) {
      console.warn('Overpass API query failed (relying on local facility registry):', err.message);
      return [];
    }
  }
}

export const infrastructureService = new InfrastructureService();
