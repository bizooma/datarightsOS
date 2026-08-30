import { groupByVendor } from '@/components/scan/vendorDomains';

// Domains grouped by who they belong to. A bare hostname list makes a reader guess,
// and the guess is usually "this is tracking me" — including for our own widget.
export default function ThirdPartyDomains({ domains }) {
  if (!domains?.length) return null;
  const groups = groupByVendor(domains);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Third-party domains observed</h3>
      <ul className="space-y-1.5">
        {groups.map((g, i) => (
          <li key={g.vendor || `unknown-${i}`} className="text-xs text-muted-foreground break-words">
            <span className="text-foreground/80">{g.domains.join(' · ')}</span>
            {g.vendor ? (
              <span className="text-muted-foreground"> ({g.vendor} — {g.role})</span>
            ) : (
              <span className="text-muted-foreground"> (not identified)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}