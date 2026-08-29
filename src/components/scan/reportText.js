import { CHECK_LABELS, CHECK_ORDER, needsAttention } from '@/components/scan/checkMeta';

// Single source of truth for the report's scope statement. The PDF must carry it
// VERBATIM, so both surfaces read it from here — never retype it in one place.
//
// SCOPE NOTE: the scanner now visits up to 3 pages (the submitted URL plus a
// discovered privacy policy and accessibility statement), so this speaks of
// "the pages we checked". The pages actually visited are listed in the report.
export const SCOPE_LINE =
  'Findings marked in amber are the ones worth reviewing. The rest is what we observed on the pages we checked — not a clean bill of health. We can\'t see every page on your site, how it behaves for logged-in visitors, or what happens after a form is submitted.';

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

// "Third-party domain" is jargon. The count means nothing without this line.
export const DOMAIN_EXPLAINER =
  'Third-party domains are other companies your site contacted while loading the page.';

// The plain-language answer that leads the report. It is a statement about OUR
// FINDINGS, never about the reader's legal status — no compliant, non-compliant,
// passing, failing, or safe, in any wording, ever.
export const ANSWER_CLEAR = 'Nothing we observed needs your attention right now.';
export const ANSWER_CLEAR_SUB =
  "That's not the same as a clean bill of health — we only looked at the pages listed below, from the outside. See what we couldn't check below.";
export const ANSWER_FLAGGED_SUB =
  'Details below. Everything else we observed is listed after them.';

export function answerHeadline(count) {
  return `${count} ${count === 1 ? 'thing is' : 'things are'} worth looking at:`;
}

// Labels of the attention-flagged checks, in report order.
export function flaggedLabels(checks) {
  return CHECK_ORDER
    .filter((key) => checks[key] && needsAttention(key, checks[key]))
    .map((key) => CHECK_LABELS[key] || key);
}

export const NEXT_STEPS_AMBER =
  'Start with the items marked in amber above — those are the ones where what your site does and what a visitor expects don\'t line up. Each one has a "what to check" step you can do yourself in a few minutes.';
export const NEXT_STEPS_CLEAR =
  'Nothing here needs immediate attention. Two things worth doing anyway: scan your other pages, especially any with forms or checkout, and re-scan after you make changes to your site.';
export const NEXT_STEPS_CLOSER =
  'Questions about anything in this report? Reply to the email or reach us at datarightsos.com.';

// datarightsos-scan-<domain>-<YYYY-MM-DD>.pdf
export function pdfFilename(scan) {
  const date = (scan?.completed_at ? new Date(scan.completed_at) : new Date()).toISOString().slice(0, 10);
  const domain = String(scan?.domain || 'report').replace(/[^a-z0-9.-]/gi, '');
  return `datarightsos-scan-${domain}-${date}.pdf`;
}