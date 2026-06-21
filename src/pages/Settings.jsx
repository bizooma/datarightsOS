import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Building2, Users, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Settings() {
  const { orgId, user } = useCurrentUser();

  const { data: org, isLoading } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const orgs = await base44.entities.Organization.filter({ id: orgId });
      return orgs[0] || null;
    },
    enabled: !!orgId,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', orgId],
    queryFn: () => orgId ? base44.entities.User.filter({ organization: orgId }) : [],
    enabled: !!orgId,
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-lg" />;

  return (
    <div>
      <PageHeader title="Settings" description="Manage your organization settings" />

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="bg-white border border-border">
          <TabsTrigger value="branding" className="text-sm gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="team" className="text-sm gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Team
          </TabsTrigger>
          <TabsTrigger value="plan" className="text-sm gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          {org && <BrandingTab org={org} />}
        </TabsContent>

        <TabsContent value="team">
          <TeamTab members={teamMembers} currentUser={user} orgId={orgId} />
        </TabsContent>

        <TabsContent value="plan">
          {org && <PlanTab org={org} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BrandingTab({ org }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: org.name || '',
    white_label_product_name: org.white_label_product_name || '',
    brand_logo_url: org.brand_logo_url || '',
    brand_primary_color: org.brand_primary_color || '#0d7d74',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Organization.update(org.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('Branding updated');
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Organization Branding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-w-lg">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Organization Name</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">White-Label Product Name</Label>
          <Input value={form.white_label_product_name} onChange={e => setForm({ ...form, white_label_product_name: e.target.value })} className="h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Brand Logo URL</Label>
          <Input value={form.brand_logo_url} onChange={e => setForm({ ...form, brand_logo_url: e.target.value })} className="h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Primary Brand Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.brand_primary_color}
              onChange={e => setForm({ ...form, brand_primary_color: e.target.value })}
              className="w-9 h-9 rounded border border-border cursor-pointer"
            />
            <Input value={form.brand_primary_color} onChange={e => setForm({ ...form, brand_primary_color: e.target.value })} className="h-9 text-sm w-32 font-mono" />
          </div>
        </div>
        <Button size="sm" className="h-9 text-sm" onClick={() => updateMutation.mutate(form)}>
          <Check className="w-3.5 h-3.5 mr-1.5" />
          Save Branding
        </Button>
      </CardContent>
    </Card>
  );
}

function TeamTab({ members, currentUser, orgId }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), 'user');
    toast.success('Invitation sent');
    setInviteEmail('');
    setInviting(false);
  };

  const roleColors = {
    owner: 'bg-primary/10 text-primary',
    admin: 'bg-blue-50 text-blue-700',
    staff: 'bg-gray-100 text-gray-600',
    bizooma_superadmin: 'bg-amber-50 text-amber-700',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3 mb-6">
          <div className="flex-1 max-w-sm">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Invite by Email</Label>
            <Input
              placeholder="colleague@firm.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <Button size="sm" className="h-9 text-sm" onClick={handleInvite} disabled={inviting}>
            Send Invite
          </Button>
        </div>

        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/40">
              <div>
                <p className="text-sm font-medium">{m.full_name}</p>
                <p className="text-[12px] text-muted-foreground">{m.email}</p>
              </div>
              <Badge variant="secondary" className={`text-[11px] ${roleColors[m.role] || ''}`}>
                {m.role}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PlanTab({ org }) {
  const planFeatures = {
    trial: ['1 site', '100 consent records/mo', 'Basic audit trail'],
    starter: ['3 sites', '5,000 consent records/mo', 'Full audit trail', 'CSV export'],
    pro: ['10 sites', '50,000 consent records/mo', 'Priority support', 'White-label'],
    agency: ['Unlimited sites', 'Unlimited records', 'Multi-org management', 'Custom branding'],
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <Badge className="bg-primary text-white text-xs capitalize">{org.plan}</Badge>
          <Badge variant="outline" className={`text-[11px] ${
            org.billing_status === 'active' ? 'border-emerald-300 text-emerald-700' :
            org.billing_status === 'past_due' ? 'border-amber-300 text-amber-700' :
            'border-red-300 text-red-700'
          }`}>
            {org.billing_status === 'active' ? '● Active' : org.billing_status === 'past_due' ? '⚠ Past Due' : '✕ Canceled'}
          </Badge>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Plan Features</p>
          <ul className="space-y-1.5">
            {(planFeatures[org.plan] || []).map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-3.5 h-3.5 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}