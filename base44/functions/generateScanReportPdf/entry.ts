// Renders a completed scan report to PDF via Browserless and caches the file.
//
// COST MODEL (the reason this function exists at all): a report's findings never
// change once the scan is complete, so the PDF is rendered LAZILY on the first
// download and cached on the Scan record. Every later download serves the cached
// file — one paid render per report, not one per download. The render itself
// lives in shared/scanPdf.ts because the email flow needs the same document.
//
// Because scan ids are shareable, an unlimited caller could otherwise walk ids
// and force one render each, so renders carry the SAME per-IP limits as scans
// (3/hour, 10/day). Cache hits are free and are never counted or logged.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { ensureScanPdf, baseOriginFrom, filenameFor } from '../../shared/scanPdf.ts';

const HOUR = 60 * 60 * 1000;

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
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

    const result = await ensureScanPdf(svc, scan, baseOriginFrom(req));
    if (!result.ok) return Response.json({ ok: false, message: result.message });

    await svc.entities.PdfRenderLog.create({ scan: scan.id, requester_ip_hash: ipHash });

    return Response.json(result);
  } catch (error) {
    console.log('[generateScanReportPdf] error: ' + error.message);
    return Response.json({ ok: false, message: 'The PDF could not be generated.' }, { status: 500 });
  }
}