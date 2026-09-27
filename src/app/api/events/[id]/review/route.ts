import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ClassificationLabel, EventLifecycle } from '@/types';

export async function POST(
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

    const body = await req.json();
    const { reviewer, classification, lifecycle, notes } = body;

    const originalClassification = event.classification;
    const updates: Partial<typeof event> = {
      reviewed_by: reviewer || 'Operator / Analyst',
      reviewed_at: new Date().toISOString(),
      requires_review: false,
    };

    if (classification) {
      updates.classification = classification as ClassificationLabel;
      updates.classification_method = 'rule_based'; // operator verified
    }

    if (lifecycle) {
      updates.lifecycle = lifecycle as EventLifecycle;
      db.addStatusHistory({
        id: `hist-${id}-${Date.now()}`,
        event_id: id,
        previous_status: event.lifecycle,
        new_status: lifecycle,
        reason: notes || 'Operator review status update',
        changed_at: new Date().toISOString(),
        changed_by: reviewer || 'Operator',
      });
    }

    const updatedEvent = db.updateEvent(id, updates);

    // Save review record
    db.addReview({
      id: `rev-${Date.now()}`,
      event_id: id,
      reviewer: reviewer || 'Operator',
      original_classification: originalClassification,
      updated_classification: classification || originalClassification,
      notes: notes || 'Event inspected and validated',
      reviewed_at: new Date().toISOString(),
    });

    // Save audit log
    db.addAuditLog({
      id: `audit-${Date.now()}`,
      event_id: id,
      action: 'event_reviewed',
      actor: reviewer || 'Operator',
      details: `Classification changed from ${originalClassification} to ${classification || originalClassification}. Notes: ${notes || 'None'}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: updatedEvent,
    });
  } catch (err: any) {
    console.error('Error reviewing event:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
