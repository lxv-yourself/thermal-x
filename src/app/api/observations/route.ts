import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId') || undefined;

    const observations = db.getObservations(eventId);

    return NextResponse.json({
      success: true,
      total: observations.length,
      data: observations,
    });
  } catch (err: any) {
    console.error('Error fetching observations:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
