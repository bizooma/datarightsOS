import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { exportToCSV, formatStatus } from '@/lib/tenantUtils';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import GeoDeviceInsights from '@/components/consent-log/GeoDeviceInsights';
import { Cookie, Download, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const actionLabels = {
  accept_all: 'Accept All',
  reject_all: 'Reject All',
  save_choices: 'Custom Choices',
  gpc_optout: 'GPC Opt-Out',
};

const actionColors = {
  accept_all: 'bg-emerald-50 text-emerald-700',
  reject_all: 'bg-red-50 text-red-700',
  save_choices: 'bg-blue-50 text-blue-700',
  gpc_optout: 'bg-purple-50 text-purple-700',
};

export default function ConsentLog() {
  const { orgId, isSuperAdmin } = useCurrentUser();
  const [actionFilter, setActionFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: sites = [] } = useQuery({
    queryKey: ['sites', orgId],
    queryFn: () => {
      if (isSuperAdmin) return base44.entities.Site.list();
      if (!orgId) return [];
      return base44.entities.Site.filter({ organization: orgId });
    },
    enabled: !!orgId || isSuperAdmin,
  });

  const orgSiteIds = sites.map(s => s.id);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['consent-records', orgId, orgSiteIds],
    queryFn: async () => {
      if (orgSiteIds.length === 0 && !isSuperAdmin) return [];
      if (isSuperAdmin) return base44.entities.ConsentRecord.list('-created_date', 500);
      // Fetch by each site belonging to org
      const results = await Promise.all(
        orgSiteIds.map(siteId => base44.entities.ConsentRecord.filter({ site: siteId }, '-created_date', 200))
      );
      return results.flat().sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: orgSiteIds.length > 0 || isSuperAdmin,
  });

  const siteMap = Object.fromEntries(sites.map(s => [s.id, s]));

  const filtered = records.filter(r => {
    if (actionFilter !== 'all' && r.action !== actionFilter) return false;
    if (siteFilter !== 'all' && r.site !== siteFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.visitor_id?.toLowerCase().includes(q) &&
        !r.region_state?.toLowerCase().includes(q) &&
        !r.consent_receipt_id?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const handleExport = () => {
    const exportData = filtered.map(r => ({
      consent_receipt_id: r.consent_receipt_id,
      site: siteMap[r.site]?.domain || r.site,
      action: r.action,
      visitor_id: r.visitor_id,
      necessary: r.necessary,
      functional: r.functional,
      analytics: r.analytics,
      advertising: r.advertising,
      gpc_detected: r.gpc_detected,
      region_state: r.region_state,
      policy_version: r.policy_version,
      created_date: r.created_date,
    }));
    exportToCSV(exportData, 'consent_log');
  };

  return (
    <div>
      <PageHeader
        title="Consent Log"
        description="Review visitor consent records across your sites"
        actions={
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9 text-sm">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by visitor ID, state, or receipt…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-white"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40 h-9 text-sm bg-white">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="accept_all">Accept All</SelectItem>
            <SelectItem value="reject_all">Reject All</SelectItem>
            <SelectItem value="save_choices">Custom Choices</SelectItem>
            <SelectItem value="gpc_optout">GPC Opt-Out</SelectItem>
          </SelectContent>
        </Select>
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="w-44 h-9 text-sm bg-white">
            <SelectValue placeholder="All Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {sites.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.domain}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Geographic & Device Insights */}
      {!isLoading && <GeoDeviceInsights records={filtered} />}

      {/* Table */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Receipt ID</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Site</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Action</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Categories</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">GPC</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">State</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(7).fill(0).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState icon={Cookie} title="No consent records" description="Consent records will appear here as visitors interact with your widget." />
                </td>
              </tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-mono text-muted-foreground">{r.consent_receipt_id || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{siteMap[r.site]?.domain || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${actionColors[r.action] || 'bg-muted text-muted-foreground'}`}>
                      {actionLabels[r.action] || r.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <CatDot label="N" active={r.necessary} />
                      <CatDot label="F" active={r.functional} />
                      <CatDot label="A" active={r.analytics} />
                      <CatDot label="Ad" active={r.advertising} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {r.gpc_detected ? (
                      <span className="text-[11px] text-purple-600 font-medium">Detected</span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.region_state || '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">
                    {r.created_date ? format(new Date(r.created_date), 'MMM d, yyyy h:mm a') : '—'}
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

function CatDot({ label, active }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold ${
        active ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
      }`}
      title={`${label}: ${active ? 'Yes' : 'No'}`}
    >
      {label}
    </span>
  );
}