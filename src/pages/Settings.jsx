import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Building2, Users, CreditCard, Trash2, Lock, Upload, UserCircle, Webhook, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import BillingTab from '@/components/settings/BillingTab';
import ProfileTab from '@/components/settings/ProfileTab';
import IntegrationsTab from '@/components/settings/IntegrationsTab';
import RequesterEmailsTab from '@/components/settings/RequesterEmailsTab';
import RegionalTab from '@/components/settings/RegionalTab';
import { canAddMember, canUseOutboundWebhook } from '@/lib/planLimits';
import { Globe } from 'lucide-react';

export default function Settings() {
  const { orgId, user, isOwnerOrAdmin } = useCurrentUser();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = ['profile', 'branding', 'regional', 'requester-emails', 'team', 'integrations', 'plan'].includes(tabParam) ? tabParam : 'profile';

  const { data: org, isLoading } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const orgs = await base44.entities.Organization.filter({ id: orgId });
      return orgs[0] || null;
    },
    enabled: !!orgId,
  });

  const { data: teamMembers = [], refetch: refetchTeam } = useQuery({
    queryKey: ['team-members', orgId],
    queryFn: () => orgId ? base44.entities.User.filter({ organization: orgId }) : [],
    enabled: !!orgId,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites', orgId],
    queryFn: () => orgId ? base44.entities.Site.filter({ organization: orgId }) : [],
    enabled: !!orgId,
  });

  const siteCount = sites.length;

  if (isLoading) return <Skeleton className="h-64 w-full rounded-lg" />;

  return (
    <div>
      <PageHeader title="Settings" description="Manage your organization settings" />

      <Tabs value={activeTab} onValueChange={(v) => setSearchParams(v === 'profile' ? {} : { tab: v })} className="space-y-6">
        <TabsList className="bg-white border border-border">
          <TabsTrigger value="profile" className="text-sm gap-1.5">
            <UserCircle className="w-3.5 h-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="branding" className="text-sm gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="regional" className="text-sm gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Regional
          </TabsTrigger>
          <TabsTrigger value="requester-emails" className="text-sm gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            Requester Emails
          </TabsTrigger>
          <TabsTrigger value="team" className="text-sm gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Team
          </TabsTrigger>
          {org && isOwnerOrAdmin && canUseOutboundWebhook(org.plan) && (
            <TabsTrigger value="integrations" className="text-sm gap-1.5">
              <Webhook className="w-3.5 h-3.5" />
              Integrations
            </TabsTrigger>
          )}
          <TabsTrigger value="plan" className="text-sm gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab user={user} />
        </TabsContent>

        <TabsContent value="branding">
          {org && (
            isOwnerOrAdmin
              ? <BrandingTab org={org} />
              : <ReadOnlyBranding org={org} />
          )}
        </TabsContent>

        <TabsContent value="regional">
          {org && (
            isOwnerOrAdmin
              ? <RegionalTab org={org} />
              : <LockedTab label="Regional" description="Only owners and admins can change the organization timezone." />
          )}
        </TabsContent>

        <TabsContent value="requester-emails">
          {org && (
            isOwnerOrAdmin
              ? <RequesterEmailsTab org={org} sites={sites} />
              : <LockedTab label="Requester Emails" description="Only owners and admins can manage requester email settings." />
          )}
        </TabsContent>

        <TabsContent value="team">
          <TeamTab members={teamMembers} currentUser={user} orgId={orgId} isOwnerOrAdmin={isOwnerOrAdmin} refetch={refetchTeam} plan={org?.plan} />
        </TabsContent>

        <TabsContent value="integrations">
          {org && (
            isOwnerOrAdmin
              ? <IntegrationsTab org={org} />
              : <LockedTab label="Integrations" description="Only owners and admins can manage integrations." />
          )}
        </TabsContent>

        <TabsContent value="plan">
          {org && (
            isOwnerOrAdmin
              ? <BillingTab org={org} siteCount={siteCount} memberCount={teamMembers.length} />
              : <LockedTab label="Plan & Billing" description="Only owners and admins can view billing information." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LockedTab({ label, description }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-10 justify-center text-center">
        <div>
          <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ReadOnlyBranding({ org }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Organization Branding</CardTitle>
        <CardDescription className="text-xs">Only owners and admins can edit branding.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 max-w-lg">
        <InfoRow label="Organization Name" value={org.name} />
        <InfoRow label="Product Name" value={org.white_label_product_name} />
        {org.brand_logo_url
          ? <div><p className="text-xs text-muted-foreground mb-1">Logo</p><img src={org.brand_logo_url} alt="Logo" className="h-8 object-contain rounded" /></div>
          : <InfoRow label="Logo" value="—" />
        }
        <div>
          <p className="text-xs text-muted-foreground mb-1">Primary Color</p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: org.brand_primary_color }} />
            <span className="text-sm font-mono">{org.brand_primary_color}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function BrandingTab({ org }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: org.name || '',
    white_label_product_name: org.white_label_product_name || '',
    brand_logo_url: org.brand_logo_url || '',
    brand_primary_color: org.brand_primary_color || '#0d7d74',
  });
  const [uploading, setUploading] = useState(false);

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, brand_logo_url: file_url }));
    setUploading(false);
  }

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Organization.update(org.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast({ title: 'Branding saved', description: 'Your organization branding has been updated.' });
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Organization Branding</CardTitle>
        <CardDescription className="text-xs">These values drive the public Privacy Center and your dashboard header.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-lg">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Organization Name</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">White-Label Product Name</Label>
          <Input value={form.white_label_product_name} onChange={e => setForm({ ...form, white_label_product_name: e.target.value })} className="h-9 text-sm" placeholder="Privacy & Data Rights Center" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Brand Logo</Label>
          <div className="flex items-center gap-3">
            {form.brand_logo_url && (
              <img src={form.brand_logo_url} alt="Logo preview" className="h-10 w-10 object-contain rounded border border-border bg-muted/40 p-0.5" onError={e => e.target.style.display = 'none'} />
            )}
            <label className="flex items-center gap-2 cursor-pointer h-9 px-3 rounded-md border border-border bg-white text-sm text-muted-foreground hover:bg-muted/40 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Uploading…' : form.brand_logo_url ? 'Replace logo' : 'Upload logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            </label>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-muted-foreground shrink-0">or paste URL</span>
            <Input
              value={form.brand_logo_url}
              onChange={e => setForm({ ...form, brand_logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="h-9 text-sm"
            />
          </div>
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
        <Button size="sm" className="h-9 text-sm" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
          <Check className="w-3.5 h-3.5 mr-1.5" />
          Save Branding
        </Button>
      </CardContent>
    </Card>
  );
}

function TeamTab({ members, currentUser, orgId, isOwnerOrAdmin, refetch, plan }) {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState(null);

  const atMemberLimit = !canAddMember(plan, members.length);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      // The platform User role only accepts 'admin' or 'user'; 'staff' maps to 'user'.
      const platformRole = inviteRole === 'admin' ? 'admin' : 'user';
      await base44.users.inviteUser(inviteEmail.trim(), platformRole);
      toast({ title: 'Invitation sent', description: `Invite sent to ${inviteEmail.trim()} as ${inviteRole}.` });
      setInviteEmail('');
      refetch();
    } catch (err) {
      toast({
        title: 'Invite failed',
        description: err?.message || 'Could not send the invitation. Please check the email and try again.',
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (member) => {
    if (member.id === currentUser?.id) { toast({ title: "Can't remove yourself", variant: 'destructive' }); return; }
    setRemoving(member.id);
    await base44.entities.User.update(member.id, { organization: null });
    toast({ title: 'Member removed', description: `${member.full_name || member.email} has been removed.` });
    setRemoving(null);
    refetch();
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
        {!isOwnerOrAdmin && (
          <CardDescription className="text-xs">Only owners and admins can invite or remove members.</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isOwnerOrAdmin && (
          <div className="flex items-end gap-3 mb-6">
            <div className="flex-1 max-w-xs">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Email Address</Label>
              <Input
                placeholder="colleague@firm.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="h-9 text-sm"
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
              />
            </div>
            <div className="w-32">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="h-9 text-sm" onClick={handleInvite} disabled={inviting || !inviteEmail.trim() || atMemberLimit} title={atMemberLimit ? 'Team member limit reached for your plan' : undefined}>
              {inviting ? 'Sending…' : 'Invite'}
            </Button>
            {atMemberLimit && (
              <p className="text-[11px] text-amber-600 w-full mt-1">Team member limit reached. Upgrade your plan to add more.</p>
            )}
          </div>
        )}

        <div className="space-y-1">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/40 group">
              <div>
                <p className="text-sm font-medium">{m.full_name || '—'}</p>
                <p className="text-[12px] text-muted-foreground">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`text-[11px] ${roleColors[m.role] || ''}`}>
                  {m.role}
                </Badge>
                {isOwnerOrAdmin && m.id !== currentUser?.id && m.role !== 'owner' && m.role !== 'bizooma_superadmin' && (
                  <button
                    onClick={() => handleRemove(m)}
                    disabled={removing === m.id}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
                    title="Remove from organization"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Role legend */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Role Permissions</p>
          <div className="space-y-1.5 text-[12px] text-muted-foreground">
            <p><span className="font-medium text-foreground">Owner / Admin</span> — full access including branding, billing, and team management</p>
            <p><span className="font-medium text-foreground">Staff</span> — can work requests, view consent log and audit trail; cannot edit branding or billing</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}