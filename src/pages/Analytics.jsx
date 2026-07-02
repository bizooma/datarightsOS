import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { orgFilter } from '@/lib/tenantUtils';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// A request counts as "fulfilled" when its status is fulfilled; everything not yet
// fulfilled or denied is "pending". Denied requests are tracked separately.
function buildMonthlySummary(requests) {
  const buckets = {};
  requests.forEach(r => {
    const dateStr = r.received_date || r.created_date;
    if (!dateStr) return;
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!buckets[key]) buckets[key] = { key, pending: 0, fulfilled: 0, denied: 0 };
    if (r.request_status === 'fulfilled') buckets[key].fulfilled += 1;
    else if (r.request_status === 'denied') buckets[key].denied += 1;
    else buckets[key].pending += 1;
  });

  return Object.values(buckets)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-12)
    .map(b => {
      const [y, m] = b.key.split('-');
      const label = new Date(Number(y), Number(m) - 1, 1)
        .toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return { ...b, label };
    });
}

export default function Analytics() {
  const { orgId } = useCurrentUser();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['analytics-requests', orgId],
    queryFn: () => {
      if (!orgId) return [];
      return base44.entities.DataRightsRequest.filter(orgFilter(orgId), '-received_date');
    },
    enabled: !!orgId,
  });

  const monthly = buildMonthlySummary(requests);

  const totals = requests.reduce(
    (acc, r) => {
      if (r.request_status === 'fulfilled') acc.fulfilled += 1;
      else if (r.request_status === 'denied') acc.denied += 1;
      else acc.pending += 1;
      return acc;
    },
    { pending: 0, fulfilled: 0, denied: 0 }
  );

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Monthly summary of data rights request volume"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending" value={totals.pending} color="text-amber-600" loading={isLoading} />
        <StatCard label="Fulfilled" value={totals.fulfilled} color="text-emerald-600" loading={isLoading} />
        <StatCard label="Denied" value={totals.denied} color="text-red-600" loading={isLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Requests by Month</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : monthly.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No data yet"
              description="Once requests come in, you'll see monthly volume trends here."
            />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.5rem',
                      border: '1px solid hsl(var(--border))',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="hsl(42 63% 45%)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="fulfilled" name="Fulfilled" stackId="a" fill="hsl(174 82% 26%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color, loading }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        {loading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        )}
      </CardContent>
    </Card>
  );
}