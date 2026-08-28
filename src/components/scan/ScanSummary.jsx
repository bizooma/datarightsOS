import { CHECK_LABELS } from '@/components/scan/checkMeta';

// Facts only — a count and a one-line statement of the most significant observation.
// No score, grade, or rating.
function headline(checks) {
  const pre = checks.pre_consent_tracking;
  if (pre?.status === 'found') {
    return 'Tracking requests fired before any consent choice was recorded.';
  }
  const found = ['google_ads', 'meta_pixel', 'tracking_scripts', 'google_analytics', 'ai_chatbot', 'forms_pii']
    .find((k) => checks[k]?.status === 'found');
  if (found) return `${CHECK_LABELS[found]} was observed on load.`;
  return 'No third-party tracking requests were observed on load.';
}

export default function ScanSummary({ scan }) {
  const checks = scan.findings?.checks || {};
  const count = (scan.third_party_domains || []).length;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-2">Summary</h3>
      <p className="text-sm text-foreground">
        {count} third-party {count === 1 ? 'domain was' : 'domains were'} contacted when this page loaded.
      </p>
      <p className="text-sm text-foreground mt-1">{headline(checks)}</p>
    </div>
  );
}