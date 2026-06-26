import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Circle, Clock, CheckCircle2 } from 'lucide-react';

// Quick-set buttons mapped to existing request_status values.
const QUICK_STATUSES = [
  { key: 'new', label: 'Not Started', icon: Circle },
  { key: 'in_progress', label: 'In Progress', icon: Clock },
  { key: 'fulfilled', label: 'Complete', icon: CheckCircle2 },
];

export default function QuickStatusPanel({ request, onChangeStatus }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

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
        <CardTitle className="text-sm font-semibold">Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {QUICK_STATUSES.map(({ key, label, icon: Icon }) => {
            const isCurrent = request.request_status === key;
            return (
              <Button
                key={key}
                size="sm"
                variant={isCurrent ? 'default' : 'outline'}
                disabled={!!loading || isCurrent}
                onClick={() => handle(key)}
                className="gap-1.5"
              >
                {loading === key ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                {label}
              </Button>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-destructive bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}