/**
 * Fires the outbound webhook when a request transitions to its completed
 * ("fulfilled") status, with event "request.status_changed". Fault-isolated:
 * a webhook failure never affects the request record or any user-facing flow.
 *
 * Triggered by an entity automation on DataRightsRequest update.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data, old_data } = payload;

    if (event?.type !== 'update') {
      return Response.json({ skipped: true, reason: 'not_update' });
    }

    let current = data;
    // If the entity payload was too large to inline, fetch it fresh.
    if (!current && event?.entity_id) {
      current = await base44.asServiceRole.entities.DataRightsRequest.get(event.entity_id);
    }
    if (!current) {
      return Response.json({ skipped: true, reason: 'no_data' });
    }

    const becameComplete =
      current.request_status === 'fulfilled' &&
      (!old_data || old_data.request_status !== 'fulfilled');

    if (!becameComplete) {
      return Response.json({ skipped: true, reason: 'not_completed_transition' });
    }

    if (!current.organization) {
      return Response.json({ skipped: true, reason: 'no_org' });
    }

    // --- Completion email to requester (under the subscriber's identity) ---
    // Centralized in sendRequesterEmail: identity, templates, duplicate guard via
    // completion_sent_at, timestamp, audit, and failure recording. Never blocks.
    try {
      await base44.asServiceRole.functions.invoke('sendRequesterEmail', {
        request_id: current.id || event.entity_id,
        kind: 'completion',
      });
    } catch (compErr) {
      console.log(`[onRequestStatusChanged] completion email failed (non-blocking): ${compErr.message}`);
    }

    const submittedAt = current.received_date || current.created_date || new Date().toISOString();
    const deadlineAt =
      current.statutory_deadline ||
      new Date(new Date(submittedAt).getTime() + 45 * 24 * 60 * 60 * 1000).toISOString();

    const webhookPayload = {
      event: 'request.status_changed',
      request_id: current.id || event.entity_id,
      request_type: current.request_type,
      status: 'complete',
      requester: {
        name: current.requester_name || '',
        email: current.requester_email || '',
        state: current.requester_state || '',
      },
      authorized_agent: !!current.is_authorized_agent,
      submitted_at: submittedAt,
      deadline_at: deadlineAt,
      site_id: current.site || '',
      organization_id: current.organization,
    };

    try {
      await base44.asServiceRole.functions.invoke('sendOutboundWebhook', {
        organization_id: current.organization,
        payload: webhookPayload,
      });
    } catch (whErr) {
      console.log(`[onRequestStatusChanged] webhook failed (non-blocking): ${whErr.message}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.log(`[onRequestStatusChanged] error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});