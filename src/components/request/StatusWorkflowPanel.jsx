import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatStatus } from '@/lib/tenantUtils';
import { Loader2, ArrowRight } from 'lucide-react';

const FORWARD_FLOW = ['new', 'in_progress', 'awaiting_info', 'fulfilled'];
const NEXT_STATUS_LABEL = {
  new: 'Start Processing',
  in_progress: 'Request More Info',
  awaiting_info: 'Mark Fulfilled',
};

export default function StatusWorkflowPanel({ request, onChangeStatus }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const currentIdx = FORWARD_FLOW.indexOf(request.request_status);
  const nextStatus = FORWARD_FLOW[currentIdx + 1];
  const isTerminal = ['fulfilled', 'denied'].includes(request.request_status);

  async function handle(newStatus) {
    setError('');
    setLoading(newStatus);
    try {
      await onChangeStatus(newStatus);
    } catch (e) {
      setError(e.message || 'An error occurred.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Status Workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pipeline indicator */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FORWARD_FLOW.concat(['denied']).map((s, i) => {
            const isActive = s === request.request_status;
            const isPast = FORWARD_FLOW.indexOf(s) < currentIdx && currentIdx !== -1;
            return (
              <div key={s} className="flex items-center gap-1.5">
                <div
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : isPast
                      ? 'bg-muted/60 text-muted-foreground border-border line-through'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {formatStatus(s)}
                </div>
                {i < FORWARD_FLOW.length && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        {!isTerminal && (
          <div className="flex gap-2 flex-wrap">
            {nextStatus && (
              <Button
                size="sm"
                disabled={!!loading}
                onClick={() => handle(nextStatus)}
                className="gap-1.5"
              >
                {loading === nextStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                {NEXT_STATUS_LABEL[request.request_status] || `Move to ${formatStatus(nextStatus)}`}
              </Button>
            )}
            {request.request_status !== 'denied' && (
              <Button
                size="sm"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10 gap-1.5"
                disabled={!!loading}
                onClick={() => handle('denied')}
              >
                {loading === 'denied' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Deny Request
              </Button>
            )}
          </div>
        )}

        {isTerminal && (
          <p className="text-xs text-muted-foreground bg-muted/50 border border-border rounded-md px-3 py-2">
            This request is in a terminal state: <strong>{formatStatus(request.request_status)}</strong>.
          </p>
        )}

        {error && (
          <p className="text-xs text-destructive bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}