import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useOrg } from '@/lib/useOrg';
import { canUseAccessibility } from '@/lib/planLimits';
import UpgradePanel from '@/components/billing/UpgradePanel';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { Accessibility } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function AccessibilityReports() {
  const { orgId } = useCurrentUser();
  const { plan, isLoading: orgLoading } = useOrg();
  const navigate = useNavigate();

  const { data: sites = [] } = useQuery({
    queryKey: ['sites', orgId],
    queryFn: () => {
      if (!orgId) return [];
      return base44.entities.Site.filter({ organization: orgId });
    },
    enabled: !!orgId,
  });

  const orgSiteIds = sites.map(s => s.id);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['accessibility-reports', orgSiteIds],
    queryFn: async () => {
      if (orgSiteIds.length === 0) return [];
      const results = await Promise.all(
        orgSiteIds.map(siteId => base44.entities.AccessibilityReport.filter({ site: siteId }, '-created_date', 100))
      );
      return results.flat().sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: orgSiteIds.length > 0,
  });

  const siteMap = Object.fromEntries(sites.map(s => [s.id, s]));

  if (!orgLoading && !canUseAccessibility(plan)) {
    return (
      <div>
        <PageHeader
          title="Accessibility Reports"
          description="Barrier reports submitted through your widget"
        />
        <UpgradePanel
          feature="accessibility"
          title="Accessibility reporting isn't included on the free plan"
          description="The free plan shows cookie consent only. Upgrade to Notice to publish an accessibility statement and collect barrier reports through your widget."
          adds={[
            'Accessibility statement published in your widget',
            'A barrier-report form for visitors',
            'Reports collected and tracked here',
            'All four legal statements in-widget',
          ]}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Accessibility Reports"
        description="Barrier reports submitted through your widget"
      />

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Site</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Page URL</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Description</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Reporter</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  ))}
                </tr>
              ))
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={Accessibility} title="No accessibility reports" description="Barrier reports from your widget will appear here." />
                </td>
              </tr>
            ) : (
              reports.map(r => (
                <tr key={r.id} onClick={() => navigate(`/accessibility/${r.id}`)} className="hover:bg-muted/40 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm">{siteMap[r.site]?.domain || '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-primary truncate max-w-[200px]">{r.page_url}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{r.description}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.reporter_email || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">
                    {r.created_date ? format(new Date(r.created_date), 'MMM d, yyyy') : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}