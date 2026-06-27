import { AlertTriangle, CheckCircle2, XCircle, Radio } from 'lucide-react';

// Expanded row content: proves WHAT was enforced and surfaces trackers the
// widget could not block so the subscriber knows which tags to wire through it.
export default function EnforcementDetail({ record, colSpan }) {
  const enforced = Array.isArray(record.enforced_categories) ? record.enforced_categories : [];
  const signals = Array.isArray(record.signals_sent) ? record.signals_sent : [];
  const unmanaged = Array.isArray(record.unmanaged_detected) ? record.unmanaged_detected : [];

  return (
    <tr className="bg-muted/30">
      <td colSpan={colSpan} className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
          {/* Enforcement */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {record.enforcement_applied ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-amber-600" />
              )}
              Enforcement
            </div>
            <p className="text-[13px] mb-2">
              {record.enforcement_applied
                ? 'The widget actively enforced this decision in the browser.'
                : 'No active enforcement was applied — recorded only.'}
            </p>
            {enforced.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {enforced.map(c => (
                  <span key={c} className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[11px] font-medium capitalize">
                    {c} blocked
                  </span>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center gap-1.5 text-[12px]">
              <span className="text-muted-foreground">Verification:</span>
              {record.verification_passed === true ? (
                <span className="text-emerald-700 font-medium">Passed</span>
              ) : record.verification_passed === false ? (
                <span className="text-red-700 font-medium">Failed</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            {record.decision_persisted && (
              <p className="mt-1 text-[11px] text-muted-foreground">Re-applied from a prior visit (no re-prompt).</p>
            )}
          </div>

          {/* Signals */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Radio className="w-3.5 h-3.5 text-primary" />
              Signals sent
            </div>
            {signals.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {signals.map(s => (
                  <span key={s} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-mono">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">No signals recorded.</p>
            )}
          </div>

          {/* Unmanaged trackers */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <AlertTriangle className={`w-3.5 h-3.5 ${unmanaged.length ? 'text-amber-600' : 'text-muted-foreground'}`} />
              Unmanaged trackers
            </div>
            {unmanaged.length > 0 ? (
              <>
                <p className="text-[12px] text-amber-700 mb-2">
                  Detected but NOT blocked — wire these through the widget to enforce them.
                </p>
                <ul className="space-y-1">
                  {unmanaged.map(u => (
                    <li key={u} className="text-[12px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {u}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-[13px] text-muted-foreground">None detected — full enforcement.</p>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}