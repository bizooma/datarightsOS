/**
 * Scheduled job: auto-expire data rights requests whose email-verification link
 * has passed its expiry without the requester confirming.
 *
 * An expired, never-confirmed request is no longer actionable — but the attempt
 * stays on the record and in the audit trail ("we asked them to verify and they
 * didn't"), which is itself a defensible response and keeps the queue clean.
 *
 * Admin-only when invoked directly; normally run by a daily automation.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Direct (non-scheduled) invocations must be admin.
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

    const now = Date.now();
    // Only unconfirmed, still-open requests can expire.
    const candidates = await base44.asServiceRole.entities.DataRightsRequest.filter({
      verification_status: 'unverified',
    });

    let expired = 0;
    for (const r of candidates) {
      if (['fulfilled', 'denied'].includes(r.request_status)) continue;
      if (!r.verification_token_expires_at) continue;
      if (new Date(r.verification_token_expires_at).getTime() > now) continue;

      await base44.asServiceRole.entities.DataRightsRequest.update(r.id, {
        verification_status: 'expired',
        verification_token: null,
      });

      if (r.organization) {
        await base44.asServiceRole.entities.AuditEvent.create({
          organization: r.organization,
          related_request: r.id,
          event_type: 'verification_expired',
          actor: 'system',
          description: `Verification link expired before ${r.requester_email} confirmed their identity. Request marked expired and is no longer actionable; the unanswered verification request remains on record.`,
        });
      }
      expired++;
    }

    return Response.json({ success: true, expired });
  } catch (error) {
    console.log(`[expireUnverifiedRequests] error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});