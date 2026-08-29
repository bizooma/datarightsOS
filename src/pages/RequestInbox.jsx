import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { orgFilter, daysUntilDeadline, deadlineBgColor, formatRequestType, formatStatus } from '@/lib/tenantUtils';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { useNavigate } from 'react-router-dom';
import { Inbox, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import FulfillmentGuidePanel from '@/components/request-inbox/FulfillmentGuidePanel';
import InlineStatusSelect from '@/components/request-inbox/InlineStatusSelect';
import InlineAssignSelect from '@/components/request-inbox/InlineAssignSelect';
import { useOrg } from '@/lib/useOrg';
import { canTrackRequests, canExportOwn } from '@/lib/planLimits';
import UpgradePanel from '@/components/billing/UpgradePanel';
import RequestForwardBanner from '@/components/billing/RequestForwardBanner';
import StatementsBlockedBanner from '@/components/dashboard/StatementsBlockedBanner';
import LegacyRequestsNotice from '@/components/request-inbox/LegacyRequestsNotice';
import VisitorCapBanner from '@/components/consent-log/VisitorCapBanner';

export default function RequestInbox() {
  const { user, orgId } = useCurrentUser();
  const { plan, isLoading: orgLoading } = useOrg();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['data-rights-requests', orgId],
    queryFn: () => {
      if (!orgId) return [];
      return base44.entities.DataRightsRequest.filter(orgFilter(orgId), '-statutory_deadline');
    },
    enabled: !!orgId,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites', orgId],
    queryFn: () => {
      if (!orgId) return [];
      return base44.entities.Site.filter(orgFilter(orgId));
    },
    enabled: !!orgId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['org-users', orgId],
    queryFn: () => {
      if (!orgId) return [];
      return base44.entities.User.filter({ organization: orgId });
    },
    enabled: !!orgId,
  });

  const siteMap = Object.fromEntries(sites.map(s => [s.id, s]));
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const filtered = requests.filter(r => {
    if (statusFilter !== 'all' && r.request_status !== statusFilter) return false;
    if (siteFilter !== 'all' && r.site !== siteFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.requester_name?.toLowerCase().includes(q) &&
        !r.requester_email?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  // Sort by deadline ascending (earliest deadline first)
  const sorted = [...filtered].sort((a, b) => {
    if (!a.statutory_deadline) return 1;
    if (!b.statutory_deadline) return -1;
    return new Date(a.statutory_deadline) - new Date(b.statutory_deadline);
  });

  function handleExportCsv() {
    const headers = [
      'Requester Name', 'Requester Email', 'Request Type', 'Status', 'Verification',
      'Received Date', 'Statutory Deadline', 'Assigned To', 'Site', 'State',
    ];
    const escape = (v) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = sorted.map(r => [
      r.requester_name,
      r.requester_email,
      formatRequestType(r.request_type),
      formatStatus(r.request_status),
      formatStatus(r.verification_status),
      r.received_date ? new Date(r.received_date).toISOString() : '',
      r.statutory_deadline ? new Date(r.statutory_deadline).toISOString() : '',
      userMap[r.assigned_to]?.full_name || '',
      siteMap[r.site]?.domain || '',
      r.requester_state || '',
    ].map(escape).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-rights-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Plan gate: the tracked request engine is Core+. On Notice, requests are
  // forwarded by email — show the upgrade path (with the monthly forwarded-count
  // banner) instead of a tracked inbox that would always be empty.
  const tracksRequests = orgLoading ? true : canTrackRequests(plan);
  const showExport = canExportOwn(plan);

  // Requests accepted while the plan DID track them stay fully actionable forever —
  // verification, the 45-day clock, checklists, reminders, audit trail. We started
  // that clock, so we don't get to block the remedy when a trial lapses. Only NEW
  // intake stops (the widget drops the request card, enforced in intakeEndpoint).
  // So the upgrade wall only replaces the inbox when there is nothing in it.
  const hasExistingRequests = !isLoading && requests.length > 0;

  if (!orgLoading && !tracksRequests && !isLoading && !hasExistingRequests) {
    // Free plan: no request intake at all (the widget doesn't even show the card).
    // Notice: requests are forwarded by email — show the forward-count banner.
    const isFree = plan === 'free';
    return (
      <div>
        <PageHeader
          title="Privacy Requests"
          description="How your plan handles incoming privacy requests"
        />
        {/* Notice subscribers CAN publish statements, and they land on this page, not
            the tracked inbox below — so the banner has to render in this branch too. */}
        <StatementsBlockedBanner />
        {!isFree && <RequestForwardBanner orgId={orgId} canTrack={false} />}
        {isFree ? (
          <UpgradePanel
            feature="request_forwarding"
            title="Privacy request intake isn't included on the free plan"
            description="The free plan shows cookie consent only — your widget doesn't display a privacy-request card. Upgrade to Notice to forward requests to your inbox by email, or to Core to track and manage them here with deadlines."
            adds={[
              'A "Submit a request" card in your widget',
              'Requests forwarded to your privacy contact by email',
              'Legal statements published in the widget',
              'Accessibility statement + barrier reporting',
              'Consent log history (90 days)',
            ]}
          />
        ) : (
          <UpgradePanel
            feature="request_tracking"
            title="Request tracking is a Core feature"
            description="On your current plan, privacy requests submitted through your widget are forwarded to your privacy contact by email — the visitor sees a normal confirmation, but no request record, verification, or deadline clock is created. Upgrade to Core to track and manage them here."
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Request Inbox"
        description="Manage incoming data rights requests"
        actions={
          showExport ? (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={handleExportCsv}
              disabled={sorted.length === 0}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          ) : null
        }
      />

      <StatementsBlockedBanner />
      <VisitorCapBanner plan={plan} siteIds={sites.map(s => s.id)} />
      {!tracksRequests && hasExistingRequests && <LegacyRequestsNotice count={requests.length} />}

      <OnboardingChecklist sites={sites} orgId={orgId} />

      {!isLoading && (
        <FulfillmentGuidePanel
          key={requests.length === 0 ? 'empty' : 'has-requests'}
          defaultOpen={requests.length === 0}
        />
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9 text-sm bg-white">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="awaiting_info">Awaiting Info</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Requester</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Type</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Verification</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Deadline</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Assigned To</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Site</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(7).fill(0).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={Inbox}
                    title="No requests found"
                    description="Data rights requests will appear here when they are submitted."
                  />
                </td>
              </tr>
            ) : (
              sorted.map(req => {
                const days = daysUntilDeadline(req.statutory_deadline);
                const site = siteMap[req.site];

                return (
                  <tr
                    key={req.id}
                    onClick={() => navigate(`/request/${req.id}`)}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {req.requester_name}
                      </p>
                      <p className="text-[12px] text-muted-foreground">{req.requester_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">{formatRequestType(req.request_type)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <InlineStatusSelect request={req} userEmail={user?.email} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.verification_status} />
                    </td>
                    <td className="px-4 py-3">
                      {days !== null ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${deadlineBgColor(days)}`}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <InlineAssignSelect request={req} users={users} userEmail={user?.email} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-muted-foreground">{site?.domain || '—'}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}