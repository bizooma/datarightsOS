import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { trialDaysRemaining } from '@/lib/planLimits';

export default function TrialCountdownBanner({ org }) {
  if (!org || org.plan !== 'trial') return null;
  const daysLeft = trialDaysRemaining(org);
  if (daysLeft === null) return null;

  const urgent = daysLeft <= 2;

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm mb-6 border ${
      urgent ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-accent/10 border-accent/30 text-accent-foreground'
    }`}>
      <div className="flex items-center gap-2">
        <Clock className={`w-4 h-4 shrink-0 ${urgent ? 'text-destructive' : 'text-accent'}`} />
        <span className="font-medium text-foreground">
          {daysLeft === 0
            ? 'Your free trial ends today.'
            : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left in your free trial.`}
        </span>
      </div>
      <Link to="/settings" className="font-semibold underline shrink-0 text-foreground hover:text-primary transition-colors">
        Upgrade
      </Link>
    </div>
  );
}