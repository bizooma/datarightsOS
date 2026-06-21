import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { exportToCSV, orgFilter } from '@/lib/tenantUtils';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Shield, Download, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function AuditTrail() {
  const { orgId, isSuperAdmin } = useCurrentUser();
  const [search, setSearch] = useState('');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['audit-events-all', orgId],
    queryFn: () => {
      if (isSuperAdmin) return base44.entities.AuditEvent.list('-created_date', 500);
      if (!orgId) return [];
      return base44.entities.AuditEvent.filter(orgFilter(orgId), '-created_date', 500);
    },
    enabled: !!orgId || isSuperAdmin,
  });

  const filtered = events.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.event_type?.toLowerCase().includes(q) ||
      e.actor?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    const exportData = filtered.map(e => ({
      date: e.created_date,
      event_type: e.event_type,
      actor: e.actor,
      description: e.description,
      related_request: e.related_request || '',
      related_consent: e.related_consent || '',
    }));
    exportToCSV(exportData, 'audit_trail');
  };

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        description="Immutable record of all compliance activities"
        actions={
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9 text-sm">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-white"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} event{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Date</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Event Type</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Actor</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(4).fill(0).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState icon={Shield} title="No audit events" description="All compliance activities will be recorded here." />
                </td>
              </tr>
            ) : (
              filtered.map(e => (
                <tr key={e.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">
                    {e.created_date ? format(new Date(e.created_date), 'MMM d, yyyy h:mm a') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      {e.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{e.actor}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-md truncate">{e.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}