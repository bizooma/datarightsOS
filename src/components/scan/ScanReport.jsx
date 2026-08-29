import { AlertTriangle } from 'lucide-react';
import CheckCard from '@/components/scan/CheckCard';
import NeutralCheckList from '@/components/scan/NeutralCheckList';
import { CHECK_ORDER, needsAttention } from '@/components/scan/checkMeta';
import ScanSummary from '@/components/scan/ScanSummary';

export default function ScanReport({ scan }) {
  if (scan.status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">The scan could not be completed</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {scan.error || 'The site could not be loaded in the scan browser.'} No findings are
              reported for an incomplete scan — an unfinished check is never presented as a result.
            </p>
            <p className="text-xs text-muted-foreground mt-2">You can try again in a little while.</p>
          </div>
        </div>
      </div>
    );
  }

  const checks = scan.findings?.checks || {};

  // Attention-flagged findings first and expanded; everything else collapses
  // into the neutral list so the reader sees what matters without scrolling.
  const present = CHECK_ORDER.filter((key) => checks[key]).map((key) => ({ key, check: checks[key] }));
  const flagged = present.filter(({ key, check }) => needsAttention(key, check));
  const neutral = present.filter(({ key, check }) => !needsAttention(key, check));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Scan report for {scan.domain}</h2>
        <p className="text-xs text-muted-foreground mt-1 break-all">
          Page scanned: <span className="font-medium text-foreground/80">{scan.url}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Scanned {scan.completed_at ? new Date(scan.completed_at).toLocaleString() : ''} ·{' '}
          {(scan.third_party_domains || []).length} third-party domains observed on load
        </p>
      </div>

      <ScanSummary scan={scan} />

      <p className="text-xs text-muted-foreground leading-relaxed px-1">
        {/* Scope line — tied to the single-page Group A scan. When Group B follows links to
            policy pages this must be revisited; flag it rather than editing silently. */}
        Findings marked in amber are the ones worth reviewing. The rest is what we observed on the
        page we scanned — not a clean bill of health. We can't see other pages on your site, how it
        behaves for logged-in visitors, or what happens after a form is submitted.
      </p>

      <div className="space-y-3">
        {flagged.map(({ key, check }) => (
          <CheckCard key={key} checkKey={key} check={check} attention />
        ))}
        <NeutralCheckList items={neutral} />
      </div>

      {(scan.third_party_domains || []).length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Third-party domains observed</h3>
          <p className="text-xs text-muted-foreground break-words">
            {scan.third_party_domains.join(' · ')}
          </p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center px-4">
        This report describes network behavior observed at scan time. It reports observations only —
        it makes no statement about legal requirements or obligations and is not legal advice.
      </p>
    </div>
  );
}