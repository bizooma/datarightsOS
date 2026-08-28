// Scheduled job: delete scanner records older than 90 days.
// Scans are a visitor-facing lead tool, not compliance evidence — unlike audit
// events and requests, they are safe to purge on a fixed window.
// Admin-only when invoked directly; normally run by the nightly workflow.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const RETENTION_DAYS = 90;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let isScheduled = false;
    try {
      const body = await req.clone().json();
      isScheduled = !!body?.scheduled || !!body?.event;
    } catch {
      isScheduled = false;
    }
    if (!isScheduled) {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let purged = 0;

    // Oldest-first, delete only records the explicit date check confirms are past
    // the window — never a broad query-based mass delete.
    for (let round = 0; round < 10; round++) {
      const oldest = await base44.asServiceRole.entities.Scan.filter({}, 'created_date', 100);
      const expired = oldest.filter((s) => new Date(s.created_date).getTime() < cutoff);
      if (expired.length === 0) break;
      for (const s of expired) {
        await base44.asServiceRole.entities.Scan.delete(s.id);
        purged++;
      }
      if (expired.length < 100) break;
    }

    return Response.json({ success: true, purged });
  } catch (error) {
    console.log('[purgeOldScans] error: ' + error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}