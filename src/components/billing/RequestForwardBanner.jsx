import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Inbox, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Notice-tier upgrade trigger: counts privacy requests FORWARDED (not tracked)
// this calendar month and prompts an upgrade to Core. Renders nothing unless the
// org is on a non-tracking plan AND has received at least one request this month.
export default function RequestForwardBanner({ orgId, canTrack }) {
  const monthStart = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  })();

  const { data: count = 0 } = useQuery({
    queryKey: ['request-forward-count', orgId, monthStart],
    queryFn: async () => {
      if (!orgId) return 0;
      const rows = await base44.entities.RequestForwardLog.filter({
        organization: orgId,
        forwarded_at: { $gte: monthStart },
      });
      return (rows || []).length;
    },
    enabled: !!orgId && !canTrack,
  });

  if (canTrack || count < 1) return null;

  return (
    <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Inbox className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">
          You've received {count} privacy request{count !== 1 ? 's' : ''} this month
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          These were forwarded to your privacy contact by email. Your current plan doesn't track
          requests or response deadlines — most US state laws require a response within 45 days.
        </p>
      </div>
      <Button asChild size="sm" className="shrink-0">
        <Link to="/settings?tab=billing" className="inline-flex items-center gap-1.5">
          Upgrade to Core
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </Button>
    </div>
  );
}