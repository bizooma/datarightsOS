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
import { analyzeGroupB } from '../../shared/scanGroupB.ts';
import { PATTERNS } from '../../shared/scanPatterns.ts';

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

  // Snapshot the request list BEFORE any Group B navigation. Group A must only
  // ever see traffic from the page the visitor submitted.
  var mainRequests = requests.slice();
  var pageData = null;
  var followed = [];

  if (context.groupB) {
    var p = context.patterns;
    var snap = async function () {
      return await page.evaluate(function (p) {
        function low(s) { return String(s == null ? '' : s).toLowerCase().replace(/\\s+/g, ' ').trim(); }
        function hitAny(hay, list) {
          for (var i = 0; i < list.length; i++) { if (hay.indexOf(list[i]) !== -1) return true; }
          return false;
        }
        var anchors = [];
        var as = document.querySelectorAll('a[href]');
        for (var i = 0; i < as.length && anchors.length < 500; i++) {
          var raw = as[i].getAttribute('href') || '';
          anchors.push({ text: low(as[i].textContent).slice(0, 120), href: raw.slice(0, 400), href_l: low(raw).slice(0, 400) });
        }
        var scriptHay = '';
        var ss = document.querySelectorAll('script');
        for (var k = 0; k < ss.length && scriptHay.length < 20000; k++) {
          scriptHay += ' ' + low(ss[k].getAttribute('src')) + ' ' + low((ss[k].textContent || '').slice(0, 400));
        }
        var formHay = '';
        var fs = document.querySelectorAll('form');
        for (var f = 0; f < fs.length && formHay.length < 8000; f++) { formHay += ' | ' + low(fs[f].innerText).slice(0, 800); }
        var text = low(document.body ? document.body.innerText : '').slice(0, 120000);

        // A consent banner is a VISIBLE fixed/sticky element carrying consent
        // language. Controls are looked for inside that same element only.
        var bannerText = null, bannerControl = false;
        var els = document.querySelectorAll('div,section,aside,dialog,form');
        for (var e = 0; e < els.length && e < 4000; e++) {
          var el = els[e], st = null;
          try { st = window.getComputedStyle(el); } catch (x1) { continue; }
          if (!st) continue;
          if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity || '1') < 0.05) continue;
          if (st.position !== 'fixed' && st.position !== 'sticky') continue;
          var t = low(el.innerText);
          if (!t || t.length > 3000) continue;
          if (!hitAny(t, p.consentText)) continue;
          bannerText = t.slice(0, 300);
          var ctrls = el.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]');
          for (var q = 0; q < ctrls.length; q++) {
            var ct = low((ctrls[q].textContent || '') + ' ' + (ctrls[q].getAttribute('value') || '') + ' ' + (ctrls[q].getAttribute('aria-label') || ''));
            if (hitAny(ct, p.consentControl)) bannerControl = true;
          }
          break;
        }

        // CPRA opt-out icon, when a site uses the standard artwork.
        var cpraIcon = false;
        var cands = document.querySelectorAll('img,svg');
        for (var m = 0; m < cands.length && m < 2000; m++) {
          var g = cands[m];
          var hay = low((g.getAttribute('alt') || '') + ' ' + (g.getAttribute('class') || '') + ' ' + (g.getAttribute('id') || '') + ' ' + (g.getAttribute('src') || ''));
          if (hay.indexOf('privacyoptions') !== -1 || hay.indexOf('privacy-options') !== -1 || hay.indexOf('ccpa-optout') !== -1 || hay.indexOf('optout-icon') !== -1) { cpraIcon = true; break; }
        }
        return { url: location.href, anchors: anchors, script_hay: scriptHay.slice(0, 20000), form_hay: formHay, text: text, banner_text: bannerText, banner_control: bannerControl, cpra_icon: cpraIcon };
      }, p);
    };

    try { pageData = await snap(); } catch (e3) { pageData = null; }

    if (pageData) {
      var pick = function (list) {
        for (var i = 0; i < pageData.anchors.length; i++) {
          var a = pageData.anchors[i];
          var hrefL = a.href_l || '';
          if (!hrefL || hrefL.indexOf('javascript:') === 0 || hrefL.indexOf('mailto:') === 0 || hrefL.charAt(0) === '#') continue;
          for (var j = 0; j < list.length; j++) {
            if (a.text.indexOf(list[j]) !== -1 || hrefL.indexOf(list[j]) !== -1) {
              try { return new URL(a.href, pageData.url).href; } catch (x2) { return null; }
            }
          }
        }
        return null;
      };

      // HARD CAP: the submitted page plus at most 2 followed pages. No crawling.
      var targets = [];
      var pUrl = pick(p.privacy);
      var aUrl = pick(p.a11y);
      if (pUrl) targets.push({ kind: 'privacy', url: pUrl });
      if (aUrl && aUrl !== pUrl) targets.push({ kind: 'accessibility', url: aUrl });

      for (var t = 0; t < targets.length && followed.length < 2; t++) {
        var rec = { kind: targets[t].kind, requested_url: targets[t].url, ok: false, status: null, final_url: null, text: '', anchors: [], form_hay: '', error: null };
        try {
          var resp = await page.goto(targets[t].url, { waitUntil: 'domcontentloaded', timeout: 15000 });
          rec.status = resp ? resp.status() : null;
          var s2 = await snap();
          rec.final_url = s2.url;
          rec.text = s2.text.slice(0, 60000);
          rec.anchors = s2.anchors;
          rec.form_hay = s2.form_hay;
          rec.ok = true;
        } catch (e4) { rec.error = String((e4 && e4.message) || e4); }
        followed.push(rec);
      }
    }
  }

  return { data: { requests: mainRequests, forms: forms, page: pageData, followed: followed }, type: 'application/json' };
}
`;

async function runPass(url, gpc, token) {
  try {
    const res = await fetch('https://production-sfo.browserless.io/function?token=' + encodeURIComponent(token) + '&timeout=90000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Group B only runs on pass 1 — the GPC pass exists purely to compare
      // tracker behavior, and page-content checks never differ by header.
      body: JSON.stringify({
        code: BROWSER_CODE,
        context: { url, gpc: !!gpc, collectForms: !gpc, groupB: !gpc, patterns: PATTERNS },
      }),
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
    return {
      ok: true,
      requests: data.requests,
      forms: data.forms ?? null,
      page: data.page ?? null,
      followed: data.followed ?? [],
      nav_error: data.nav_error || null,
    };
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

    // Group B needs two Group A outcomes for its combination flags.
    const groupB = analyzeGroupB({
      url: scan.url,
      pass1,
      groupA: {
        trackersPresent: findings.checks.tracking_scripts?.status === 'found',
        chatbotPresent: findings.checks.ai_chatbot?.status === 'found',
      },
    });

    const updated = await svc.entities.Scan.update(scan.id, {
      status: 'complete',
      findings: { checks: { ...findings.checks, ...groupB.checks }, pages_visited: groupB.pages_visited },
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