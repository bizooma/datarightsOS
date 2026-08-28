import { CHECK_LABELS, STATUS_META } from '@/components/scan/checkMeta';

export default function CheckCard({ checkKey, check }) {
  const meta = STATUS_META[check?.status] || STATUS_META.could_not_determine;
  return (
    <div className="bg-card border border-border rounded-lg p-4">
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
    </div>
  );
}