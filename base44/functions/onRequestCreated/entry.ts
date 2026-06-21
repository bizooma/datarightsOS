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

    // --- 2. Confirmation email to requester ---
    if (requestData?.requester_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: requestData.requester_email,
        subject: `Your ${typeLabel} Request Has Been Received (Ref: ${requestId.slice(0, 8).toUpperCase()})`,
        body: `Hello ${requestData.requester_name || 'there'},

We have received your ${typeLabel} request and it has been logged in our system.

Reference ID: ${requestId.slice(0, 8).toUpperCase()}
Request Type: ${typeLabel}
Date Received: ${receivedDate.toISOString().slice(0, 10)}
Response Deadline: ${deadlineStr}

We are required by law to respond to your request within 45 days. If we need additional time or information, we will contact you.

If you have any questions, please reply to this email with your reference ID.

Thank you,
The Privacy Team`,
      });

      if (requestData?.organization) {
        await base44.asServiceRole.entities.AuditEvent.create({
          organization: requestData.organization,
          related_request: requestId,
          event_type: 'notification_sent',
          actor: 'system',
          description: `Confirmation email sent to requester ${requestData.requester_email} (Ref: ${requestId.slice(0, 8).toUpperCase()}).`,
        });
      }
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

    return Response.json({ success: true, deadline: deadline.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});