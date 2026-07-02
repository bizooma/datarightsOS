import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'awaiting_info', label: 'Awaiting Info' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'denied', label: 'Denied' },
];

export default function InlineStatusSelect({ request, userEmail }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleChange(newStatus) {
    if (newStatus === request.request_status) return;
    setError('');

    if (newStatus === 'fulfilled' && request.verification_status !== 'verified') {
      setError('Verify identity first');
      return;
    }

    setLoading(true);
    try {
      const oldStatus = request.request_status;
      const updates = { request_status: newStatus };
      if (newStatus === 'fulfilled') updates.fulfilled_date = new Date().toISOString();
      await base44.entities.DataRightsRequest.update(request.id, updates);
      await base44.entities.AuditEvent.create({
        organization: request.organization,
        related_request: request.id,
        event_type: newStatus === 'fulfilled' ? 'request_fulfilled' : 'status_changed',
        actor: userEmail || 'system',
        description: `Status changed from "${oldStatus}" to "${newStatus}".`,
      });
      queryClient.invalidateQueries({ queryKey: ['data-rights-requests'] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select value={request.request_status} onValueChange={handleChange} disabled={loading}>
        <SelectTrigger className="h-8 w-36 text-xs bg-white">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SelectValue />}
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map(o => (
            <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  );
}