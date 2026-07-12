import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useRequestActions } from '@/hooks/useRequestActions';
import { daysUntilDeadline, deadlineBgColor, formatRequestType, formatStatus } from '@/lib/tenantUtils';
import StatusBadge from '@/components/shared/StatusBadge';
import VerificationPanel from '@/components/request/VerificationPanel';
import FulfillmentChecklist from '@/components/request/FulfillmentChecklist';
import StatusWorkflowPanel from '@/components/request/StatusWorkflowPanel';
import QuickStatusPanel from '@/components/request/QuickStatusPanel';
import NotesPanel from '@/components/request/NotesPanel';
import AssignPanel from '@/components/request/AssignPanel';
import AuditTimeline from '@/components/request/AuditTimeline';
import DeadlineCountdown from '@/components/request/DeadlineCountdown';
import RequesterEmailStatus from '@/components/request/RequesterEmailStatus';
import { ArrowLeft, Clock, User, Mail, MapPin, Shield, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatInTimezone } from '@/lib/timezone';

export default function RequestDetail() {
  const { id } = useParams();
  const { user, orgId } = useCurrentUser();

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      const all = await base44.entities.DataRightsRequest.filter({ id });
      return all[0] || null;
    },
    enabled: !!id,
  });

  const { data: auditEvents = [], isLoading: auditLoading } = useQuery({
    queryKey: ['audit-events', id],
    queryFn: () => base44.entities.AuditEvent.filter({ related_request: id }, 'created_date'),
    enabled: !!id,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const { data: site } = useQuery({
    queryKey: ['site', request?.site],
    queryFn: async () => {
      const all = await base44.entities.Site.filter({ id: request.site });
      return all[0] || null;
    },
    enabled: !!request?.site,
  });

  const { data: org } = useQuery({
    queryKey: ['organization', request?.organization],
    queryFn: async () => {
      const all = await base44.entities.Organization.filter({ id: request.organization });
      return all[0] || null;
    },
    enabled: !!request?.organization,
  });

  const actions = useRequestActions({
    requestId: id,
    orgId: orgId || request?.organization,
    userEmail: user?.email,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Request not found.</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block">Back to inbox</Link>
      </div>
    );
  }

  const days = daysUntilDeadline(request.statutory_deadline);

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to inbox
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {formatRequestType(request.request_type)} Request
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            From {request.requester_name} · {site?.domain || '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={request.request_status} />
          {days !== null && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${deadlineBgColor(days)}`}>
              <Clock className="w-3 h-3" />
              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d remaining`}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-2 space-y-6">
          {/* Requester Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Requester Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <InfoRow icon={User} label="Name" value={request.requester_name} />
              <InfoRow icon={Mail} label="Email" value={request.requester_email} />
              <InfoRow icon={MapPin} label="State" value={request.requester_state || '—'} />
              <InfoRow icon={Shield} label="Authorized Agent" value={request.is_authorized_agent ? 'Yes' : 'No'} />
              {request.is_authorized_agent && request.agent_details && (
                <div className="col-span-2">
                  <InfoRow icon={FileText} label="Agent Details" value={request.agent_details} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Gate */}
          <VerificationPanel
            request={request}
            onMarkVerified={actions.markVerified}
            onRejectRequest={actions.rejectRequest}
          />

          {/* Fulfillment Checklist */}
          <FulfillmentChecklist
            request={request}
            actions={actions}
            userMap={userMap}
          />

          {/* Quick Status */}
          <QuickStatusPanel
            request={request}
            onChangeStatus={(newStatus) => actions.changeStatus(request, newStatus)}
          />

          {/* Status Workflow */}
          <StatusWorkflowPanel
            request={request}
            onChangeStatus={(newStatus) => actions.changeStatus(request, newStatus)}
          />

          {/* Notes */}
          <NotesPanel
            request={request}
            onAddNote={actions.addNote}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* 45-Day Countdown */}
          <DeadlineCountdown deadline={request.statutory_deadline} />

          {/* Key Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Key Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DateRow label="Received" value={request.received_date || request.created_date} timezone={org?.timezone} />
              <DateRow
                label="Statutory Deadline"
                value={request.statutory_deadline}
                highlight={days !== null && days <= 7}
                overdue={days !== null && days < 0}
                timezone={org?.timezone}
              />
              <DateRow label="Fulfilled" value={request.fulfilled_date} timezone={org?.timezone} />
            </CardContent>
          </Card>

          {/* Requester Emails */}
          <RequesterEmailStatus request={request} org={org} />

          {/* Assign */}
          <AssignPanel
            request={request}
            onAssign={actions.assignRequest}
          />

          {/* Audit Timeline */}
          <AuditTimeline events={auditEvents} isLoading={auditLoading} timezone={org?.timezone} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

function DateRow({ label, value, highlight, overdue, timezone }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className={`text-[12px] font-medium ${
        overdue ? 'text-destructive' : highlight ? 'text-amber-600' : 'text-foreground'
      }`}>
        {value ? formatInTimezone(value, timezone, { withTime: false }) : '—'}
      </span>
    </div>
  );
}