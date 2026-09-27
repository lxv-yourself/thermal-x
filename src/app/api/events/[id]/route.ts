import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getWeatherData, getUpcomingSatellitePasses } from '@/lib/services/context';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const event = db.getEventById(id);
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    const features = db.getEventFeatures(id);
    const classification = db.getClassification(id);
    const baseline = db.getEventBaseline(id);
    const history = db.getStatusHistory(id);

    // Weather & satellite passes
    const weather = await getWeatherData(event.centroid_lat, event.centroid_lon);
    const satellitePasses = getUpcomingSatellitePasses(event.centroid_lat, event.centroid_lon);

    return NextResponse.json({
      success: true,
      event,
      features,
      classification,
      baseline,
      history,
      weather,
      satellitePasses,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();

    const event = db.getEventById(id);
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    const updates: any = {};
    if (body.lifecycle) {
      updates.lifecycle = body.lifecycle;
      db.addStatusHistory({
        id: `hist-${id}-${Date.now()}`,
        event_id: id,
        previous_status: event.lifecycle,
        new_status: body.lifecycle,
        reason: body.notes || 'Operator manual intervention',
        changed_at: new Date().toISOString(),
        changed_by: body.changed_by || 'Operator',
      });
    }

    if (body.classification) {
      updates.classification = body.classification;
      updates.requires_review = false;
      updates.reviewed_by = body.reviewer || 'Duty Analyst';
      updates.reviewed_at = new Date().toISOString();

      db.addReview({
        id: `rev-${id}-${Date.now()}`,
        event_id: id,
        reviewer: body.reviewer || 'Duty Analyst',
        original_classification: event.classification,
        updated_classification: body.classification,
        notes: body.notes || 'Human verification update',
        reviewed_at: new Date().toISOString(),
      });
    }

    const updated = db.updateEvent(id, updates);
    return NextResponse.json({ success: true, event: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
