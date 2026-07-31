import { useState, Fragment } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { exportToCSV, formatStatus } from '@/lib/tenantUtils';
import { canExportOwn, getPlanLimits } from '@/lib/planLimits';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import GeoDeviceInsights from '@/components/consent-log/GeoDeviceInsights';
import UnmanagedTrackerAlert from '@/components/consent-log/UnmanagedTrackerAlert';
import ColumnHeader from '@/components/consent-log/ColumnHeader';
import EnforcementStatus, { getEnforcementState } from '@/components/consent-log/EnforcementStatus';
import EnforcementDetail from '@/components/consent-log/EnforcementDetail';
import { Cookie, Download, Search, Filter, ChevronDown, ChevronRight } from 'lucide-react';
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
  const { orgId } = useCurrentUser();
  const [actionFilter, setActionFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const { data: sites = [] } = useQuery({
    queryKey: ['sites', orgId],
    queryFn: () => {
      if (!orgId) return [];
      return base44.entities.Site.filter({ organization: orgId });
    },
    enabled: !!orgId,
  });

  const { data: org } = useQuery({
    queryKey: ['org', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const rows = await base44.entities.Organization.filter({ id: orgId });
      return rows[0] || null;
    },
    enabled: !!orgId,
  });

  const plan = org?.plan;
  const canExport = canExportOwn(plan);
  // Notice tier: show only the most recent N days in the dashboard. Older records
  // are retained in the database (never deleted) and reappear on upgrade.
  const historyDays = getPlanLimits(plan).retentionDays;
  const limitHistory = !canExport && Number.isFinite(historyDays);
  const historyCutoff = limitHistory ? Date.now() - historyDays * 24 * 60 * 60 * 1000 : null;

  const orgSiteIds = sites.map(s => s.id);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['consent-records', orgId, orgSiteIds],
    queryFn: async () => {
      if (orgSiteIds.length === 0) return [];
      // Fetch by each site belonging to org
      const results = await Promise.all(
        orgSiteIds.map(siteId => base44.entities.ConsentRecord.filter({ site: siteId }, '-created_date', 200))
      );
      return results.flat().sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: orgSiteIds.length > 0,
  });

  const siteMap = Object.fromEntries(sites.map(s => [s.id, s]));

  const filtered = records.filter(r => {
    if (historyCutoff && new Date(r.created_date).getTime() < historyCutoff) return false;
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
    if (!canExport) return;
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
      status: getEnforcementState(r).honored ? 'Honored' : 'Recorded only / partial',
      enforcement_applied: r.enforcement_applied === true,
      enforced_categories: (r.enforced_categories || []).join(' | '),
      signals_sent: (r.signals_sent || []).join(' | '),
      unmanaged_detected: (r.unmanaged_detected || []).join(' | '),
      verification_passed: r.verification_passed,
      decision_persisted: r.decision_persisted === true,
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
          canExport ? (
            <Button variant="outline" size="sm" onClick={handleExport} className="h-9 text-sm">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
          ) : null
        }
      />

      {limitHistory && (
        <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Showing the last {historyDays} days.</span>
          <Link to="/settings?tab=billing" className="font-medium text-primary hover:underline">
            Upgrade to Core for full history.
          </Link>
        </div>
      )}

      {/* Persistent warning for ungated trackers detected in the last 7 days */}
      {!isLoading && <UnmanagedTrackerAlert records={records} />}

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
              <ColumnHeader
                label="Receipt ID"
                what="A unique, immutable ID (cr_…) for that exact consent event — your court-ready proof that consent happened."
                captured="Auto-generated by the system the moment any consent action is recorded."
              />
              <ColumnHeader
                label="Site"
                what="Which of your installed sites the widget was on (e.g. bizooma.com)."
                captured="Determined by the site_key baked into the widget script on that site."
              />
              <ColumnHeader
                label="Action"
                what="The choice the visitor made. Four possible values: Accept All, Reject All, Custom Choices (they toggled individual categories and hit Save), or GPC Opt-Out."
                captured="Clicked a button in the cookie drawer — or, for GPC Opt-Out, their browser sent a Global Privacy Control signal and the widget auto-opted them out (no click needed)."
              />
              <ColumnHeader
                label="Categories"
                what="Which cookie categories they consented to: Necessary (always on), Functional, Analytics, Advertising. Highlighted = consented."
                captured="The on/off state of each toggle in the cookie drawer at the moment they saved."
              />
              <ColumnHeader
                label="GPC"
                what={'"Detected" if the visitor\'s browser broadcast a Global Privacy Control opt-out signal.'}
                captured="The visitor had GPC enabled in their browser/extension — passive, automatic, no action."
              />
              <ColumnHeader
                label="Status"
                what={'"Honored" means the widget actively enforced the choice (blocked tags, cleared cookies, sent consent-mode signals) AND self-verification passed AND no unmanaged trackers were found. "Recorded only / partial" means the choice was logged but enforcement failed, verification failed, or unmanaged trackers were detected.'}
                captured="Computed from the enforcement evidence the widget reports with each consent event. Expand a row to see signals sent and any unmanaged trackers."
              />
              <ColumnHeader
                label="Date"
                what="Timestamp of the consent action."
                captured="Stamped automatically when the action was recorded."
              />
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
                <Fragment key={r.id}>
                <tr className="hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      {expanded === r.id ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className="text-[12px] font-mono text-muted-foreground">{r.consent_receipt_id || '—'}</span>
                    </span>
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
                  <td className="px-4 py-3">
                    <EnforcementStatus record={r} />
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">
                    {r.created_date ? format(new Date(r.created_date), 'MMM d, yyyy h:mm a') : '—'}
                  </td>
                </tr>
                {expanded === r.id && <EnforcementDetail record={r} colSpan={7} />}
                </Fragment>
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