import { CHECK_LABELS, statusLabelFor } from '@/components/scan/checkMeta';
import { resolveContext } from '@/components/scan/checkContext';

// Print rendering of one finding. ALWAYS fully expanded — collapsing is a screen
// affordance, and a document that hides half its content is not the report.
// Colors are literal hex here on purpose: this is a fixed-ink print document,
// and print-color-adjust (set on the print page) keeps the amber emphasis.
export default function PrintCheckCard({ checkKey, check, attention = false }) {
  const ctx = resolveContext(checkKey, check);
  return (
    <div className={attention ? 'pr-card pr-card-amber' : 'pr-card'}>
      {attention && <p className="pr-eyebrow">Worth reviewing</p>}
      <div className="pr-card-head">
        <h3 className="pr-card-title">{CHECK_LABELS[checkKey] || checkKey}</h3>
        <span className={attention ? 'pr-pill pr-pill-amber' : 'pr-pill'}>
          {statusLabelFor(checkKey, check)}
        </span>
      </div>
      <p className="pr-observation">{check?.observation}</p>
      {check?.details?.length > 0 && (
        <ul className="pr-details">
          {check.details.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      )}
      {ctx.mode === 'full' && (
        <div className="pr-context">
          <p className="pr-context-label">Why this matters</p>
          <p className="pr-context-body">{ctx.ctx.why}</p>
          <p className="pr-context-label">What to check</p>
          <p className="pr-context-body">{ctx.ctx.check}</p>
        </div>
      )}
      {ctx.mode === 'note' && <p className="pr-note">{ctx.note}</p>}
    </div>
  );
}