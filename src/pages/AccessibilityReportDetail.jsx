import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink, Mail, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'resolved', label: 'Resolved' },
];

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-sm text-foreground mt-0.5 break-words">{children}</div>
      </div>
    </div>
  );
}

export default function AccessibilityReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { orgId } = useCurrentUser();
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ['accessibility-report', id],
    queryFn: () => base44.entities.AccessibilityReport.get(id),
    enabled: !!id,
  });

  const { data: site } = useQuery({
    queryKey: ['site', report?.site],
    queryFn: () => base44.entities.Site.get(report.site),
    enabled: !!report?.site,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['org-users', orgId],
    queryFn: () => base44.entities.User.filter({ organization: orgId }),
    enabled: !!orgId,
  });

  async function handleAssign(userId) {
    if (!report || userId === (report.assigned_to || '')) return;
    setAssigning(true);
    try {
      await base44.entities.AccessibilityReport.update(report.id, { assigned_to: userId });
      queryClient.invalidateQueries({ queryKey: ['accessibility-report', id] });
      queryClient.invalidateQueries({ queryKey: ['accessibility-reports'] });
    } finally {
      setAssigning(false);
    }
  }

  async function handleStatusChange(newStatus) {
    if (!report || newStatus === report.status) return;
    setSaving(true);
    try {
      await base44.entities.AccessibilityReport.update(report.id, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['accessibility-report', id] });
      queryClient.invalidateQueries({ queryKey: ['accessibility-reports'] });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/accessibility')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to reports
        </Button>
        <p className="text-sm text-muted-foreground">Report not found.</p>
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate('/accessibility')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to reports
      </Button>

      <PageHeader
        title="Accessibility Report"
        description={`Reported ${report.created_date ? format(new Date(report.created_date), 'MMM d, yyyy · h:mm a') : ''}`}
        actions={<StatusBadge status={report.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Barrier description</h3>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {report.description || 'No description provided.'}
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-1">Status</h3>
            <p className="text-xs text-muted-foreground mb-3">Update as you triage this report.</p>
            <Select value={report.status} onValueChange={handleStatusChange} disabled={saving}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-1">Assigned to</h3>
            <p className="text-xs text-muted-foreground mb-3">Hand this off to a team member to investigate.</p>
            <Select value={report.assigned_to || ''} onValueChange={handleAssign} disabled={assigning}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">Details</h3>
            <InfoRow icon={Globe} label="Site">
              {site?.domain || '—'}
            </InfoRow>
            <InfoRow icon={ExternalLink} label="Page URL">
              {report.page_url ? (
                <a href={report.page_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                  {report.page_url}
                </a>
              ) : '—'}
            </InfoRow>
            <InfoRow icon={Mail} label="Reporter">
              {report.reporter_email ? (
                <a href={`mailto:${report.reporter_email}`} className="text-primary hover:underline break-all">
                  {report.reporter_email}
                </a>
              ) : 'Anonymous'}
            </InfoRow>
          </div>
        </div>
      </div>
    </div>
  );
}