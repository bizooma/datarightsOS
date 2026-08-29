import { CHECK_LABELS } from '@/components/scan/checkMeta';

// Single source of truth for the report's scope statement. The PDF must carry it
// VERBATIM, so both surfaces read it from here — never retype it in one place.
//
// SCOPE NOTE: this wording describes a single-page Group A scan. When Group B
// lands and the scanner follows links to policy pages, this line stops being
// accurate and must be revisited deliberately rather than edited in passing.
export const SCOPE_LINE =
  'Findings marked in amber are the ones worth reviewing. The rest is what we observed on the page we scanned — not a clean bill of health. We can\'t see other pages on your site, how it behaves for logged-in visitors, or what happens after a form is submitted.';

// Facts only — a count and a one-line statement of the most significant
// observation. No score, grade, or rating.
export function summaryHeadline(checks) {
  const pre = checks.pre_consent_tracking;
  if (pre?.status === 'found') {
    return 'Tracking requests fired before any consent choice was recorded.';
  }
  const found = ['google_ads', 'meta_pixel', 'tracking_scripts', 'google_analytics', 'ai_chatbot', 'forms_pii']
    .find((k) => checks[k]?.status === 'found');
  if (found) return `${CHECK_LABELS[found]} was observed on load.`;
  return 'No third-party tracking requests were observed on load.';
}

export function summaryDomainLine(count) {
  return `${count} third-party ${count === 1 ? 'domain was' : 'domains were'} contacted when this page loaded.`;
}

// datarightsos-scan-<domain>-<YYYY-MM-DD>.pdf
export function pdfFilename(scan) {
  const date = (scan?.completed_at ? new Date(scan.completed_at) : new Date()).toISOString().slice(0, 10);
  const domain = String(scan?.domain || 'report').replace(/[^a-z0-9.-]/gi, '');
  return `datarightsos-scan-${domain}-${date}.pdf`;
}