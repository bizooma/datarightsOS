import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const REQUEST_TYPE_LABELS = {
  access: 'Data Access',
  delete: 'Data Deletion',
  correct: 'Data Correction',
  opt_out: 'Opt-Out of Sale',
};

// PLAN AWARENESS: this job deliberately does NOT skip organizations on Free.
// Requests that were already accepted stay fully actionable on every plan — we
// started the statutory clock, so we don't get to block the remedy — and the
// Request Inbox keeps rendering for any org that has existing requests. So the
// reminder never points anyone at a page they cannot use. The link below is a
// direct deep link to the request, which works on every plan.
//
// If that guarantee ever changes, this job must gate on it in the same edit.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    // Target: requests whose deadline is ~7 days from now (within a 24-hour window to handle daily scheduling)
    const windowStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

    // Fetch all open requests (not fulfilled or denied)
    const openRequests = await base44.asServiceRole.entities.DataRightsRequest.filter({
      request_status: 'new',
    });
    const inProgressRequests = await base44.asServiceRole.entities.DataRightsRequest.filter({
      request_status: 'in_progress',
    });
    const awaitingRequests = await base44.asServiceRole.entities.DataRightsRequest.filter({
      request_status: 'awaiting_info',
    });

    const allOpen = [...openRequests, ...inProgressRequests, ...awaitingRequests];

    // Filter to those with deadlines in the 7-day window
    const dueSoon = allOpen.filter(r => {
      if (!r.statutory_deadline) return false;
      const dl = new Date(r.statutory_deadline);
      return dl >= windowStart && dl < windowEnd;
    });

    let reminded = 0;

    for (const request of dueSoon) {
      const deadlineStr = new Date(request.statutory_deadline).toISOString().slice(0, 10);
      const typeLabel = REQUEST_TYPE_LABELS[request.request_type] || request.request_type || 'Privacy';
      const refId = request.id.slice(0, 8).toUpperCase();

      let notifyEmails = [];

      if (request.assigned_to) {
        const users = await base44.asServiceRole.entities.User.filter({ id: request.assigned_to });
        if (users[0]?.email) notifyEmails = [users[0].email];
      } else if (request.organization) {
        // Notify admins/owners belonging ONLY to this request's organization.
        // Multi-tenant SaaS: never notify users from other organizations.
        const orgAdmins = await base44.asServiceRole.entities.User.filter({
          organization: request.organization,
        });
        notifyEmails = orgAdmins
          .filter(u => ['admin', 'owner'].includes(u.role))
          .map(u => u.email)
          .filter(Boolean);
      }

      for (const email of notifyEmails) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `⚠️ Deadline Reminder: ${typeLabel} Request Due in 7 Days (Ref: ${refId})`,
          body: `This is a reminder that the following data rights request is due in 7 days and has not yet been fulfilled.

Reference ID: ${refId}
Type: ${typeLabel}
Requester: ${request.requester_name || 'Unknown'} (${request.requester_email || ''})
Current Status: ${request.request_status}
Statutory Deadline: ${deadlineStr}

Open it here: https://datarightsos.com/request/${request.id}

Please complete this request before the deadline to remain in compliance.`,
        });
      }

      if (notifyEmails.length > 0 && request.organization) {
        await base44.asServiceRole.entities.AuditEvent.create({
          organization: request.organization,
          related_request: request.id,
          event_type: 'notification_sent',
          actor: 'system',
          description: `7-day deadline reminder sent to: ${notifyEmails.join(', ')}. Deadline: ${deadlineStr}.`,
        });
        reminded++;
      }
    }

    return Response.json({ success: true, reminders_sent: reminded });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});