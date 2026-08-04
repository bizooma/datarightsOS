/**
 * Public intake endpoint — authenticated only by a valid site_key.
 * POST /intakeEndpoint
 * Body: { type: "consent" | "rights_request", site_key: string, ...payload }
 *
 * Rights-request throttle: because a rights_request triggers an acknowledgment
 * email to a submitter-supplied address (our sending domain → arbitrary inbox),
 * the endpoint is rate-limited to protect deliverability. Two windowed caps,
 * both measured against DataRightsRequest.created_date:
 *   - per site:  Site.intake_rate_limit_per_hour (default 100) new requests in the window
 *   - per email: max EMAIL_MAX new requests (same site + email) in the window
 *
 * A throttle here would block a consumer from exercising a legal right, so the
 * 429 is never a bare error: it points the consumer to the site's privacy
 * contact email so they always have a way through. Throttled attempts are
 * logged with site, timestamp, and email to tell abuse from a legitimate surge
 * after the fact. Applies ONLY to this public intake endpoint — subscriber
 * dashboard actions create DataRightsRequest rows through the authenticated SDK
 * and never pass through here. Consent events are not throttled (no email).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { canTrackRequests, canShowRequestCard, getVisitorCap } from '../../shared/planLimits.ts';

// Start of the current calendar month (UTC) — the window the Free visitor cap
// counts recorded consent events within. Resets automatically each month.
function startOfCalendarMonthISO(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

const WINDOW_MINUTES = 60;
const DEFAULT_SITE_MAX = 100;
const EMAIL_MAX = 3;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL');

// Forward a privacy request by email to the subscriber (Notice tier). Uses Resend
// so it reliably reaches an arbitrary subscriber inbox. Never throws — a failed
// forward must not break the visitor's confirmation.
async function forwardRequestByEmail(to: string, payload: any) {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !to) return false;
  const { request_type, requester_name, requester_email, requester_state } = payload;
  const typeLabels: Record<string, string> = {
    access: 'Access my data', delete: 'Delete my data',
    correct: 'Correct my data', opt_out: 'Opt out of sale/sharing',
  };
  const when = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET';
  const subject = `New privacy request forwarded — ${typeLabels[request_type] || request_type}`;
  const body = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#14202b;max-width:560px">
      <h2 style="font-size:18px;margin:0 0 12px">You've received a privacy request</h2>
      <table style="font-size:14px;border-collapse:collapse;width:100%">
        <tr><td style="padding:4px 12px 4px 0;color:#6b7a87">Type</td><td style="padding:4px 0;font-weight:600">${typeLabels[request_type] || request_type}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7a87">Name</td><td style="padding:4px 0">${requester_name || '—'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7a87">Email</td><td style="padding:4px 0">${requester_email || '—'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7a87">State</td><td style="padding:4px 0">${requester_state || '—'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7a87">Received</td><td style="padding:4px 0">${when}</td></tr>
      </table>
      <p style="font-size:13px;line-height:1.55;color:#4a5a66;background:#f6f8f9;border:1px solid #e4e9ed;border-radius:8px;padding:12px;margin:16px 0">
        This request was forwarded to you. Your current plan doesn't track privacy requests or response deadlines.
        Most US state laws require a response within 45 days.
      </p>
      <div style="margin:16px 0">
        <a href="https://datarightsos.com/settings" style="display:inline-block;background:#0d7d74;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px">
          Upgrade to Core — track requests &amp; deadlines
        </a>
      </div>
      <p style="font-size:12px;color:#8fa3b3">Core ($99/mo) tracks each request, verifies identity, runs the 45-day statutory clock, and sends acknowledgment &amp; completion emails automatically.</p>
    </div>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: RESEND_FROM_EMAIL, to, subject, html: body, reply_to: requester_email || undefined }),
    });
    if (!res.ok) { console.error('[intake] forward email failed:', res.status, await res.text()); return false; }
    return true;
  } catch (e) {
    console.error('[intake] forward email error:', (e as Error).message);
    return false;
  }
}

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

      // FREE plan visitor cap: capped at getVisitorCap() recorded consent events per
      // calendar month PER SITE. Over the cap we STOP writing records but ALWAYS
      // return success so the widget keeps displaying and enforcing consent — never
      // break a subscriber's site. Only Free is capped; paid plans return null.
      let orgForCap: any = null;
      if (site.organization) {
        try { orgForCap = await base44.asServiceRole.entities.Organization.get(site.organization); } catch { /* ignore */ }
      }
      const cap = getVisitorCap(orgForCap?.plan);
      if (cap != null) {
        const monthStart = startOfCalendarMonthISO();
        const monthRecords = await base44.asServiceRole.entities.ConsentRecord.filter({
          site: site.id,
          created_date: { $gte: monthStart },
        }, '-created_date', cap + 1);
        if ((monthRecords || []).length >= cap) {
          // Cap reached — enforce and confirm, but do not persist a new record.
          return Response.json({ success: true, capped: true }, { headers: corsHeaders });
        }
      }

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

      // Load the owning org once — needed for both the plan gate and the
      // privacy-contact fallback used in throttle messages / forwarding.
      let org: any = null;
      if (site.organization) {
        try { org = await base44.asServiceRole.entities.Organization.get(site.organization); } catch { /* ignore */ }
      }

      // FREE plan does not include privacy-request intake — the widget never shows
      // the card, and nothing is forwarded or tracked. Defense-in-depth: if a
      // request still arrives (stale client), accept it gracefully without storing
      // or forwarding anything, so the visitor isn't left with an error.
      if (!canShowRequestCard(org?.plan)) {
        return Response.json({ success: true, unavailable: true }, { headers: corsHeaders });
      }

      // Resolve the subscriber's privacy contact (site → org fallback).
      const forwardEmail = (site.privacy_contact_email || org?.privacy_contact_email || '').trim();

      // NOTICE TIER: the request-engine is not included. Do NOT create a tracked
      // DataRightsRequest, do NOT verify the email, do NOT start the 45-day clock.
      // Instead forward the submission by email to the subscriber and record a
      // minimal, PII-light counter so the dashboard can prompt an upgrade. The
      // visitor sees the SAME confirmation they'd get on Core — this is the
      // subscriber's plan choice, not theirs.
      if (!canTrackRequests(org?.plan)) {
        const sent = await forwardRequestByEmail(forwardEmail, { request_type, requester_name, requester_email, requester_state });
        try {
          await base44.asServiceRole.entities.RequestForwardLog.create({
            organization: site.organization,
            site: site.id,
            request_type,
            forwarded_at: new Date().toISOString(),
            forward_email_sent: sent,
          });
        } catch (e) {
          console.error('[intake] RequestForwardLog create failed:', (e as Error).message);
        }
        // Same success shape as the tracked path (no statutory_deadline).
        return Response.json({ success: true, forwarded: true }, { headers: corsHeaders });
      }

      // Rate limit before creating anything: a rights_request sends an
      // acknowledgment email to requester_email, so an unthrottled form is an
      // open relay against our sending domain. Cap per site and per email over
      // a rolling window, keyed on created_date. A throttle must never dead-end
      // a real person exercising a legal right, so the 429 always routes them to
      // the site's privacy contact email.
      const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
      const normalizedEmail = String(requester_email).trim().toLowerCase();
      const siteMax = Number(site.intake_rate_limit_per_hour) > 0
        ? Number(site.intake_rate_limit_per_hour)
        : DEFAULT_SITE_MAX;

      // Resolve the contact the consumer can reach directly (site → org fallback).
      const contactEmail = forwardEmail;
      const contactSentence = contactEmail
        ? `Please email ${contactEmail} to submit your request.`
        : `Please contact the business directly to submit your request.`;

      const recentForSite = await base44.asServiceRole.entities.DataRightsRequest.filter({
        site: site.id,
        created_date: { $gte: windowStart },
      });

      if ((recentForSite || []).length >= siteMax) {
        console.log(`[intake] THROTTLED site: site_id=${site.id} domain=${site.domain} email=${normalizedEmail} count=${recentForSite.length} cap=${siteMax} window=${WINDOW_MINUTES}m at=${new Date().toISOString()}`);
        return Response.json(
          { error: `We're receiving an unusually high number of requests right now. ${contactSentence}` },
          { status: 429, headers: corsHeaders },
        );
      }

      const recentForEmail = (recentForSite || []).filter(
        (r) => String(r.requester_email || '').trim().toLowerCase() === normalizedEmail,
      );
      if (recentForEmail.length >= EMAIL_MAX) {
        console.log(`[intake] THROTTLED email: site_id=${site.id} domain=${site.domain} email=${normalizedEmail} count=${recentForEmail.length} cap=${EMAIL_MAX} window=${WINDOW_MINUTES}m at=${new Date().toISOString()}`);
        return Response.json(
          { error: `We've already received several requests from this email address in the past hour. ${contactSentence}` },
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