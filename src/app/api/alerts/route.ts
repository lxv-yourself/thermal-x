import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const alerts = db.getAlerts(unreadOnly);
    const unreadCount = db.getAlerts(true).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      total: alerts.length,
      data: alerts,
    });
  } catch (err: any) {
    console.error('Error fetching alerts:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
