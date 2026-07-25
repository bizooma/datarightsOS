/**
 * Public intake endpoint — authenticated only by a valid site_key.
 * POST /intakeEndpoint
 * Body: { type: "consent" | "rights_request", site_key: string, ...payload }
 *
 * Rights-request throttle: because a rights_request triggers an acknowledgment
 * email to a submitter-supplied address (our sending domain → arbitrary inbox),
 * the endpoint is rate-limited to protect deliverability. Two windowed caps,
 * both measured against DataRightsRequest.created_date:
 *   - per site:  max SITE_MAX new requests in WINDOW_MINUTES
 *   - per email: max EMAIL_MAX new requests (same site + email) in WINDOW_MINUTES
 * Exceeding either returns HTTP 429 with a clear message; throttled attempts are
 * logged. Consent events are not throttled (they send no email).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const WINDOW_MINUTES = 60;
const SITE_MAX = 20;
const EMAIL_MAX = 3;

Deno.serve(async (req) => {
  // CORS headers for widget cross-origin POSTs
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { type, site_key, ...payload } = body;

    if (!site_key) {
      return Response.json({ error: 'site_key is required' }, { status: 400, headers: corsHeaders });
    }

    // Resolve site by key (service role — public endpoint, no user session)
    const sites = await base44.asServiceRole.entities.Site.filter({ site_key });
    const site = sites[0];
    if (!site) {
      return Response.json({ error: 'Invalid site_key' }, { status: 404, headers: corsHeaders });
    }

    if (type === 'consent') {
      const { action, functional, analytics, advertising, visitor_id, user_agent } = payload;
      if (!action) return Response.json({ error: 'action is required' }, { status: 400, headers: corsHeaders });

      const receiptId = 'cr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);

      const record = await base44.asServiceRole.entities.ConsentRecord.create({
        organization: site.organization,
        site: site.id,
        visitor_id: visitor_id || ('v_anon_' + Math.random().toString(36).substring(2, 12)),
        action,
        necessary: true,
        functional: !!functional,
        analytics: !!analytics,
        advertising: !!advertising,
        gpc_detected: payload.gpc_detected || false,
        region_state: payload.region_state || undefined,
        user_agent: user_agent || undefined,
        policy_version: site.policy_version,
        consent_receipt_id: receiptId,
      });

      return Response.json({ success: true, consent_receipt_id: receiptId, id: record.id }, { headers: corsHeaders });
    }

    if (type === 'rights_request') {
      const { request_type, requester_name, requester_email, requester_state, is_authorized_agent, agent_details } = payload;

      if (!request_type || !requester_name || !requester_email) {
        return Response.json({ error: 'request_type, requester_name, requester_email are required' }, { status: 400, headers: corsHeaders });
      }

      // Rate limit before creating anything: a rights_request sends an
      // acknowledgment email to requester_email, so an unthrottled form is an
      // open relay against our sending domain. Cap per site and per email over
      // a rolling window, keyed on created_date.
      const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
      const normalizedEmail = String(requester_email).trim().toLowerCase();

      const recentForSite = await base44.asServiceRole.entities.DataRightsRequest.filter({
        site: site.id,
        created_date: { $gte: windowStart },
      });

      if ((recentForSite || []).length >= SITE_MAX) {
        console.log(`[intake] THROTTLED site ${site.id} (${site.domain}): ${recentForSite.length} requests in last ${WINDOW_MINUTES}m (cap ${SITE_MAX}). Rejected email=${normalizedEmail}.`);
        return Response.json(
          { error: `Too many requests. This site has reached its limit of ${SITE_MAX} privacy requests per hour. Please try again later.` },
          { status: 429, headers: corsHeaders },
        );
      }

      const recentForEmail = (recentForSite || []).filter(
        (r) => String(r.requester_email || '').trim().toLowerCase() === normalizedEmail,
      );
      if (recentForEmail.length >= EMAIL_MAX) {
        console.log(`[intake] THROTTLED email ${normalizedEmail} on site ${site.id} (${site.domain}): ${recentForEmail.length} requests in last ${WINDOW_MINUTES}m (cap ${EMAIL_MAX}).`);
        return Response.json(
          { error: `Too many requests. You've already submitted ${EMAIL_MAX} privacy requests for this site in the past hour. Please try again later or contact us directly.` },
          { status: 429, headers: corsHeaders },
        );
      }

      const now = new Date();
      const deadline = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
      // Single-use email-verification token. The requester must click the link
      // in their acknowledgment email (within 30 days) to confirm identity.
      const verificationToken = crypto.randomUUID().replace(/-/g, '') + Math.random().toString(36).slice(2, 10);
      const tokenExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const actLabels = {
        delete: 'Delete or de-identify their personal data everywhere it lives',
        access: 'Compile their data (categories, sources, purposes, recipients) in a portable format',
        correct: 'Correct the inaccurate information',
        opt_out: 'Flag do-not-sell/share, disable data sharing in ad/analytics tools, honor GPC',
      };
      const checklistDefs = [
        { key: 'acknowledge', label: 'Acknowledge receipt (within 10 business days)', required: true },
        { key: 'verify_identity', label: "Verify the requester's identity", required: true },
        { key: 'locate_data', label: "Locate the requester's data across your systems", required: true },
        { key: 'act', label: actLabels[request_type] || 'Fulfill the request', required: true },
        { key: 'check_exemptions', label: "Check what you're legally required to keep (exemptions)", required: false },
        { key: 'notify_third_parties', label: 'Notify processors/third parties to delete or stop', required: false },
        { key: 'respond', label: 'Respond to the requester before the deadline', required: true },
        { key: 'log_complete', label: 'Confirm the audit trail is complete', required: true },
      ];
      const fulfillment_checklist = checklistDefs.map(d => ({
        key: d.key, label: d.label, required: d.required,
        applicable: true, done: false, done_by: null, done_at: null,
      }));

      const request = await base44.asServiceRole.entities.DataRightsRequest.create({
        organization: site.organization,
        site: site.id,
        request_type,
        requester_name,
        requester_email,
        requester_state: requester_state || undefined,
        is_authorized_agent: !!is_authorized_agent,
        agent_details: is_authorized_agent ? agent_details : undefined,
        verification_status: 'unverified',
        verification_token: verificationToken,
        verification_token_expires_at: tokenExpiresAt.toISOString(),
        request_status: 'new',
        received_date: now.toISOString(),
        statutory_deadline: deadline.toISOString(),
        fulfillment_checklist,
      });

      await base44.asServiceRole.entities.AuditEvent.create({
        organization: site.organization,
        related_request: request.id,
        event_type: 'request_received',
        actor: 'system',
        description: `${request_type} request submitted by ${requester_name} (${requester_email}) via the embedded widget. Statutory deadline: ${deadline.toISOString().slice(0, 10)}.`,
      });

      return Response.json({ success: true, request_id: request.id, statutory_deadline: deadline.toISOString() }, { headers: corsHeaders });
    }

    return Response.json({ error: 'type must be "consent" or "rights_request"' }, { status: 400, headers: corsHeaders });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
});