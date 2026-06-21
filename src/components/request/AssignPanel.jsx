import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck } from 'lucide-react';

export default function AssignPanel({ request, onAssign }) {
  const [selected, setSelected] = useState(request.assigned_to || '');
  const [loading, setLoading] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const assignedUser = users.find(u => u.id === request.assigned_to);

  async function save() {
    if (!selected || selected === request.assigned_to) return;
    const u = users.find(u => u.id === selected);
    setLoading(true);
    try {
      await onAssign(selected, u?.full_name || u?.email || selected);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Assigned To</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignedUser && (
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">{assignedUser.full_name || assignedUser.email}</span>
          </div>
        )}
        <div className="flex gap-2">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Select team member..." />
            </SelectTrigger>
            <SelectContent>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id} className="text-xs">
                  {u.full_name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={loading || !selected || selected === request.assigned_to}
            onClick={save}
            className="h-8 px-3 text-xs"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Assign'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}