// Public entry point for the website scanner. VALIDATES + RATE-LIMITS + creates
// the Scan record. It NEVER calls Browserless — a scan that would exceed a limit
// never reaches the paid API. Processing happens in processScan.
//
// Cost controls (enforced here, before any paid call):
// - 1 scan per domain per hour: a completed scan for the same domain within the
//   last hour is returned from cache instead of re-running.
// - 3 scans per IP per hour, 10 per IP per day: enforced on record creation, so
//   over-limit requests never even get a record processScan could act on.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const HOUR = 60 * 60 * 1000;

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
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
    const raw = String(body.url || '').trim();
    if (!raw) return Response.json({ ok: false, message: 'Enter a website URL to scan.' });

    // Normalize + validate the URL.
    let parsed;
    try { parsed = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw); } catch {
      return Response.json({ ok: false, message: 'That does not look like a valid URL.' });
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return Response.json({ ok: false, message: 'Only http and https URLs can be scanned.' });
    }
    const host = parsed.hostname.toLowerCase();
    const isIpLiteral = /^[\d.]+$/.test(host) || host.includes(':');
    if (isIpLiteral || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || !host.includes('.')) {
      return Response.json({ ok: false, message: 'Enter a public website URL (e.g. example.com).' });
    }
    if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
      return Response.json({ ok: false, message: 'URLs with non-standard ports cannot be scanned.' });
    }

    const now = Date.now();

    // Domain cache: a completed scan for this domain within the last hour is
    // returned as-is — no new browser sessions. `force` bypasses ONLY this cache
    // (a site that just changed must be re-observable); the per-IP limits below
    // still apply, so this can't be used to run unbounded paid sessions.
    const force = body.force === true;
    if (!force) {
      const cachedList = await svc.entities.Scan.filter({ domain: host, status: 'complete' }, '-created_date', 1);
      if (cachedList[0] && now - new Date(cachedList[0].created_date).getTime() < HOUR) {
        return Response.json({ ok: true, cached: true, scan: sanitize(cachedList[0]) });
      }
    }

    // A scan for this domain already in flight? Hand back the same record so the
    // visitor watches it instead of starting a second paid run.
    const runningList = await svc.entities.Scan.filter({ domain: host, status: 'running' }, '-created_date', 1);
    if (runningList[0] && now - new Date(runningList[0].created_date).getTime() < 5 * 60 * 1000) {
      return Response.json({ ok: true, cached: false, scan: sanitize(runningList[0]) });
    }

    // Per-IP rate limits — checked BEFORE creating the record.
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
    const ipHash = await sha256Hex(ip + '|' + secrets.get('BASE44_APP_ID'));
    const recent = await svc.entities.Scan.filter({ requester_ip_hash: ipHash }, '-created_date', 40);
    const inLastHour = recent.filter((s) => now - new Date(s.created_date).getTime() < HOUR).length;
    const inLastDay = recent.filter((s) => now - new Date(s.created_date).getTime() < 24 * HOUR).length;
    if (inLastHour >= 3) {
      return Response.json({ ok: false, reason: 'rate_limited', message: 'Scan limit reached (3 per hour). Please try again in about an hour.' });
    }
    if (inLastDay >= 10) {
      return Response.json({ ok: false, reason: 'rate_limited', message: 'Daily scan limit reached (10 per day). Please try again tomorrow.' });
    }

    const scan = await svc.entities.Scan.create({
      url: parsed.href,
      domain: host,
      status: 'running',
      requester_ip_hash: ipHash,
    });

    return Response.json({ ok: true, cached: false, scan: sanitize(scan) });
  } catch (error) {
    console.log('[startScan] error: ' + error.message);
    return Response.json({ ok: false, message: 'The scan could not be started. Please try again.' }, { status: 500 });
  }
}