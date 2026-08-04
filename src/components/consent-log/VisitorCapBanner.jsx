import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { getVisitorCap } from '@/lib/planLimits';

// Start of the current calendar month (UTC) — matches the intake endpoint's window.
function startOfCalendarMonthISO() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

// Shows a dashboard banner at 80% and 100% of the Free plan's monthly recorded-
// consent-event cap (per site, summed across the org's sites). Over the cap the
// widget keeps working — this only warns and prompts an upgrade. Renders nothing
// for uncapped (paid) plans or when usage is below 80%.
export default function VisitorCapBanner({ plan, siteIds = [] }) {
  const cap = getVisitorCap(plan);
  const monthStart = startOfCalendarMonthISO();

  const { data: used = 0 } = useQuery({
    queryKey: ['consent-month-count', siteIds, monthStart],
    queryFn: async () => {
      if (siteIds.length === 0) return 0;
      const counts = await Promise.all(
        siteIds.map((id) =>
          base44.entities.ConsentRecord.filter(
            { site: id, created_date: { $gte: monthStart } },
            '-created_date',
            cap + 1
          )
        )
      );
      return counts.reduce((sum, rows) => sum + (rows?.length || 0), 0);
    },
    enabled: cap != null && siteIds.length > 0,
    staleTime: 60_000,
  });

  if (cap == null) return null;
  const pct = (used / cap) * 100;
  if (pct < 80) return null;

  const atCap = used >= cap;

  return (
    <div
      className={`mb-4 flex items-start gap-3 rounded-lg border p-4 ${
        atCap ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${atCap ? 'text-red-600' : 'text-amber-600'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${atCap ? 'text-red-800' : 'text-amber-800'}`}>
          {atCap
            ? `You've hit your free monthly limit of ${cap.toLocaleString()} consent records.`
            : `You've used ${used.toLocaleString()} of ${cap.toLocaleString()} free consent records this month.`}
        </p>
        <p className={`text-xs leading-relaxed mt-1 ${atCap ? 'text-red-700' : 'text-amber-700'}`}>
          {atCap
            ? 'Your widget keeps displaying and enforcing consent normally, but new records will not be logged until the counter resets at the start of next month. Upgrade to keep logging without limits.'
            : 'When you reach the limit, your widget keeps working but stops logging new records until next month. Upgrade to remove the cap.'}
        </p>
        <Link
          to="/settings?tab=billing"
          className={`inline-flex items-center gap-1.5 text-xs font-semibold mt-2 hover:underline ${
            atCap ? 'text-red-700' : 'text-amber-800'
          }`}
        >
          Upgrade to Notice
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}