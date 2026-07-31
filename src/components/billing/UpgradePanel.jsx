import { Link } from 'react-router-dom';
import { Lock, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Shown in place of a Core+ feature when a Notice subscriber tries to open it
// (Request Inbox, Audit Trail, CSV export). Explains what Core adds and links to
// billing. Copy stays factual — never claims a plan makes anyone "compliant".
export default function UpgradePanel({
  title = 'This is a Core feature',
  description = 'Your current plan publishes statements, captures and enforces cookie choices, and forwards privacy requests by email. To track requests and deadlines, upgrade to Core.',
  adds = [
    'Tracked record for every privacy request',
    'Identity verification & the 45-day statutory clock',
    'Fulfillment checklists & deadline alerts',
    'Requester acknowledgment & completion emails',
    'Audit trail & CSV export',
  ],
}) {
  return (
    <div className="max-w-lg mx-auto my-10 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-5 h-5 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{description}</p>
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
          Upgrade to Core
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}