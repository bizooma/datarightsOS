import PrintCheckCard from '@/components/scan/print/PrintCheckCard';
import { groupByVendor } from '@/components/scan/vendorDomains';
import { CHECK_ORDER, needsAttention } from '@/components/scan/checkMeta';
import {
  SCOPE_LINE,
  summaryHeadline,
  summaryDomainLine,
  DOMAIN_EXPLAINER,
  ANSWER_CLEAR,
  ANSWER_CLEAR_SUB,
  ANSWER_FLAGGED_SUB,
  answerHeadline,
  flaggedLabels,
  NEXT_STEPS_AMBER,
  NEXT_STEPS_CLEAR,
  NEXT_STEPS_CLOSER,
} from '@/components/scan/reportText';

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
  const answerLabels = flaggedLabels(checks);
  const pagesVisited = scan.findings?.pages_visited || [];

  return (
    <div className="pr-doc">
      {/* The logo is white type — it only reads on the dark ink band. */}
      <div className="pr-band">
        <img src={LOGO_REVERSED} alt="DataRightsOS" />
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
        <p className="pr-summary-note">{DOMAIN_EXPLAINER}</p>
        <p>{summaryHeadline(checks)}</p>
      </div>

      {/* The plain-language answer — our findings, never a status claim. */}
      {answerLabels.length === 0 ? (
        <div className="pr-answer">
          <p className="pr-answer-head">{ANSWER_CLEAR}</p>
          <p className="pr-answer-sub">{ANSWER_CLEAR_SUB}</p>
        </div>
      ) : (
        <div className="pr-answer pr-answer-amber">
          <p className="pr-answer-head">{answerHeadline(answerLabels.length)}</p>
          <ul className="pr-answer-list">
            {answerLabels.map((label) => <li key={label}>{label}</li>)}
          </ul>
          <p className="pr-answer-sub">{ANSWER_FLAGGED_SUB}</p>
        </div>
      )}

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

      <div className="pr-next">
        <h3>What to do next</h3>
        <p>{answerLabels.length > 0 ? NEXT_STEPS_AMBER : NEXT_STEPS_CLEAR}</p>
        <p className="pr-next-closer">{NEXT_STEPS_CLOSER}</p>
      </div>

      {pagesVisited.length > 0 && (
        <div className="pr-domains">
          <h3>Pages we checked</h3>
          {pagesVisited.map((p, i) => (
            <p key={`${p.url}-${i}`}>{p.url}{p.kind ? ` — ${p.kind}` : ''}</p>
          ))}
        </div>
      )}

      {domains.length > 0 && (
        <div className="pr-domains">
          <h3>Third-party domains observed</h3>
          {groupByVendor(domains).map((g, i) => (
            <p key={g.vendor || `unknown-${i}`}>
              {g.domains.join(' · ')}{g.vendor ? ` (${g.vendor} — ${g.role})` : ' (not identified)'}
            </p>
          ))}
        </div>
      )}

      <p className="pr-disclaimer">
        This report describes network behavior observed at scan time. It reports observations only —
        it makes no statement about legal requirements or obligations and is not legal advice.
      </p>
    </div>
  );
}