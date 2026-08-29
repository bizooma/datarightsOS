// Emails a completed scan report as a PDF attachment to an address the visitor
// typed in. This endpoint sends mail to an ARBITRARY address, so it is limited
// like the public request intake: 3 sends per IP per hour, 10 per day, 2 per
// scan ever, and never the same report twice to the same address. Refused
// attempts are logged as throttled and send nothing.
//
// The report email is transactional and is sent regardless of the updates
// checkbox. The checkbox is STORED ONLY — nothing is synced to any marketing
// platform and no marketing mail is sent, so there is no marketing message here
// that would need an unsubscribe link.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { ensureScanPdf, baseOriginFrom, reportUrlFor } from '../../shared/scanPdf.ts';

const HOUR = 60 * 60 * 1000;
const PER_IP_HOUR = 3;
const PER_IP_DAY = 10;
const PER_SCAN_TOTAL = 2;

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function bodyFor(domain, reportUrl) {
  return `Here's the scan report for ${domain}, attached as a PDF.

We loaded the page as a first-time visitor and recorded what happened — what
tracking fired, what was disclosed, and what a visitor could and couldn't
find. Findings marked in amber are the ones worth reviewing.

You can also view it online: ${reportUrl}

One thing worth repeating from the report: this isn't a compliance assessment.
We only looked at one page, from the outside. It's a starting point, not a
verdict.

If anything in it raises a question, just reply — this goes to a real person.

— Joe
Bizooma · DataRightsOS
`;
}

function toBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    let body = {};
    try { body = await req.json(); } catch { body = {}; }
    const scanId = String(body.scan_id || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const optIn = body.opt_in === true;

    if (!scanId) return Response.json({ ok: false, message: 'Missing scan_id.' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ ok: false, message: 'Please enter a valid email address.' });
    }

    let scan;
    try { scan = await svc.entities.Scan.get(scanId); } catch { scan = null; }
    if (!scan) return Response.json({ ok: false, message: 'Report not found.' }, { status: 404 });
    if (scan.status !== 'complete') {
      return Response.json({ ok: false, message: 'This report is not ready to send yet.' });
    }

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
    const ipHash = await sha256Hex(ip + '|' + secrets.get('BASE44_APP_ID'));
    const now = Date.now();

    const logThrottle = async (reason) => {
      await svc.entities.ScanReportEmail.create({
        scan: scan.id, domain: scan.domain, email, opted_in: optIn,
        status: 'throttled', throttle_reason: reason, requester_ip_hash: ipHash,
      });
    };

    // Same report, same address — already delivered, nothing to resend.
    const forScan = await svc.entities.ScanReportEmail.filter({ scan: scan.id, status: 'sent' }, '-created_date', 20);
    if (forScan.some((r) => r.email === email)) {
      return Response.json({ ok: true, already_sent: true, message: 'This report has already been emailed to that address.' });
    }
    if (forScan.length >= PER_SCAN_TOTAL) {
      await logThrottle('per-scan cap (2 sends per report)');
      return Response.json({ ok: false, reason: 'rate_limited', message: 'This report has already been emailed twice. You can download the PDF instead.' });
    }

    const byIp = await svc.entities.ScanReportEmail.filter({ requester_ip_hash: ipHash, status: 'sent' }, '-created_date', 40);
    const inHour = byIp.filter((r) => now - new Date(r.created_date).getTime() < HOUR).length;
    const inDay = byIp.filter((r) => now - new Date(r.created_date).getTime() < 24 * HOUR).length;
    if (inHour >= PER_IP_HOUR) {
      await logThrottle('per-IP hourly limit (3 per hour)');
      return Response.json({ ok: false, reason: 'rate_limited', message: 'Email limit reached (3 per hour). Please try again in about an hour.' });
    }
    if (inDay >= PER_IP_DAY) {
      await logThrottle('per-IP daily limit (10 per day)');
      return Response.json({ ok: false, reason: 'rate_limited', message: 'Daily email limit reached (10 per day). Please try again tomorrow.' });
    }

    const resendApiKey = secrets.get('RESEND_API_KEY');
    const fromEmail = secrets.get('RESEND_FROM_EMAIL');
    if (!resendApiKey || !fromEmail) {
      return Response.json({ ok: false, message: 'Email delivery is not configured.' }, { status: 500 });
    }

    // Cached PDF, or render and cache it now.
    const origin = baseOriginFrom(req);
    const pdf = await ensureScanPdf(svc, scan, origin);
    if (!pdf.ok) return Response.json({ ok: false, message: pdf.message });

    const fileRes = await fetch(pdf.url);
    if (!fileRes.ok) {
      console.log('[emailScanReport] could not read cached PDF: HTTP ' + fileRes.status);
      return Response.json({ ok: false, message: 'The report could not be attached. Please try again shortly.' });
    }
    const attachment = toBase64(new Uint8Array(await fileRes.arrayBuffer()));

    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `DataRightsOS <${fromEmail}>`,
        to: [email],
        reply_to: fromEmail,
        subject: `Your scan report for ${scan.domain}`,
        text: bodyFor(scan.domain, reportUrlFor(origin, scan.id)),
        attachments: [{ filename: pdf.filename, content: attachment }],
      }),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text().catch(() => '');
      console.log('[emailScanReport] resend HTTP ' + sendRes.status + ': ' + errText.slice(0, 300));
      return Response.json({ ok: false, message: 'The report could not be emailed. Please try again shortly.' });
    }

    const sentAt = new Date().toISOString();
    await svc.entities.ScanReportEmail.create({
      scan: scan.id, domain: scan.domain, email, opted_in: optIn,
      status: 'sent', requester_ip_hash: ipHash, sent_at: sentAt,
    });
    await svc.entities.Scan.update(scan.id, {
      report_emails: [...(scan.report_emails || []), { email, sent_at: sentAt, opted_in: optIn }],
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.log('[emailScanReport] error: ' + error.message);
    return Response.json({ ok: false, message: 'The report could not be emailed.' }, { status: 500 });
  }
}