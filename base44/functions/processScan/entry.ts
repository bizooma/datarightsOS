// Runs a scan created by startScan: two Browserless sessions (clean load, then a
// load with "Sec-GPC: 1"), analyzes them with the shared Group A checks, and
// writes results to the Scan record.
//
// FAILURE HANDLING (the trust rule): if pass 1 fails, the scan is marked FAILED
// and no findings are reported. If only pass 2 (GPC) fails, checks 1–7 report
// and the GPC comparison is COULD NOT DETERMINE. A failed or partial load is
// never rendered as a negative finding.
//
// Cost control: processes a record only once — a claimed or finished scan is
// returned as-is (this also makes the function a safe read endpoint).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { analyzeScan } from '../../shared/scanChecks.ts';

// Runs inside Browserless. Captures request URLs and (pass 1 only) form field
// TYPES — field values are never read, captured, or stored.
const BROWSER_CODE = `
export default async function ({ page, context }) {
  const requests = [];
  page.on('request', function (r) { try { requests.push(r.url()); } catch (e) {} });
  if (context.gpc) { await page.setExtraHTTPHeaders({ 'Sec-GPC': '1' }); }
  try {
    await page.goto(context.url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    return { data: { requests: requests, forms: null, nav_error: String((e && e.message) || e) }, type: 'application/json' };
  }
  await new Promise(function (r) { setTimeout(r, 4000); });
  let forms = null;
  if (context.collectForms) {
    try {
      forms = await page.evaluate(function () {
        var out = [];
        var allForms = document.querySelectorAll('form');
        for (var i = 0; i < allForms.length; i++) {
          var fields = {};
          var inputs = allForms[i].querySelectorAll('input, textarea, select');
          for (var j = 0; j < inputs.length; j++) {
            var el = inputs[j];
            var type = (el.getAttribute('type') || 'text').toLowerCase();
            if (['hidden', 'submit', 'button', 'checkbox', 'radio', 'password', 'file'].indexOf(type) !== -1) continue;
            var labelText = '';
            if (el.id) {
              var lab = document.querySelector('label[for="' + el.id.replace(/"/g, '') + '"]');
              if (lab) labelText = lab.textContent || '';
            }
            if (!labelText && el.closest) {
              var pl = el.closest('label');
              if (pl) labelText = pl.textContent || '';
            }
            var hint = ((el.getAttribute('name') || '') + ' ' + (el.id || '') + ' ' + (el.getAttribute('placeholder') || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + labelText).toLowerCase();
            if (type === 'email' || /e-?mail/.test(hint)) fields.email = true;
            else if (type === 'tel' || /phone|mobile|\\btel\\b/.test(hint)) fields.phone = true;
            else if (/birth|\\bdob\\b/.test(hint)) fields.date_of_birth = true;
            else if (/address|street|city|\\bzip\\b|postal/.test(hint)) fields.address = true;
            else if (/name/.test(hint)) fields.name = true;
          }
          var keys = Object.keys(fields);
          if (keys.length) out.push({ fields: keys });
        }
        return out;
      });
    } catch (e) { forms = null; }
  }
  return { data: { requests: requests, forms: forms }, type: 'application/json' };
}
`;

async function runPass(url, gpc, token) {
  try {
    const res = await fetch('https://production-sfo.browserless.io/function?token=' + encodeURIComponent(token) + '&timeout=90000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: BROWSER_CODE, context: { url, gpc: !!gpc, collectForms: !gpc } }),
      signal: AbortSignal.timeout(95000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.log('[processScan] browserless HTTP ' + res.status + ': ' + text.slice(0, 300));
      return { ok: false, error: 'Browser session failed (HTTP ' + res.status + ')' };
    }
    const json = await res.json();
    const data = json && json.data !== undefined ? json.data : json;
    if (!data || !Array.isArray(data.requests)) {
      return { ok: false, error: 'Browser session returned no usable data' };
    }
    return { ok: true, requests: data.requests, forms: data.forms ?? null, nav_error: data.nav_error || null };
  } catch (err) {
    console.log('[processScan] pass error (' + (gpc ? 'gpc' : 'clean') + '): ' + String((err && err.message) || err));
    return { ok: false, error: 'Browser session timed out or could not be reached' };
  }
}

function sanitize(scan) {
  if (!scan) return scan;
  const { requester_ip_hash, processing_started_at, ...rest } = scan;
  return rest;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    let body = {};
    try { body = await req.json(); } catch { body = {}; }
    const scanId = String(body.scan_id || '').trim();
    if (!scanId) return Response.json({ ok: false, message: 'Missing scan_id.' }, { status: 400 });

    let scan;
    try { scan = await svc.entities.Scan.get(scanId); } catch { scan = null; }
    if (!scan) return Response.json({ ok: false, message: 'Scan not found.' }, { status: 404 });

    // Finished scans: act as a read endpoint. Never re-run a paid session.
    if (scan.status !== 'running') {
      return Response.json({ ok: true, scan: sanitize(scan) });
    }

    const now = Date.now();

    // Already claimed by another invocation — return current state, caller watches it.
    if (scan.processing_started_at && now - new Date(scan.processing_started_at).getTime() < 5 * 60 * 1000) {
      return Response.json({ ok: true, in_progress: true, scan: sanitize(scan) });
    }

    // Stale record (created long ago, never processed or claim died) — fail it
    // rather than burning sessions on a replayed id.
    if (now - new Date(scan.created_date).getTime() > 60 * 60 * 1000) {
      const failed = await svc.entities.Scan.update(scan.id, {
        status: 'failed',
        error: 'The scan expired before it could be processed.',
        completed_at: new Date().toISOString(),
      });
      return Response.json({ ok: true, scan: sanitize(failed) });
    }

    // Claim it (guards double-processing = double paid sessions).
    await svc.entities.Scan.update(scan.id, { processing_started_at: new Date().toISOString() });

    const token = secrets.get('BROWSERLESS_API_KEY');

    // Pass 1: clean first-time visitor, no cookies, no interaction.
    const pass1 = await runPass(scan.url, false, token);
    if (!pass1.ok) {
      const failed = await svc.entities.Scan.update(scan.id, {
        status: 'failed',
        error: pass1.error,
        completed_at: new Date().toISOString(),
      });
      return Response.json({ ok: true, scan: sanitize(failed) });
    }

    // Pass 2: same load with a Global Privacy Control signal. A failure here
    // does NOT fail the scan — the GPC check reports COULD NOT DETERMINE.
    const pass2 = await runPass(scan.url, true, token);

    const findings = analyzeScan({ url: scan.url, pass1, pass2 });

    const updated = await svc.entities.Scan.update(scan.id, {
      status: 'complete',
      findings: { checks: findings.checks },
      third_party_domains: findings.third_party_domains,
      gpc_pass_failed: !pass2.ok,
      completed_at: new Date().toISOString(),
    });

    return Response.json({ ok: true, scan: sanitize(updated) });
  } catch (error) {
    console.log('[processScan] error: ' + error.message);
    return Response.json({ ok: false, message: error.message }, { status: 500 });
  }
}