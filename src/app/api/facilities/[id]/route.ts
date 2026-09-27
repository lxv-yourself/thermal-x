import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const facility = db.getFacilityById(id);

    if (!facility) {
      return NextResponse.json({ success: false, error: 'Facility not found' }, { status: 404 });
    }

    const baseline = db.getFacilityBaseline(id);
    const allEvents = db.getEvents();
    const relatedEvents = allEvents.filter((e) => e.nearest_facility_id === id);

    return NextResponse.json({
      success: true,
      data: {
        facility,
        baseline,
        events: relatedEvents,
      },
    });
  } catch (err: any) {
    console.error('Error fetching facility detail:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
