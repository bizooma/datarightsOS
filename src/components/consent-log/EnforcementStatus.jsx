import { ShieldCheck, ShieldAlert } from 'lucide-react';

// "Honored" = enforcement applied AND verification passed AND no unmanaged trackers.
// Anything else is "Recorded only / partial".
export function getEnforcementState(r) {
  const unmanaged = Array.isArray(r.unmanaged_detected) ? r.unmanaged_detected : [];
  const honored =
    r.enforcement_applied === true &&
    r.verification_passed === true &&
    unmanaged.length === 0;
  return { honored, unmanaged };
}

export default function EnforcementStatus({ record }) {
  const { honored, unmanaged } = getEnforcementState(record);

  if (honored) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
        <ShieldCheck className="w-3 h-3" />
        Honored
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700"
      title={unmanaged.length ? `${unmanaged.length} unmanaged tracker(s) detected` : 'Enforcement or verification did not fully pass'}
    >
      <ShieldAlert className="w-3 h-3" />
      Recorded only / partial
    </span>
  );
}