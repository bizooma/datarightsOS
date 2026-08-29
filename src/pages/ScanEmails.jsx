import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Mail } from 'lucide-react';

// Emails captured by the "Email me this report" form on the public scan page.
// Nothing here is synced anywhere — this is the record of who asked for a report.
export default function ScanEmails() {
  const [showThrottled, setShowThrottled] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['scan-report-emails'],
    queryFn: () => base44.entities.ScanReportEmail.list('-created_date', 500),
  });

  const visible = rows.filter((r) => (showThrottled ? r.status === 'throttled' : r.status !== 'throttled'));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scan Report Emails"
        description="Addresses that asked for a scan report by email. Opt-in is stored only — no marketing platform is connected."
      />

      <div className="flex gap-2">
        <button
          onClick={() => setShowThrottled(false)}
          className={`text-xs px-3 py-1.5 rounded-md border ${!showThrottled ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}
        >
          Sent ({rows.filter((r) => r.status !== 'throttled').length})
        </button>
        <button
          onClick={() => setShowThrottled(true)}
          className={`text-xs px-3 py-1.5 rounded-md border ${showThrottled ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}
        >
          Throttled ({rows.filter((r) => r.status === 'throttled').length})
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Mail}
          title={showThrottled ? 'No throttled attempts' : 'No emails captured yet'}
          description={showThrottled ? 'Refused send attempts appear here.' : 'When a visitor asks for a scan report by email, they show up here.'}
        />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs">Email</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs">Domain scanned</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs">Date</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs">
                  {showThrottled ? 'Reason' : 'Updates opt-in'}
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2.5 text-foreground break-all">{r.email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.domain || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                    {new Date(r.sent_at || r.created_date).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    {showThrottled ? (
                      <span className="text-xs text-muted-foreground">{r.throttle_reason || '—'}</span>
                    ) : r.opted_in ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Opted in</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}