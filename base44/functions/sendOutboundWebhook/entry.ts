/**
 * Outbound webhook sender (service-role, internal).
 * Invoked by onRequestCreated and the status-change path. Looks up the org's
 * webhook config, signs the JSON body with HMAC-SHA256, POSTs with timeout +
 * retry/backoff, and records the outcome in Organization.webhook_last_status.
 *
 * Payload (built by the caller):
 *   { event, request_id, request_type, status, requester:{name,email,state},
 *     authorized_agent, submitted_at, deadline_at, site_id, organization_id }
 *
 * Multi-tenant safe: only ever sends an org's request to that same org's
 * configured webhook_url. This function is best-effort — callers must invoke it
 * fault-isolated so a webhook failure never blocks the request save.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PAID_PLANS = ['core', 'proof', 'agency'];

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { organization_id, payload } = await req.json();

    if (!organization_id || !payload) {
      return Response.json({ error: 'organization_id and payload are required' }, { status: 400 });
    }

    let org = null;
    try {
      org = await base44.asServiceRole.entities.Organization.get(organization_id);
    } catch {
      org = null;
    }
    if (!org) {
      console.log(`[webhook] org ${organization_id} not found`);
      return Response.json({ skipped: true, reason: 'org_not_found' });
    }

    // Plan gate + enablement checks.
    if (!PAID_PLANS.includes(org.plan)) {
      return Response.json({ skipped: true, reason: 'plan_not_eligible' });
    }
    if (!org.webhook_enabled || !org.webhook_url) {
      return Response.json({ skipped: true, reason: 'webhook_disabled' });
    }
    if (!/^https:\/\//i.test(org.webhook_url)) {
      return Response.json({ skipped: true, reason: 'invalid_url' });
    }

    const body = JSON.stringify(payload);
    const signature = org.webhook_secret ? await hmacSha256Hex(org.webhook_secret, body) : '';

    const maxAttempts = 3;
    let lastStatus = { ok: false, http_code: 0, at: new Date().toISOString(), message: 'No attempt made' };

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const resp = await fetch(org.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-DataRightsOS-Signature': signature,
            'X-DataRightsOS-Event': payload.event || '',
          },
          body,
          signal: controller.signal,
        });
        clearTimeout(timer);

        lastStatus = {
          ok: resp.ok,
          http_code: resp.status,
          at: new Date().toISOString(),
          message: resp.ok ? 'Delivered' : `HTTP ${resp.status}`,
        };

        // Success or non-retryable client error (4xx) — stop.
        if (resp.ok || (resp.status >= 400 && resp.status < 500)) {
          console.log(`[webhook] org ${organization_id} attempt ${attempt}: HTTP ${resp.status}`);
          break;
        }
        // 5xx — retry.
        console.log(`[webhook] org ${organization_id} attempt ${attempt}: HTTP ${resp.status} (will retry)`);
      } catch (err) {
        clearTimeout(timer);
        const aborted = err.name === 'AbortError';
        lastStatus = {
          ok: false,
          http_code: 0,
          at: new Date().toISOString(),
          message: aborted ? 'Timed out after 8s' : `Network error: ${err.message}`,
        };
        console.log(`[webhook] org ${organization_id} attempt ${attempt}: ${lastStatus.message} (will retry)`);
      }

      // Backoff before next attempt (skip after final attempt).
      if (attempt < maxAttempts) await sleep(attempt * 1000);
    }

    // Record outcome (do not let a write error mask the delivery result).
    try {
      await base44.asServiceRole.entities.Organization.update(organization_id, {
        webhook_last_status: lastStatus,
      });
    } catch (e) {
      console.log(`[webhook] failed to record last_status for org ${organization_id}: ${e.message}`);
    }

    return Response.json({ delivered: lastStatus.ok, status: lastStatus });
  } catch (error) {
    console.log(`[webhook] fatal error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});