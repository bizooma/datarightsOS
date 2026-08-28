import { CHECK_LABELS, STATUS_META } from '@/components/scan/checkMeta';
import { contextFor } from '@/components/scan/checkContext';

export default function CheckCard({ checkKey, check, prominent = false }) {
  const meta = STATUS_META[check?.status] || STATUS_META.could_not_determine;
  const ctx = contextFor(checkKey, check);
  return (
    <div className={`bg-card rounded-lg p-4 ${prominent ? 'border-2 border-primary shadow-sm' : 'border border-border'}`}>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h3 className="text-sm font-semibold text-foreground">{CHECK_LABELS[checkKey] || checkKey}</h3>
        <span className={`shrink-0 text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded border ${meta.cls}`}>
          {meta.label}
        </span>
      </div>
      <p className="text-sm text-foreground/90">{check?.observation}</p>
      {check?.details?.length > 0 && (
        <ul className="mt-2 space-y-1">
          {check.details.map((d, i) => (
            <li key={i} className="text-xs text-muted-foreground">• {d}</li>
          ))}
        </ul>
      )}
      {ctx && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <div>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">Why this matters</p>
            <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{ctx.why}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">What to check</p>
            <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{ctx.check}</p>
          </div>
        </div>
      )}
    </div>
  );
}