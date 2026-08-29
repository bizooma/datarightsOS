import { CHECK_LABELS, statusLabelFor } from '@/components/scan/checkMeta';
import { contextFor } from '@/components/scan/checkContext';

// Full, expanded card. Used for attention-flagged findings, and for a neutral
// check the reader has expanded from the list.
export default function CheckCard({ checkKey, check, attention = false }) {
  const ctx = contextFor(checkKey, check);
  const statusLabel = statusLabelFor(checkKey, check);
  return (
    <div
      className={`rounded-lg p-4 ${
        attention
          ? 'border-2 border-[#D89B2A] bg-[#FDF6E7] shadow-sm'
          : 'bg-card border border-border'
      }`}
    >
      {attention && (
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#8A5F12] mb-1.5">
          Worth reviewing
        </p>
      )}
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h3 className="text-sm font-semibold text-foreground">{CHECK_LABELS[checkKey] || checkKey}</h3>
        <span
          className={`shrink-0 text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded border ${
            attention
              ? 'bg-[#F7E4B8] text-[#8A5F12] border-[#D89B2A]'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {statusLabel}
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