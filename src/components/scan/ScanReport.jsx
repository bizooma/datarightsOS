import { AlertTriangle } from 'lucide-react';
import CheckCard from '@/components/scan/CheckCard';
import { CHECK_ORDER } from '@/components/scan/checkMeta';

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

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Scan report for {scan.domain}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Scanned {scan.completed_at ? new Date(scan.completed_at).toLocaleString() : ''} ·{' '}
          {(scan.third_party_domains || []).length} third-party domains observed on load
        </p>
      </div>

      <div className="space-y-3">
        {CHECK_ORDER.map((key) => (
          checks[key] ? <CheckCard key={key} checkKey={key} check={checks[key]} /> : null
        ))}
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