import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const REQUEST_TYPE_LABELS = {
  access: 'Data Access',
  delete: 'Data Deletion',
  correct: 'Data Correction',
  opt_out: 'Opt-Out of Sale',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data: requestData } = payload;

    if (event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const requestId = event.entity_id;

    // --- 1. Set statutory deadline ---
    const receivedDate = requestData?.received_date
      ? new Date(requestData.received_date)
      : new Date();
    const deadline = new Date(receivedDate.getTime() + 45 * 24 * 60 * 60 * 1000);

    if (!requestData?.statutory_deadline) {
      await base44.asServiceRole.entities.DataRightsRequest.update(requestId, {
        statutory_deadline: deadline.toISOString(),
        received_date: receivedDate.toISOString(),
      });
    }

    const typeLabel = REQUEST_TYPE_LABELS[requestData?.request_type] || requestData?.request_type || 'Privacy';
    const deadlineStr = deadline.toISOString().slice(0, 10);

    // --- 2. Acknowledgment email to requester (sent under the subscriber's identity) ---
    // Centralized in sendRequesterEmail: handles identity, templates, duplicate guard,
    // timestamp, audit, and failure recording. Never blocks request processing.
    try {
      await base44.asServiceRole.functions.invoke('sendRequesterEmail', {
        request_id: requestId,
        kind: 'acknowledgment',
      });
    } catch (ackErr) {
      console.log(`[onRequestCreated] acknowledgment email failed (non-blocking): ${ackErr.message}`);
    }

    // --- 3. Notify assigned user or all org admins ---
    if (requestData?.organization) {
      let notifyEmails = [];

      if (requestData?.assigned_to) {
        // Notify the specific assigned user
        const users = await base44.asServiceRole.entities.User.filter({ id: requestData.assigned_to });
        if (users[0]?.email) notifyEmails = [users[0].email];
      } else {
        // Notify all org admins
        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        notifyEmails = admins.map(u => u.email).filter(Boolean);
      }

      for (const email of notifyEmails) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `New ${typeLabel} Request Requires Attention (Ref: ${requestId.slice(0, 8).toUpperCase()})`,
          body: `A new data rights request has been submitted and requires your attention.

Reference ID: ${requestId.slice(0, 8).toUpperCase()}
Type: ${typeLabel}
Requester: ${requestData.requester_name || 'Unknown'} (${requestData.requester_email || ''})
State: ${requestData.requester_state || 'Not provided'}
Response Deadline: ${deadlineStr}
${requestData.is_authorized_agent ? '\n⚠️  This request was filed by an authorized agent.\n' : ''}
Please log in to review and process this request promptly.`,
        });
      }

      if (notifyEmails.length > 0) {
        await base44.asServiceRole.entities.AuditEvent.create({
          organization: requestData.organization,
          related_request: requestId,
          event_type: 'notification_sent',
          actor: 'system',
          description: `New request notification sent to: ${notifyEmails.join(', ')}.`,
        });
      }

      // --- 4. Initial audit event (intake) ---
      await base44.asServiceRole.entities.AuditEvent.create({
        organization: requestData.organization,
        related_request: requestId,
        event_type: 'request_received',
        actor: 'system',
        description: `${typeLabel} request received from ${requestData.requester_name || 'unknown'} (${requestData.requester_email || ''}). Statutory deadline: ${deadlineStr}.`,
      });
    }

    // --- 5. Outbound webhook (fault-isolated, non-blocking) ---
    // A webhook failure must NEVER affect the saved request or this function's
    // success. Wrapped in its own try/catch; the sender itself never throws into us.
    try {
      const webhookPayload = {
        event: 'request.created',
        request_id: requestId,
        request_type: requestData?.request_type,
        status: 'not_started',
        requester: {
          name: requestData?.requester_name || '',
          email: requestData?.requester_email || '',
          state: requestData?.requester_state || '',
        },
        authorized_agent: !!requestData?.is_authorized_agent,
        submitted_at: receivedDate.toISOString(),
        deadline_at: deadline.toISOString(),
        site_id: requestData?.site || '',
        organization_id: requestData?.organization || '',
      };
      if (requestData?.organization) {
        await base44.asServiceRole.functions.invoke('sendOutboundWebhook', {
          organization_id: requestData.organization,
          payload: webhookPayload,
        });
      }
    } catch (whErr) {
      console.log(`[onRequestCreated] outbound webhook failed (non-blocking): ${whErr.message}`);
    }

    return Response.json({ success: true, deadline: deadline.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});