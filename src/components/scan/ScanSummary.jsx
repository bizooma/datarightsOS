import { summaryHeadline, summaryDomainLine, DOMAIN_EXPLAINER } from '@/components/scan/reportText';

export default function ScanSummary({ scan }) {
  const checks = scan.findings?.checks || {};
  const count = (scan.third_party_domains || []).length;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-2">Summary</h3>
      <p className="text-sm text-foreground">{summaryDomainLine(count)}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{DOMAIN_EXPLAINER}</p>
      <p className="text-sm text-foreground mt-1">{summaryHeadline(checks)}</p>
    </div>
  );
}