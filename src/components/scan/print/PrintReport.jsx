import PrintCheckCard from '@/components/scan/print/PrintCheckCard';
import { CHECK_ORDER, needsAttention } from '@/components/scan/checkMeta';
import { SCOPE_LINE, summaryHeadline, summaryDomainLine } from '@/components/scan/reportText';

const LOGO_REVERSED = 'https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/9c1b23b5f_logo-horizontal-reversed.svg';

// The report laid out for print. Same content and same order as the web report:
// amber-flagged findings first and emphasized, neutral findings after — but every
// finding is expanded, because a document can't be clicked open.
export default function PrintReport({ scan }) {
  const checks = scan.findings?.checks || {};
  const present = CHECK_ORDER.filter((key) => checks[key]).map((key) => ({ key, check: checks[key] }));
  const flagged = present.filter(({ key, check }) => needsAttention(key, check));
  const neutral = present.filter(({ key, check }) => !needsAttention(key, check));
  const domains = scan.third_party_domains || [];

  return (
    <div className="pr-doc">
      {/* The logo is white type — it only reads on the dark ink band. */}
      <div className="pr-band">
        <img src={LOGO_REVERSED} alt="Data Rights OS" />
        <p className="pr-band-kicker">Website Tracking Scan Report</p>
      </div>

      <div className="pr-meta">
        <p className="pr-meta-row"><strong>Page scanned:</strong> {scan.url}</p>
        <p className="pr-meta-row">
          <strong>Scanned:</strong>{' '}
          {scan.completed_at ? new Date(scan.completed_at).toLocaleString() : ''}
        </p>
      </div>

      <div className="pr-summary">
        <h2>Summary</h2>
        <p>{summaryDomainLine(domains.length)}</p>
        <p>{summaryHeadline(checks)}</p>
      </div>

      <p className="pr-scope">{SCOPE_LINE}</p>

      {flagged.length > 0 && (
        <>
          <p className="pr-section-label">Findings worth reviewing</p>
          {flagged.map(({ key, check }) => (
            <PrintCheckCard key={key} checkKey={key} check={check} attention />
          ))}
        </>
      )}

      {neutral.length > 0 && (
        <>
          <p className="pr-section-label">Everything else we observed</p>
          {neutral.map(({ key, check }) => (
            <PrintCheckCard key={key} checkKey={key} check={check} />
          ))}
        </>
      )}

      {domains.length > 0 && (
        <div className="pr-domains">
          <h3>Third-party domains observed</h3>
          <p>{domains.join(' · ')}</p>
        </div>
      )}

      <p className="pr-disclaimer">
        This report describes network behavior observed at scan time. It reports observations only —
        it makes no statement about legal requirements or obligations and is not legal advice.
      </p>
    </div>
  );
}