import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { trialDaysRemaining } from '@/lib/planLimits';

export default function TrialCountdownBanner({ org }) {
  if (!org || org.plan !== 'trial') return null;
  const daysLeft = trialDaysRemaining(org);
  if (daysLeft === null) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm mb-6 bg-red-600 text-white">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 shrink-0 text-white" />
        <span className="font-medium text-white">
          {daysLeft === 0
            ? 'Your free trial ends today.'
            : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left in your free trial.`}
        </span>
      </div>
      <Link to="/settings" className="font-semibold underline shrink-0 text-white hover:text-white/80 transition-colors">
        Upgrade
      </Link>
    </div>
  );
}