import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const events = db.getEvents();
    const facilities = db.getFacilities();

    // Classification counts
    const classificationCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    let totalFrp = 0;
    let maxFrp = 0;

    for (const e of events) {
      classificationCounts[e.classification] = (classificationCounts[e.classification] || 0) + 1;
      priorityCounts[e.priority] = (priorityCounts[e.priority] || 0) + 1;
      totalFrp += e.max_frp;
      if (e.max_frp > maxFrp) maxFrp = e.max_frp;
    }

    const avgFrp = events.length > 0 ? totalFrp / events.length : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalEvents: events.length,
        totalFacilities: facilities.length,
        avgFrp: +avgFrp.toFixed(1),
        maxFrp: +maxFrp.toFixed(1),
        criticalCount: priorityCounts['critical'] || 0,
        highCount: priorityCounts['high'] || 0,
        mediumCount: priorityCounts['medium'] || 0,
        lowCount: priorityCounts['low'] || 0,
        classificationCounts,
        priorityCounts,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
