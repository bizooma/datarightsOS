import { Link } from 'react-router-dom';
import { Lock, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cheapestPlanFor } from '@/lib/planLimits';

// Shown in place of a gated feature when a subscriber tries to open something their
// plan doesn't include (statements, accessibility, request intake, export, consent
// history beyond their window). Names the CHEAPEST plan that includes the feature
// via `feature` and links to billing. Copy stays factual — never claims a plan
// makes anyone "compliant".
export default function UpgradePanel({
  feature = 'request_tracking',
  title,
  description,
  adds = [
    'Tracked record for every privacy request',
    'Identity verification & the 45-day statutory clock',
    'Fulfillment checklists & deadline alerts',
    'Requester acknowledgment & completion emails',
    'Audit trail & CSV export',
  ],
}) {
  const plan = cheapestPlanFor(feature);
  const resolvedTitle = title || `This is a ${plan.label} feature`;
  const resolvedDescription =
    description ||
    `Your current plan doesn't include this. Upgrade to ${plan.label} (${plan.price}) to unlock it.`;

  return (
    <div className="max-w-lg mx-auto my-10 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-5 h-5 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">{resolvedTitle}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{resolvedDescription}</p>
      <ul className="text-left space-y-2 mb-6 max-w-sm mx-auto">
        {adds.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-foreground">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      <Button asChild>
        <Link to="/settings?tab=billing" className="inline-flex items-center gap-2">
          Upgrade to {plan.label}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}