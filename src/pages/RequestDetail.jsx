import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { daysUntilDeadline, deadlineBgColor, formatRequestType, formatStatus } from '@/lib/tenantUtils';
import StatusBadge from '@/components/shared/StatusBadge';
import { ArrowLeft, Clock, User, Mail, MapPin, Shield, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

export default function RequestDetail() {
  const { id } = useParams();
  const { orgId } = useCurrentUser();

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      const all = await base44.entities.DataRightsRequest.filter({ id });
      return all[0] || null;
    },
    enabled: !!id,
  });

  const { data: auditEvents = [] } = useQuery({
    queryKey: ['audit-events', id],
    queryFn: () => base44.entities.AuditEvent.filter({ related_request: id }, '-created_date'),
    enabled: !!id,
  });

  const { data: site } = useQuery({
    queryKey: ['site', request?.site],
    queryFn: async () => {
      const all = await base44.entities.Site.filter({ id: request.site });
      return all[0] || null;
    },
    enabled: !!request?.site,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
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
      {/* Back link */}
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
              {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column — main info */}
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
              <InfoRow
                icon={Shield}
                label="Authorized Agent"
                value={request.is_authorized_agent ? 'Yes' : 'No'}
              />
              {request.is_authorized_agent && request.agent_details && (
                <div className="col-span-2">
                  <InfoRow icon={FileText} label="Agent Details" value={request.agent_details} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <StatusBadge status={request.verification_status} />
                <span className="text-sm text-muted-foreground">
                  Identity verification is {formatStatus(request.verification_status).toLowerCase()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Status Workflow */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Status Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {['new', 'in_progress', 'awaiting_info', 'fulfilled', 'denied'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1.5 rounded-md text-[11px] font-medium border ${
                        s === request.request_status
                          ? 'bg-primary text-white border-primary'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {formatStatus(s)}
                    </div>
                    {i < 4 && <div className="w-4 h-px bg-border" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {request.notes || 'No notes yet.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right column — timeline & meta */}
        <div className="space-y-6">
          {/* Key Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Key Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DateRow label="Received" value={request.received_date || request.created_date} />
              <DateRow label="Statutory Deadline" value={request.statutory_deadline} />
              <DateRow label="Fulfilled" value={request.fulfilled_date} />
            </CardContent>
          </Card>

          {/* Audit Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {auditEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {auditEvents.map(evt => (
                    <div key={evt.id} className="relative pl-4 border-l-2 border-border pb-3 last:pb-0">
                      <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary" />
                      <p className="text-xs font-medium text-foreground">{evt.event_type}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{evt.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {evt.actor} · {evt.created_date ? format(new Date(evt.created_date), 'MMM d, yyyy h:mm a') : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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

function DateRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="text-[12px] font-medium text-foreground">
        {value ? format(new Date(value), 'MMM d, yyyy') : '—'}
      </span>
    </div>
  );
}