import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { orgFilter, daysUntilDeadline, deadlineBgColor, formatRequestType, formatStatus } from '@/lib/tenantUtils';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { Link } from 'react-router-dom';
import { Inbox, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function RequestInbox() {
  const { user, orgId, isSuperAdmin } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['data-rights-requests', orgId],
    queryFn: () => {
      if (isSuperAdmin) return base44.entities.DataRightsRequest.list('-statutory_deadline');
      if (!orgId) return [];
      return base44.entities.DataRightsRequest.filter(orgFilter(orgId), '-statutory_deadline');
    },
    enabled: !!orgId || isSuperAdmin,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites', orgId],
    queryFn: () => {
      if (isSuperAdmin) return base44.entities.Site.list();
      if (!orgId) return [];
      return base44.entities.Site.filter(orgFilter(orgId));
    },
    enabled: !!orgId || isSuperAdmin,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
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

  return (
    <div>
      <PageHeader
        title="Request Inbox"
        description="Manage incoming data rights requests"
      />

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
                const assignee = userMap[req.assigned_to];

                return (
                  <tr
                    key={req.id}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <Link to={`/request/${req.id}`} className="block">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {req.requester_name}
                        </p>
                        <p className="text-[12px] text-muted-foreground">{req.requester_email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/request/${req.id}`}>
                        <span className="text-sm text-foreground">{formatRequestType(req.request_type)}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/request/${req.id}`}>
                        <StatusBadge status={req.request_status} />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/request/${req.id}`}>
                        <StatusBadge status={req.verification_status} />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/request/${req.id}`}>
                        {days !== null ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${deadlineBgColor(days)}`}>
                            {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/request/${req.id}`}>
                        <span className="text-sm text-muted-foreground">
                          {assignee ? assignee.full_name : '—'}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/request/${req.id}`}>
                        <span className="text-[12px] text-muted-foreground">{site?.domain || '—'}</span>
                      </Link>
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