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
import { analyzeGroupB, followDiagnostics } from '../../shared/scanGroupB.ts';
import { PATTERNS, CMP_MATCHERS } from '../../shared/scanPatterns.ts';
import { datarightsosProvides } from '../../shared/scanTools.ts';
import { detectBlockedPage, BLOCKED_MESSAGE } from '../../shared/scanBlocked.ts';

// When OUR widget is on the page, what it serves is read from the site's saved
// configuration rather than guessed from the DOM — so a drawer the subscriber
// turned off, or a statement they never wrote, is never credited.
async function resolveOwnWidget(svc, pass1, domain) {
  // Script sources and network requests only — never page text. A page that
  // merely mentions us by name has not installed the widget.
  const hay = [
    pass1.page?.script_hay || '',
    (pass1.requests || []).join(' ').toLowerCase(),
  ].join(' ');
  const ours = CMP_MATCHERS.filter((m) => m.vendor === 'DataRightsOS').some((m) => hay.includes(m.match));
  if (!ours) return null;

  const apex = String(domain || '').toLowerCase().replace(/^www\./, '');
  let sites = [];
  try {
    sites = await svc.entities.Site.filter({ domain: apex });
    if (!sites.length) sites = await svc.entities.Site.filter({ domain: 'www.' + apex });
  } catch { sites = []; }
  const site = sites[0];
  if (!site) return { vendor: 'DataRightsOS', provides: {} };

  let statements = [];
  try {
    statements = await svc.entities.LegalStatement.filter({ site: site.id, is_active: true });
  } catch { statements = []; }

  return datarightsosProvides(
    site.enabled_drawers,
    statements.map((s) => s.statement_type),
  );
}

// Runs inside Browserless. Captures request URLs and (pass 1 only) form field
// TYPES — field values are never read, captured, or stored.
const BROWSER_CODE = `
export default async function ({ page, context }) {
  const requests = [];
  page.on('request', function (r) { try { requests.push(r.url()); } catch (e) {} });
  if (context.gpc) { await page.setExtraHTTPHeaders({ 'Sec-GPC': '1' }); }
  var mainStatus = null;
  try {
    var mainResp = await page.goto(context.url, { waitUntil: 'networkidle2', timeout: 30000 });
    mainStatus = mainResp ? mainResp.status() : null;
  } catch (e) {
    return { data: { requests: requests, forms: null, main_status: mainStatus, nav_error: String((e && e.message) || e) }, type: 'application/json' };
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

        // Consent language is only meaningful as BODY text. Anchor text is
        // stripped before any consent match so a "Cookie Policy" link in a
        // footer can never read as a consent mechanism.
        function textNoLinks(el) {
          try {
            var c = el.cloneNode(true);
            var la = c.querySelectorAll('a');
            for (var z = 0; z < la.length; z++) { if (la[z].parentNode) la[z].parentNode.removeChild(la[z]); }
            return low(c.innerText || c.textContent || '');
          } catch (xe) { return low(el.innerText || ''); }
        }
        var textNoLinksAll = document.body ? textNoLinks(document.body).slice(0, 120000) : '';

        // MAIN CONTENT ONLY — site chrome removed. This is what decides whether a
        // followed page really is the document its link promised. Judging that on
        // whole-page innerText is what produced a false FOUND: a nav bar and footer
        // carrying "Privacy Policy", "Cookie Consent" and a legal disclaimer clear
        // both the length floor and the keyword count on their own, so a page whose
        // actual body said nothing still read as a privacy policy.
        function mainContent() {
          try {
            var host = document.querySelector('main, [role="main"], article') || document.body;
            var c = host.cloneNode(true);
            var junk = c.querySelectorAll('nav,header,footer,aside,script,style,noscript,[role="navigation"],[role="banner"],[role="contentinfo"]');
            for (var z = 0; z < junk.length; z++) { if (junk[z].parentNode) junk[z].parentNode.removeChild(junk[z]); }
            return low(c.innerText || c.textContent || '');
          } catch (me) { return ''; }
        }
        var mainOnly = mainContent().slice(0, 120000);

        // A consent banner is a VISIBLE banner-like element — fixed, sticky, or a
        // dialog — carrying consent language in its own body text (anchor text
        // stripped). Controls are looked for inside that same element only.
        var bannerText = null, bannerControl = false;
        var els = document.querySelectorAll('div,section,aside,dialog,form');
        for (var e = 0; e < els.length && e < 4000; e++) {
          var el = els[e], st = null;
          try { st = window.getComputedStyle(el); } catch (x1) { continue; }
          if (!st) continue;
          if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity || '1') < 0.05) continue;
          var role = low(el.getAttribute('role'));
          var isDialog = role === 'dialog' || role === 'alertdialog'
            || el.getAttribute('aria-modal') === 'true' || el.tagName === 'DIALOG';
          if (st.position !== 'fixed' && st.position !== 'sticky' && !isDialog) continue;
          var raw = low(el.innerText);
          if (!raw || raw.length > 3000) continue;
          if (!hitAny(raw, p.consentText)) continue;
          // Confirm the language is body text, not just a link inside the element.
          var t = textNoLinks(el);
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
        return { url: location.href, title: (document.title || '').slice(0, 300), anchors: anchors, script_hay: scriptHay.slice(0, 20000), form_hay: formHay, text: text, main_text: mainOnly, text_no_links: textNoLinksAll, banner_text: bannerText, banner_control: bannerControl, cpra_icon: cpraIcon };
      }, p);
    };

    try { pageData = await snap(); } catch (e3) { pageData = null; }

    if (pageData) {
      // Link picking with DE-RANKING: a URL under /services/, /solutions/, /blog/ or
      // /products/ is where a site sells or discusses a topic, not where it commits to
      // it — the calibration run followed four such links to marketing pages that then
      // read plausibly as statements. A de-ranked match is kept only as a fallback: it
      // is still followed when nothing better exists (the content-side commitment check
      // is what finally decides), but any non-marketing-shaped match beats it.
      // AUTH/ACCOUNT URLs are de-ranked for a different reason and with the same
      // mechanism: /accessibility/signup?mode=signin matched the accessibility
      // pattern, so we spent a page load on a sign-in form and then named it as the
      // site's accessibility statement. A login screen can never be the document.
      var DERANK = /\\/(services?|solutions|products?|blog|sign-?up|sign-?in|log-?in|logout|register|account|auth|my-?account)(\\/|$|\\?)/;
      var AUTHQ = /[?&](mode|action|screen_?hint|view)=(sign-?in|sign-?up|log-?in|login|register)/;
      var pick = function (list) {
        var fallback = null;
        for (var i = 0; i < pageData.anchors.length; i++) {
          var a = pageData.anchors[i];
          var hrefL = a.href_l || '';
          if (!hrefL || hrefL.indexOf('javascript:') === 0 || hrefL.indexOf('mailto:') === 0 || hrefL.charAt(0) === '#') continue;
          for (var j = 0; j < list.length; j++) {
            if (a.text.indexOf(list[j]) !== -1 || hrefL.indexOf(list[j]) !== -1) {
              var cand = null;
              try { cand = { url: new URL(a.href, pageData.url).href, text: a.text }; } catch (x2) { cand = null; }
              if (!cand) break;
              if (DERANK.test(hrefL) || AUTHQ.test(hrefL)) { if (!fallback) fallback = cand; break; }
              return cand;
            }
          }
        }
        return fallback;
      };

      // HARD CAP: the submitted page plus at most 2 followed pages. No crawling.
      var targets = [];
      var pPick = pick(p.privacy);
      var aPick = pick(p.a11y);
      if (pPick) targets.push({ kind: 'privacy', url: pPick.url, text: pPick.text });
      if (aPick && (!pPick || aPick.url !== pPick.url)) targets.push({ kind: 'accessibility', url: aPick.url, text: aPick.text });

      for (var t = 0; t < targets.length && followed.length < 2; t++) {
        var rec = { kind: targets[t].kind, requested_url: targets[t].url, anchor_text: targets[t].text, ok: false, status: null, final_url: null, text: '', main_text: '', anchors: [], form_hay: '', error: null, settle_note: null };
        try {
          // SETTLE BEFORE READING. This used to be domcontentloaded with an
          // immediate snapshot, which reads a client-rendered legal page while it
          // is still empty — and client-rendered legal pages are common enough that
          // we cannot assume text is in the server response. So: wait for the
          // network to go idle, then hold a further fixed settle period for text
          // painted after the last request resolves.
          var resp = null;
          try {
            resp = await page.goto(targets[t].url, { waitUntil: 'networkidle2', timeout: 25000 });
          } catch (eSettle) {
            // Idle may never arrive on a page with polling or streaming beacons.
            // That is not evidence of a broken page, so we snapshot what did load
            // and note it — the content thresholds still decide the outcome.
            rec.settle_note = String((eSettle && eSettle.message) || eSettle);
          }
          if (resp) rec.status = resp.status();
          await new Promise(function (r) { setTimeout(r, 3000); });
          var s2 = await snap();
          rec.final_url = s2.url;
          rec.text = s2.text.slice(0, 60000);
          rec.main_text = (s2.main_text || '').slice(0, 60000);
          rec.anchors = s2.anchors;
          rec.form_hay = s2.form_hay;
          rec.ok = true;
        } catch (e4) { rec.error = String((e4 && e4.message) || e4); }
        followed.push(rec);
      }
    }
  }

  return { data: { requests: mainRequests, forms: forms, main_status: mainStatus, page: pageData, followed: followed }, type: 'application/json' };
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
      main_status: data.main_status ?? null,
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

    // Did we load the site, or a security check standing in front of it? A blocked
    // load produces NO findings — every check would describe the challenge page.
    // This state is not 'complete', so it is never served from the domain cache.
    const blocked = detectBlockedPage({ status: pass1.main_status, page: pass1.page });
    if (blocked.blocked) {
      console.log('[processScan] blocked: ' + blocked.reason);
      const stopped = await svc.entities.Scan.update(scan.id, {
        status: 'blocked',
        error: BLOCKED_MESSAGE,
        // WHICH signal fired. `error` is the same sentence for every blocked scan,
        // so without this a wrongly-blocked scan cannot be classified later —
        // logs age out, and re-fetching the live domain is the only alternative.
        block_reason: blocked.reason,
        completed_at: new Date().toISOString(),
      });
      return Response.json({ ok: true, scan: sanitize(stopped) });
    }

    // Pass 2: same load with a Global Privacy Control signal. A failure here
    // does NOT fail the scan — the GPC check reports COULD NOT DETERMINE.
    const pass2 = await runPass(scan.url, true, token);

    const findings = analyzeScan({ url: scan.url, pass1, pass2 });

    // Validator audit trail: log the measured inputs for every followed page so a
    // verdict can be checked against its numbers.
    try {
      console.log('[processScan] follow diagnostics: ' + JSON.stringify(followDiagnostics(pass1.followed || [])));
    } catch { /* diagnostics must never break a scan */ }

    // Group B needs two Group A outcomes for its combination flags.
    const tool = await resolveOwnWidget(svc, pass1, scan.domain);
    const groupB = analyzeGroupB({
      url: scan.url,
      pass1,
      tool,
      groupA: {
        trackersPresent: findings.checks.tracking_scripts?.status === 'found',
        chatbotPresent: findings.checks.ai_chatbot?.status === 'found',
      },
    });

    const updated = await svc.entities.Scan.update(scan.id, {
      status: 'complete',
      findings: {
        checks: { ...findings.checks, ...groupB.checks },
        pages_visited: groupB.pages_visited,
        // The validator's measured inputs per followed page (lengths and phrase hits
        // only — never page content). Stored so any FOUND can be audited against the
        // numbers that produced it instead of taken on trust.
        follow_diagnostics: followDiagnostics(pass1.followed || []),
      },
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