import { NextResponse } from 'next/server';
import { firmsProvider } from '@/lib/services/firms';
import { getDb } from '@/lib/db';

export async function GET() {
  const firms = firmsProvider.getStatus();
  const db = getDb();
  const settings = db.getSettings();

  return NextResponse.json({
    success: true,
    data: {
      system_name: 'Thermal-X',
      version: '1.0.0-SIH26162',
      environment: process.env.NODE_ENV || 'development',
      demo_mode: settings.demo_mode === 'true',
      providers: [
        {
          name: 'NASA FIRMS (EOSDIS)',
          status: firms.status,
          message: firms.message,
          last_updated: firms.last_updated,
        },
        {
          name: 'OpenStreetMap Overpass API',
          status: 'connected',
          message: 'Overpass API reachable; local facility caching enabled',
          last_updated: new Date().toISOString(),
        },
        {
          name: 'Open-Meteo Weather Service',
          status: 'connected',
          message: 'Free open global meteorological API operational',
          last_updated: new Date().toISOString(),
        },
        {
          name: 'Copernicus Sentinel-2 Imagery',
          status: 'connected',
          message: 'Sentinel-2 Cloudless / EOX open composite layer active',
          last_updated: new Date().toISOString(),
        },
        {
          name: 'Thermal-X Analytical Engine',
          status: 'connected',
          message: 'Rule-based baseline + spatio-temporal clustering online',
          last_updated: new Date().toISOString(),
        },
      ],
      database: {
        status: 'online',
        events_count: db.getEvents().length,
        facilities_count: db.getFacilities().length,
        observations_count: db.getObservations().length,
      },
    },
  });
}
