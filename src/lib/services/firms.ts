import axios from 'axios';
import Papa from 'papaparse';
import { FIRMSObservation, DataProviderStatus } from '@/types';

export interface FIRMSFetchOptions {
  apiKey?: string;
  source?: 'VIIRS_SNPP_NRT' | 'VIIRS_NOAA20_NRT' | 'MODIS_NRT';
  area?: string; // e.g. "68,6,97,37" for India bounding box (west, south, east, north)
  dayRange?: number; // 1 to 10
}

const DEFAULT_AREA = '68,6,97,37'; // India bounding box
const FIRMS_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';

export class FIRMSProvider {
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.FIRMS_API_KEY || null;
  }

  public getStatus(): DataProviderStatus {
    if (!this.apiKey) {
      return {
        name: 'NASA FIRMS',
        status: 'demo',
        last_updated: new Date().toISOString(),
        message: 'No FIRMS_API_KEY configured. Operating on verified demonstration dataset.',
      };
    }
    return {
      name: 'NASA FIRMS',
      status: 'connected',
      last_updated: new Date().toISOString(),
      message: 'Connected to NASA EOSDIS Near Real-Time Active Fire Service.',
    };
  }

  /**
   * Ingest real FIRMS CSV data from NASA API
   */
  public async fetchObservations(options: FIRMSFetchOptions = {}): Promise<{
    observations: FIRMSObservation[];
    status: DataProviderStatus;
  }> {
    const key = options.apiKey || this.apiKey;
    const source = options.source || 'VIIRS_SNPP_NRT';
    const area = options.area || DEFAULT_AREA;
    const dayRange = Math.min(10, Math.max(1, options.dayRange || 1));

    if (!key) {
      return {
        observations: [],
        status: {
          name: 'NASA FIRMS',
          status: 'demo',
          last_updated: new Date().toISOString(),
          message: 'FIRMS_API_KEY missing. Fallback to demo mode.',
        },
      };
    }

    try {
      const url = `${FIRMS_BASE_URL}/${key}/${source}/${area}/${dayRange}`;
      const response = await axios.get(url, { timeout: 10000 });
      const csvText = response.data;

      if (typeof csvText !== 'string' || csvText.includes('Invalid MAP_KEY') || csvText.includes('Error')) {
        throw new Error(`FIRMS API response error: ${csvText.slice(0, 100)}`);
      }

      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      const rows = parsed.data as Record<string, string>[];

      const observations: FIRMSObservation[] = rows.map((r, i) => {
        const frp = parseFloat(r.frp || r.FRP || '0') || 0;
        const brightness = parseFloat(r.bright_ti4 || r.brightness || '300') || 300;
        const bright_t31 = parseFloat(r.bright_ti5 || r.bright_t31 || '290') || 290;

        return {
          id: `firms-live-${r.acq_date || 'date'}-${i}-${Math.round(parseFloat(r.latitude) * 1000)}`,
          latitude: parseFloat(r.latitude),
          longitude: parseFloat(r.longitude),
          brightness,
          scan: parseFloat(r.scan || '1'),
          track: parseFloat(r.track || '1'),
          acq_date: r.acq_date,
          acq_time: r.acq_time,
          satellite: r.satellite || source,
          confidence: r.confidence || 'nominal',
          version: r.version || '2.0NRT',
          bright_t31,
          frp,
          daynight: (r.daynight === 'D' || r.daynight === 'N' ? r.daynight : 'D') as 'D' | 'N',
          type: parseInt(r.type || '0', 10) || 0,
          source: 'NASA FIRMS Live API',
          is_demo: false,
        };
      });

      return {
        observations,
        status: {
          name: 'NASA FIRMS',
          status: 'connected',
          last_updated: new Date().toISOString(),
          message: `Successfully retrieved ${observations.length} active thermal detections from ${source}.`,
        },
      };
    } catch (err: any) {
      console.warn('NASA FIRMS Live API unavailable:', err.message);
      return {
        observations: [],
        status: {
          name: 'NASA FIRMS',
          status: 'limited',
          last_updated: new Date().toISOString(),
          message: `Live FIRMS request failed: ${err.message}. Retaining cached observations.`,
        },
      };
    }
  }
}

export const firmsProvider = new FIRMSProvider();
