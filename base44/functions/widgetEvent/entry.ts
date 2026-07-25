import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function sanitize(s, maxLen = 500) {
  if (typeof s !== 'string') return '';
  return s.slice(0, maxLen).replace(/[<>]/g, '');
}

function generateReceiptId() {
  return 'cr_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const rateLimitMap = new Map();
function isRateLimited(key) {
  const now = Date.now();
  const window = 60_000;
  const limit = 30;
  const entry = rateLimitMap.get(key) || { count: 0, start: now };
  if (now - entry.start > window) {
    rateLimitMap.set(key, { count: 1, start: now });
    return false;
  }
  if (entry.count >= limit) return true;
  entry.count++;
  rateLimitMap.set(key, entry);
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: CORS });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return Response.json({ error: 'rate limited' }, { status: 429, headers: CORS });
  }

  const body = await req.json();

  const siteKey = sanitize(body.site_key, 100);
  if (!siteKey) return Response.json({ error: 'missing site_key' }, { status: 400, headers: CORS });

  if (isRateLimited('sk_' + siteKey)) {
    return Response.json({ error: 'rate limited' }, { status: 429, headers: CORS });
  }

  const base44 = createClientFromRequest(req);

  const sites = await base44.asServiceRole.entities.Site.filter({ site_key: siteKey });
  if (!sites || sites.length === 0) return Response.json({ error: 'not found' }, { status: 404, headers: CORS });
  const site = sites[0];

  const userAgent = sanitize(req.headers.get('user-agent') || '', 500);
  // Infer US state from edge geo headers (Cloudflare / common proxies). Best-effort, no widget change needed.
  const regionState = sanitize(
    req.headers.get('cf-region-code') ||
    req.headers.get('x-vercel-ip-country-region') ||
    req.headers.get('x-region-code') || '',
    50
  );
  const now = new Date().toISOString();
  const deadline = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString();
  const type = body.type;
  const visitorId = sanitize(body.visitor_id, 100);
  const gpcDetected = body.gpc_detected === true;

  if (type === 'consent') {
    // Enforcement evidence reported by the widget. These prove the decision was
    // actually honored client-side, not merely recorded.
    const enf = body.enforcement || {};
    const asStringList = (v) => Array.isArray(v) ? v.map(x => sanitize(String(x), 120)).filter(Boolean).slice(0, 50) : [];

    await base44.asServiceRole.entities.ConsentRecord.create({
      organization: site.organization,
      site: site.id,
      visitor_id: visitorId,
      action: body.action,
      necessary: true,
      functional: body.functional === true,
      analytics: body.analytics === true,
      advertising: body.advertising === true,
      gpc_detected: gpcDetected,
      user_agent: userAgent,
      region_state: regionState,
      policy_version: site.policy_version || '1.0',
      consent_receipt_id: generateReceiptId(),
      enforcement_applied: enf.enforcement_applied === true,
      enforced_categories: asStringList(enf.enforced_categories),
      signals_sent: asStringList(enf.signals_sent),
      unmanaged_detected: asStringList(enf.unmanaged_detected),
      verification_passed: typeof enf.verification_passed === 'boolean' ? enf.verification_passed : undefined,
      decision_persisted: enf.decision_persisted === true,
    });

  } else if (type === 'rights_request') {
    const rEmail = sanitize(body.requester_email, 200);
    if (!rEmail) return Response.json({ error: 'requester_email required' }, { status: 400, headers: CORS });

    const request = await base44.asServiceRole.entities.DataRightsRequest.create({
      organization: site.organization,
      site: site.id,
      request_type: body.request_type,
      requester_name: sanitize(body.requester_name, 200),
      requester_email: rEmail,
      requester_state: sanitize(body.requester_state, 50),
      is_authorized_agent: body.is_authorized_agent === true,
      agent_details: sanitize(body.agent_details, 500),
      verification_status: 'unverified',
      request_status: 'new',
      received_date: now,
      statutory_deadline: deadline,
    });

    await base44.asServiceRole.entities.AuditEvent.create({
      organization: site.organization,
      related_request: request.id,
      event_type: 'request_received',
      actor: 'widget',
      description: `${body.request_type} request received via widget from ${rEmail}`,
    });

  } else if (type === 'accessibility_report') {
    await base44.asServiceRole.entities.AccessibilityReport.create({
      organization: site.organization,
      site: site.id,
      page_url: sanitize(body.page_url, 500),
      description: sanitize(body.description, 2000),
      reporter_email: sanitize(body.reporter_email, 200),
      status: 'new',
    });

  } else {
    return Response.json({ error: 'unknown type' }, { status: 400, headers: CORS });
  }

  return Response.json({ ok: true }, { status: 200, headers: CORS });
});