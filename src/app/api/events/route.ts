import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { EventFilters } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(req.url);

    const classification = url.searchParams.get('classification') || undefined;
    const priority = url.searchParams.get('priority') || undefined;
    const facility_type = url.searchParams.get('facility_type') || undefined;
    const searchQuery = url.searchParams.get('search') || undefined;
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 100;

    const filters: EventFilters = {
      classifications: classification ? [classification as any] : undefined,
      priorities: priority ? [priority as any] : undefined,
      facilityTypes: facility_type ? [facility_type as any] : undefined,
      searchQuery,
    };

    let events = db.getEvents(filters);
    if (limit && events.length > limit) {
      events = events.slice(0, limit);
    }

    return NextResponse.json({ success: true, data: events, total: events.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
