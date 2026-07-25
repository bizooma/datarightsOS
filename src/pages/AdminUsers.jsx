import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Navigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, Trash2, PauseCircle, PlayCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsers() {
  const { isSuperAdmin, orgId, user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('staff');
  const [newOrgId, setNewOrgId] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ['all-orgs-admin'],
    queryFn: () => base44.entities.Organization.list(),
  });

  const orgMap = Object.fromEntries(orgs.map(o => [o.id, o]));

  // Super admin picks any org; a regular admin subscriber is locked to their own org.
  const targetOrgId = isSuperAdmin ? newOrgId : orgId;

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const email = newEmail.trim().toLowerCase();
      // Record which org the invited user should join on first login.
      await base44.entities.PendingInvite.create({
        email,
        organization: targetOrgId,
        role: newRole,
        invited_by: user?.email,
      });
      // The platform invite is scoped to app-level role only; org is applied on first login.
      const appRole = newRole === 'staff' ? 'user' : 'admin';
      return base44.users.inviteUser(email, appRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setShowAddForm(false);
      setNewEmail('');
      setNewRole('staff');
      setNewOrgId('');
      toast.success('Invitation sent');
    },
    onError: () => toast.error('Failed to send invitation'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('User deleted');
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const togglePauseMutation = useMutation({
    mutationFn: ({ id, disabled }) => base44.entities.User.update(id, { disabled: !disabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('Account updated');
    },
    onError: () => toast.error('Failed to update account'),
  });

  // Guard after all hooks
  if (user && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="User Management"
        description="All registered accounts across the platform"
        actions={
          <Button size="sm" className="h-9 text-sm" onClick={() => setShowAddForm(true)}>
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Add User
          </Button>
        }
      />

      {showAddForm && (
        <Card className="mb-6">
          <CardContent className="pt-5">
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
                <Input
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              {isSuperAdmin && (
                <div className="w-56">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Organization</Label>
                  <Select value={newOrgId} onValueChange={setNewOrgId}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select org…" /></SelectTrigger>
                    <SelectContent>
                      {orgs.map(o => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="w-36">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" className="h-9" onClick={() => inviteMutation.mutate()} disabled={!newEmail.trim() || !targetOrgId || inviteMutation.isPending}>
                {inviteMutation.isPending ? 'Sending…' : 'Send Invite'}
              </Button>
              <Button size="sm" variant="outline" className="h-9" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
            {!isSuperAdmin && (
              <p className="text-[11px] text-muted-foreground mt-2">The invited user will join your organization.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 text-sm pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Organization</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const org = orgMap[u.organization];
                  const isSelf = u.email === 'joe@bizooma.com';
                  return (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{u.full_name || '—'}</p>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {org ? (
                          <div>
                            <p className="text-foreground text-xs font-medium">{org.name}</p>
                            <p className="text-[11px] capitalize text-muted-foreground">{org.plan}</p>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] capitalize">{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.disabled
                          ? <Badge variant="destructive" className="text-[10px]">Paused</Badge>
                          : <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">Active</Badge>
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {u.created_date ? new Date(u.created_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {!isSelf && (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => togglePauseMutation.mutate({ id: u.id, disabled: u.disabled })}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title={u.disabled ? 'Reactivate' : 'Pause'}
                            >
                              {u.disabled ? <PlayCircle className="w-4 h-4 text-green-600" /> : <PauseCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete ${u.email}? This cannot be undone.`)) {
                                  deleteMutation.mutate(u.id);
                                }
                              }}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}