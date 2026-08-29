// Shared PDF rendering for scan reports.
//
// Both the download button (generateScanReportPdf) and the email flow
// (emailScanReport) need the same document, and a report's findings never change
// once complete — so the file is rendered lazily ONCE and cached on the Scan
// record. Whichever path runs first pays for the render; the other reuses it.
import { secrets } from 'base44:runtime';

const PUBLISHED_ORIGIN = 'https://tessera-privacy-pro.base44.app';

const FOOTER_TEMPLATE = `
<div style="width:100%;font-family:Arial,sans-serif;font-size:8.5px;color:#6B7885;padding:0 14mm;display:flex;justify-content:space-between;">
  <span>datarightsos.com</span>
  <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>`;

export function filenameFor(scan) {
  const date = (scan.completed_at ? new Date(scan.completed_at) : new Date()).toISOString().slice(0, 10);
  const domain = String(scan.domain || 'report').replace(/[^a-z0-9.-]/gi, '');
  return `datarightsos-scan-${domain}-${date}.pdf`;
}

// Browserless must be able to reach the page it renders. A preview sandbox host
// is not publicly reachable, so fall back to the published origin there.
export function baseOriginFrom(req) {
  const candidate = req.headers.get('origin') || req.headers.get('referer') || '';
  try {
    const o = new URL(candidate).origin;
    if (o.includes('preview-sandbox') || o.includes('localhost')) return PUBLISHED_ORIGIN;
    return o;
  } catch {
    return PUBLISHED_ORIGIN;
  }
}

export function reportUrlFor(origin, scanId) {
  return `${origin}/scan?id=${scanId}`;
}

// Returns { ok, cached, url, filename } or { ok: false, message }.
// Never rate limits — each caller owns its own limits.
export async function ensureScanPdf(svc, scan, origin) {
  if (scan.pdf_url) {
    return { ok: true, cached: true, url: scan.pdf_url, filename: filenameFor(scan) };
  }

  const printUrl = `${origin}/scan/report/${scan.id}?print=1`;
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
      console.log('[scanPdf] browserless HTTP ' + res.status + ': ' + text.slice(0, 300));
      return { ok: false, message: 'The PDF could not be generated. Please try again shortly.' };
    }
    pdfBytes = new Uint8Array(await res.arrayBuffer());
  } catch (err) {
    console.log('[scanPdf] render error: ' + String((err && err.message) || err));
    return { ok: false, message: 'The PDF could not be generated. Please try again shortly.' };
  }

  if (!pdfBytes || pdfBytes.byteLength < 1000) {
    console.log('[scanPdf] suspiciously small render: ' + (pdfBytes?.byteLength ?? 0) + ' bytes');
    return { ok: false, message: 'The PDF could not be generated. Please try again shortly.' };
  }

  const filename = filenameFor(scan);
  const upload = await svc.integrations.Core.UploadFile({
    file: new File([pdfBytes], filename, { type: 'application/pdf' }),
  });
  const url = upload?.file_url;
  if (!url) return { ok: false, message: 'The PDF could not be saved. Please try again.' };

  await svc.entities.Scan.update(scan.id, { pdf_url: url, pdf_generated_at: new Date().toISOString() });
  return { ok: true, cached: false, url, filename };
}