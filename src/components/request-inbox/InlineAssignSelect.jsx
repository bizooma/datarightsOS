import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function InlineAssignSelect({ request, users, userEmail }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function handleChange(userId) {
    if (userId === (request.assigned_to || '')) return;
    setLoading(true);
    try {
      const u = users.find(x => x.id === userId);
      const name = u?.full_name || u?.email || userId;
      await base44.entities.DataRightsRequest.update(request.id, { assigned_to: userId });
      await base44.entities.AuditEvent.create({
        organization: request.organization,
        related_request: request.id,
        event_type: 'request_assigned',
        actor: userEmail || 'system',
        description: `Request assigned to ${name}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['data-rights-requests'] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select value={request.assigned_to || ''} onValueChange={handleChange} disabled={loading}>
        <SelectTrigger className="h-8 w-40 text-xs bg-white">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SelectValue placeholder="Unassigned" />}
        </SelectTrigger>
        <SelectContent>
          {request.assigned_to && !users.some(u => u.id === request.assigned_to) && (
            <SelectItem value={request.assigned_to} className="text-xs">{request.assigned_to}</SelectItem>
          )}
          {users.map(u => (
            <SelectItem key={u.id} value={u.id} className="text-xs">{u.full_name || u.email}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}