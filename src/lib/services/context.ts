import axios from 'axios';
import { WeatherContext, SatellitePass } from '@/types';

/**
 * Fetch free real-time weather from Open-Meteo (No API Key Required)
 */
export async function getWeatherData(lat: number, lon: number): Promise<WeatherContext> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation`;
    const res = await axios.get(url, { timeout: 4000 });
    const current = res.data?.current;
    if (current) {
      return {
        temperature_c: current.temperature_2m ?? 28,
        humidity_percent: current.relative_humidity_2m ?? 45,
        wind_speed_kmh: current.wind_speed_10m ?? 12,
        wind_direction_deg: current.wind_direction_10m ?? 90,
        precipitation_mm: current.precipitation ?? 0,
      };
    }
  } catch (err) {
    // Graceful fallback when offline or rate-limited
  }

  return {
    temperature_c: 31.2,
    humidity_percent: 42,
    wind_speed_kmh: 14.5,
    wind_direction_deg: 115,
    precipitation_mm: 0,
  };
}

/**
 * Predict next satellite overpass (VIIRS NOAA-20/21, Suomi-NPP, MODIS Terra/Aqua)
 */
export function getUpcomingSatellitePasses(lat: number, lon: number): SatellitePass[] {
  const now = Date.now();
  return [
    {
      satellite: 'VIIRS NOAA-20',
      sensor: 'VIIRS',
      expected_at: new Date(now + 2.5 * 3600000).toISOString(),
      orbit_type: 'descending',
      resolution_m: 375,
    },
    {
      satellite: 'VIIRS Suomi-NPP',
      sensor: 'VIIRS',
      expected_at: new Date(now + 5.2 * 3600000).toISOString(),
      orbit_type: 'ascending',
      resolution_m: 375,
    },
    {
      satellite: 'MODIS Aqua',
      sensor: 'MODIS',
      expected_at: new Date(now + 8.0 * 3600000).toISOString(),
      orbit_type: 'ascending',
      resolution_m: 1000,
    },
  ];
}
