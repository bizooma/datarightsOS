/**
 * Public intake endpoint — authenticated only by a valid site_key.
 * POST /intakeEndpoint
 * Body: { type: "consent" | "rights_request", site_key: string, ...payload }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

      const now = new Date();
      const deadline = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

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
        request_status: 'new',
        received_date: now.toISOString(),
        statutory_deadline: deadline.toISOString(),
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