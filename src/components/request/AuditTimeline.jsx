import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const EVENT_COLORS = {
  request_received: 'bg-blue-500',
  identity_verified: 'bg-emerald-500',
  request_rejected: 'bg-destructive',
  status_changed: 'bg-primary',
  request_fulfilled: 'bg-emerald-600',
  request_assigned: 'bg-amber-500',
  note_added: 'bg-gray-400',
};

const EVENT_LABELS = {
  request_received: 'Request Received',
  identity_verified: 'Identity Verified',
  request_rejected: 'Request Rejected',
  status_changed: 'Status Changed',
  request_fulfilled: 'Request Fulfilled',
  request_assigned: 'Request Assigned',
  note_added: 'Note Added',
};

export default function AuditTimeline({ events, isLoading }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-2 h-2 rounded-full mt-1.5 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2.5 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[3px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-4">
              {events.map(evt => (
                <div key={evt.id} className="relative pl-5">
                  <div
                    className={`absolute left-0 top-1.5 w-[7px] h-[7px] rounded-full border-2 border-background ${
                      EVENT_COLORS[evt.event_type] || 'bg-muted-foreground'
                    }`}
                  />
                  <p className="text-[11px] font-semibold text-foreground leading-tight">
                    {EVENT_LABELS[evt.event_type] || evt.event_type}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {evt.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {evt.actor}
                    {evt.created_date && (
                      <> · {format(new Date(evt.created_date), 'MMM d, yyyy h:mm a')}</>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}