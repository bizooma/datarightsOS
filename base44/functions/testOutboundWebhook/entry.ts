/**
 * Sends a sample "test.ping" payload to the org's configured webhook_url and
 * returns the HTTP response code (or error) synchronously for the Settings UI.
 * Auth: requires a logged-in user belonging to the target organization.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { organization_id } = await req.json();
    if (!organization_id) return Response.json({ error: 'organization_id is required' }, { status: 400 });

    // The caller must belong to this org (or be a platform admin).
    if (user.organization !== organization_id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orgs = await base44.asServiceRole.entities.Organization.filter({ id: organization_id });
    const org = orgs[0];
    if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 });

    if (!org.webhook_url || !/^https:\/\//i.test(org.webhook_url)) {
      return Response.json({ ok: false, message: 'No valid HTTPS webhook URL is configured.' });
    }

    const payload = {
      event: 'test.ping',
      request_id: 'test_0000',
      request_type: 'access',
      status: 'not_started',
      requester: { name: 'Test Requester', email: 'test@example.com', state: 'CA' },
      authorized_agent: false,
      submitted_at: new Date().toISOString(),
      deadline_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      site_id: 'test_site',
      organization_id: organization_id,
    };

    const body = JSON.stringify(payload);
    const signature = org.webhook_secret ? await hmacSha256Hex(org.webhook_secret, body) : '';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const resp = await fetch(org.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DataRightsOS-Signature': signature,
          'X-DataRightsOS-Event': 'test.ping',
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const status = {
        ok: resp.ok,
        http_code: resp.status,
        at: new Date().toISOString(),
        message: resp.ok ? 'Test delivered' : `HTTP ${resp.status}`,
      };
      await base44.asServiceRole.entities.Organization.update(organization_id, { webhook_last_status: status });
      return Response.json({ ok: resp.ok, http_code: resp.status, message: status.message });
    } catch (err) {
      clearTimeout(timer);
      const aborted = err.name === 'AbortError';
      const message = aborted ? 'Timed out after 8s' : `Network error: ${err.message}`;
      const status = { ok: false, http_code: 0, at: new Date().toISOString(), message };
      await base44.asServiceRole.entities.Organization.update(organization_id, { webhook_last_status: status });
      return Response.json({ ok: false, http_code: 0, message });
    }
  } catch (error) {
    console.log(`[testOutboundWebhook] error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});