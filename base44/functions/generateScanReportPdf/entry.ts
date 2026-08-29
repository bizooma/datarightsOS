// Renders a completed scan report to PDF via Browserless and caches the file.
//
// COST MODEL (the reason this function exists at all): a report's findings never
// change once the scan is complete, so the PDF is rendered LAZILY on the first
// download and cached on the Scan record. Every later download serves the cached
// file — one paid render per report, not one per download.
//
// Because scan ids are shareable, an unlimited caller could otherwise walk ids
// and force one render each, so renders carry the SAME per-IP limits as scans
// (3/hour, 10/day). Cache hits are free and are never counted or logged.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const HOUR = 60 * 60 * 1000;

// Fallback only — normally the live origin the request came from is used, so a
// custom domain renders itself.
const PUBLISHED_ORIGIN = 'https://tessera-privacy-pro.base44.app';

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function filenameFor(scan) {
  const date = (scan.completed_at ? new Date(scan.completed_at) : new Date()).toISOString().slice(0, 10);
  const domain = String(scan.domain || 'report').replace(/[^a-z0-9.-]/gi, '');
  return `datarightsos-scan-${domain}-${date}.pdf`;
}

// Browserless must be able to reach the page it renders. A preview sandbox host
// is not publicly reachable, so fall back to the published origin there.
function baseOriginFrom(req) {
  const candidate = req.headers.get('origin') || req.headers.get('referer') || '';
  try {
    const o = new URL(candidate).origin;
    if (o.includes('preview-sandbox') || o.includes('localhost')) return PUBLISHED_ORIGIN;
    return o;
  } catch {
    return PUBLISHED_ORIGIN;
  }
}

const FOOTER_TEMPLATE = `
<div style="width:100%;font-family:Arial,sans-serif;font-size:8.5px;color:#6B7885;padding:0 14mm;display:flex;justify-content:space-between;">
  <span>datarightsos.com</span>
  <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>`;

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
    if (!scan) return Response.json({ ok: false, message: 'Report not found.' }, { status: 404 });

    // Only a complete report becomes a document. An incomplete or failed scan has
    // no findings to publish, and a PDF of one would read as a result.
    if (scan.status !== 'complete') {
      return Response.json({ ok: false, message: 'This report is not available as a PDF yet.' });
    }

    // Cached file — free path, no rate limiting, no Browserless call.
    if (scan.pdf_url) {
      return Response.json({ ok: true, cached: true, url: scan.pdf_url, filename: filenameFor(scan) });
    }

    // Per-IP render limits, mirroring the scanner's.
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
    const ipHash = await sha256Hex(ip + '|' + secrets.get('BASE44_APP_ID'));
    const now = Date.now();
    const recent = await svc.entities.PdfRenderLog.filter({ requester_ip_hash: ipHash }, '-created_date', 40);
    const inLastHour = recent.filter((r) => now - new Date(r.created_date).getTime() < HOUR).length;
    const inLastDay = recent.filter((r) => now - new Date(r.created_date).getTime() < 24 * HOUR).length;
    if (inLastHour >= 3) {
      return Response.json({ ok: false, reason: 'rate_limited', message: 'PDF limit reached (3 per hour). Please try again in about an hour.' });
    }
    if (inLastDay >= 10) {
      return Response.json({ ok: false, reason: 'rate_limited', message: 'Daily PDF limit reached (10 per day). Please try again tomorrow.' });
    }

    const printUrl = `${baseOriginFrom(req)}/scan/report/${scan.id}?print=1`;
    const token = secrets.get('BROWSERLESS_API_KEY');

    let pdfBytes;
    try {
      const res = await fetch('https://production-sfo.browserless.io/pdf?token=' + encodeURIComponent(token), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: printUrl,
          gotoOptions: { waitUntil: 'networkidle2', timeout: 45000 },
          options: {
            format: 'Letter',
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: FOOTER_TEMPLATE,
            margin: { top: '14mm', bottom: '18mm', left: '0mm', right: '0mm' },
          },
        }),
        signal: AbortSignal.timeout(70000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.log('[generateScanReportPdf] browserless HTTP ' + res.status + ': ' + text.slice(0, 300));
        return Response.json({ ok: false, message: 'The PDF could not be generated. Please try again shortly.' });
      }
      pdfBytes = new Uint8Array(await res.arrayBuffer());
    } catch (err) {
      console.log('[generateScanReportPdf] render error: ' + String((err && err.message) || err));
      return Response.json({ ok: false, message: 'The PDF could not be generated. Please try again shortly.' });
    }

    if (!pdfBytes || pdfBytes.byteLength < 1000) {
      console.log('[generateScanReportPdf] suspiciously small render: ' + (pdfBytes?.byteLength ?? 0) + ' bytes');
      return Response.json({ ok: false, message: 'The PDF could not be generated. Please try again shortly.' });
    }

    const filename = filenameFor(scan);
    const upload = await svc.integrations.Core.UploadFile({
      file: new File([pdfBytes], filename, { type: 'application/pdf' }),
    });
    const url = upload?.file_url;
    if (!url) return Response.json({ ok: false, message: 'The PDF could not be saved. Please try again.' });

    await svc.entities.Scan.update(scan.id, { pdf_url: url, pdf_generated_at: new Date().toISOString() });
    await svc.entities.PdfRenderLog.create({ scan: scan.id, requester_ip_hash: ipHash });

    return Response.json({ ok: true, cached: false, url, filename });
  } catch (error) {
    console.log('[generateScanReportPdf] error: ' + error.message);
    return Response.json({ ok: false, message: 'The PDF could not be generated.' }, { status: 500 });
  }
}