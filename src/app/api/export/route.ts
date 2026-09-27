import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { eventsToGeoJSON, eventsToCSV } from '@/lib/services/export';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'geojson';
    const events = db.getEvents();

    if (format === 'csv') {
      const csv = eventsToCSV(events);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="thermal-x-events.csv"',
        },
      });
    }

    const geojson = eventsToGeoJSON(events);
    return NextResponse.json(geojson);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
