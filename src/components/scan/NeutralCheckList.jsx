import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CHECK_LABELS, statusLabelFor } from '@/components/scan/checkMeta';
import { resolveContext } from '@/components/scan/checkContext';

// Everything not flagged for attention: a compact row per check (name + plain
// status), expandable on click to reveal the same observation, details, and
// context copy the full card shows.
function NeutralRow({ checkKey, check }) {
  const [open, setOpen] = useState(false);
  const ctx = resolveContext(checkKey, check);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium text-foreground">{CHECK_LABELS[checkKey] || checkKey}</span>
        <span className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200">
            {statusLabelFor(checkKey, check)}
          </span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 -mt-0.5">
          <p className="text-sm text-foreground/90">{check?.observation}</p>
          {check?.details?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {check.details.map((d, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {d}</li>
              ))}
            </ul>
          )}
          {ctx.mode === 'full' && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <div>
                <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">Why this matters</p>
                <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{ctx.ctx.why}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">What to check</p>
                <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{ctx.ctx.check}</p>
              </div>
            </div>
          )}
          {ctx.mode === 'note' && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{ctx.note}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function NeutralCheckList({ items }) {
  if (!items.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {items.map(({ key, check }) => (
        <NeutralRow key={key} checkKey={key} check={check} />
      ))}
    </div>
  );
}