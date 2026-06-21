import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigate } from 'react-router-dom';

export default function Organizations() {
  const { isSuperAdmin, loading } = useCurrentUser();

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['all-organizations'],
    queryFn: () => base44.entities.Organization.list('-created_date'),
    enabled: isSuperAdmin,
  });

  if (!loading && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const planColors = {
    trial: 'bg-gray-100 text-gray-600',
    starter: 'bg-blue-50 text-blue-700',
    pro: 'bg-primary/10 text-primary',
    agency: 'bg-amber-50 text-amber-700',
  };

  const billingColors = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    past_due: 'bg-amber-50 text-amber-700 border-amber-200',
    canceled: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Manage all tenant organizations (Super Admin)"
      />

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Organization</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Plan</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Billing</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Brand Color</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(5).fill(0).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  ))}
                </tr>
              ))
            ) : orgs.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState icon={Building2} title="No organizations" description="Organizations will appear here." />
                </td>
              </tr>
            ) : (
              orgs.map(org => (
                <tr key={org.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{org.name}</p>
                    <p className="text-[11px] text-muted-foreground">{org.white_label_product_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={`text-[11px] capitalize ${planColors[org.plan] || ''}`}>
                      {org.plan}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${billingColors[org.billing_status] || ''}`}>
                      {org.billing_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: org.brand_primary_color || '#0d7d74' }} />
                      <span className="text-[12px] font-mono text-muted-foreground">{org.brand_primary_color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">
                    {org.created_date ? new Date(org.created_date).toLocaleDateString() : '—'}
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