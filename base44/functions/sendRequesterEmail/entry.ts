/**
 * Sends a requester-facing email (acknowledgment or completion) under the
 * SUBSCRIBER's identity — from_name = business_name, contact = privacy_contact_email.
 * Never sends from a platform/default identity.
 *
 * Invoked by onRequestCreated (kind="acknowledgment"), onRequestStatusChanged
 * (kind="completion"), and the request detail "Send / Resend" action.
 *
 * Payload: { request_id: string, kind: "acknowledgment" | "completion", force?: boolean }
 *
 * Guards:
 *  - acknowledgment_sent_at / completion_sent_at prevent duplicate sends (unless force).
 *  - Missing privacy_contact_email => not sent (returns reason "no_contact_email").
 *  - Send failures are recorded on the request and never thrown back to the caller.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const REQUEST_TYPE_LABELS = {
  delete: 'Delete my data',
  access: 'Access my data',
  correct: 'Correct my data',
  opt_out: 'Opt out of sale/sharing',
};

const COMPLETION_TYPE_LINES = {
  delete: "We've deleted or de-identified your personal information from our systems and asked our service providers to do the same.",
  access: "Your personal information is available as requested; we'll follow up with the details if not already provided.",
  correct: "We've corrected the information you identified.",
  opt_out: "We've opted you out of the sale and sharing of your personal information.",
};

const DEFAULT_ACK_SUBJECT = 'Confirm your privacy request — {business_name}';
const DEFAULT_ACK_BODY = `Hi {requester_name},

We received your request. To protect your data, we need you to confirm this request really came from you.

Please confirm by clicking this single-use link (it expires in 30 days):
{verification_link}

Until you confirm, we won't act on the request.

For your records:
- Request type: {request_type_label}
- Reference ID: {request_id}
- Date received: {submitted_date}

Once confirmed, we'll complete your request and respond by {deadline_date}. If we need more time, we'll let you know with the reason.

Questions? Reply to this email or contact us at {contact_email}.

— {business_name}`;

const DEFAULT_COMPLETION_SUBJECT = 'Your privacy request is complete — {business_name}';
const DEFAULT_COMPLETION_BODY = `Hi {requester_name},

Your request has been completed:
- Request type: {request_type_label}
- Reference ID: {request_id}
- Completed on: {completion_date}

{type_specific_line}

If you have questions or believe this wasn't handled correctly, reply to this email or contact us at {contact_email}.

— {business_name}`;

function renderTemplate(template, values) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? (values[key] ?? '') : match
  );
}

function fmtDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return String(value).slice(0, 10);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { request_id, kind, force } = await req.json();

    if (!request_id || !['acknowledgment', 'completion'].includes(kind)) {
      return Response.json({ error: 'request_id and a valid kind are required' }, { status: 400 });
    }

    const request = await base44.asServiceRole.entities.DataRightsRequest.get(request_id);
    if (!request) {
      return Response.json({ error: 'request not found' }, { status: 404 });
    }

    const sentField = kind === 'acknowledgment' ? 'acknowledgment_sent_at' : 'completion_sent_at';
    const errorField = kind === 'acknowledgment' ? 'ack_email_error' : 'completion_email_error';

    // Duplicate guard
    if (request[sentField] && !force) {
      return Response.json({ skipped: true, reason: 'already_sent', sent_at: request[sentField] });
    }

    if (!request.requester_email) {
      return Response.json({ skipped: true, reason: 'no_requester_email' });
    }

    // Resolve subscriber identity
    const org = request.organization
      ? await base44.asServiceRole.entities.Organization.get(request.organization)
      : null;

    const businessName = (org?.business_name || org?.name || '').trim();
    const contactEmail = (org?.privacy_contact_email || '').trim();

    // Never send from a wrong / platform identity silently. Instead of failing
    // invisibly, record WHY on the request and in the audit trail so the missing
    // requester email (e.g. verification link) is diagnosable.
    if (!contactEmail) {
      const reasonMsg = `Not sent ${new Date().toISOString().slice(0, 10)}: no privacy contact email configured for the organization. Set it in Settings → Requester Emails.`;
      await base44.asServiceRole.entities.DataRightsRequest.update(request_id, {
        [errorField]: reasonMsg,
      });
      if (request.organization) {
        await base44.asServiceRole.entities.AuditEvent.create({
          organization: request.organization,
          related_request: request_id,
          event_type: 'notification_skipped',
          actor: 'system',
          description: `${kind === 'acknowledgment' ? 'Acknowledgment/verification' : 'Completion'} email not sent — organization has no privacy contact email configured.`,
        });
      }
      return Response.json({ skipped: true, reason: 'no_contact_email' });
    }

    const submittedDate = fmtDate(request.received_date || request.created_date);
    const deadlineDate = fmtDate(request.statutory_deadline);
    const completionDate = fmtDate(request.completed_at || request.fulfilled_date || new Date().toISOString());
    const typeLabel = REQUEST_TYPE_LABELS[request.request_type] || request.request_type || 'Privacy request';

    // Public verification link (single-use). Built from this function's own request
    // origin so it always points at the live deployment.
    const appId = Deno.env.get('BASE44_APP_ID');
    const origin = new URL(req.url).origin;
    const verificationLink = request.verification_token
      ? `${origin}/api/apps/${appId}/functions/verifyRequest?request_id=${request_id}&token=${request.verification_token}`
      : '';

    const values = {
      requester_name: request.requester_name || 'there',
      request_type_label: typeLabel,
      request_id: request_id,
      submitted_date: submittedDate,
      deadline_date: deadlineDate,
      completion_date: completionDate,
      business_name: businessName || 'Privacy Team',
      contact_email: contactEmail,
      verification_link: verificationLink,
      type_specific_line: COMPLETION_TYPE_LINES[request.request_type] || '',
    };

    let subjectTpl, bodyTpl;
    if (kind === 'acknowledgment') {
      subjectTpl = org?.ack_email_subject || DEFAULT_ACK_SUBJECT;
      bodyTpl = org?.ack_email_body || DEFAULT_ACK_BODY;
    } else {
      subjectTpl = org?.completion_email_subject || DEFAULT_COMPLETION_SUBJECT;
      bodyTpl = org?.completion_email_body || DEFAULT_COMPLETION_BODY;
    }

    const subject = renderTemplate(subjectTpl, values);
    const body = renderTemplate(bodyTpl, values);

    // Send via Resend from the platform's verified domain, branded as the subscriber:
    //   from_name = subscriber business name, from_email = verified shared sender,
    //   reply_to = subscriber's privacy_contact_email (replies go to the subscriber).
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
    if (!resendApiKey || !fromEmail) {
      return Response.json({ success: false, error: 'Email delivery is not configured (missing RESEND_API_KEY or RESEND_FROM_EMAIL).' });
    }

    const fromName = (businessName || 'Privacy Team').replace(/[<>"]/g, '');
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [request.requester_email],
          reply_to: contactEmail,
          subject,
          text: body,
        }),
      });
      if (!resendRes.ok) {
        const errBody = await resendRes.text();
        throw new Error(`Resend ${resendRes.status}: ${errBody}`);
      }
    } catch (sendErr) {
      console.log(`[sendRequesterEmail] send failed (${kind}, ${request_id}): ${sendErr.message}`);
      await base44.asServiceRole.entities.DataRightsRequest.update(request_id, {
        [errorField]: `Failed ${new Date().toISOString().slice(0, 10)}: ${sendErr.message}`,
      });
      return Response.json({ success: false, error: sendErr.message });
    }

    // Success: stamp timestamp, clear any prior error, write immutable audit entry.
    const nowIso = new Date().toISOString();
    await base44.asServiceRole.entities.DataRightsRequest.update(request_id, {
      [sentField]: nowIso,
      [errorField]: null,
    });

    if (request.organization) {
      await base44.asServiceRole.entities.AuditEvent.create({
        organization: request.organization,
        related_request: request_id,
        event_type: kind === 'acknowledgment' ? 'acknowledgment_emailed' : 'completion_emailed',
        actor: 'system',
        description: `${kind === 'acknowledgment' ? 'Acknowledgment' : 'Completion'} email sent to ${request.requester_email} as "${businessName || 'Privacy Team'}".`,
      });
    }

    return Response.json({ success: true, sent_at: nowIso, to_email: request.requester_email });
  } catch (error) {
    console.log(`[sendRequesterEmail] error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});