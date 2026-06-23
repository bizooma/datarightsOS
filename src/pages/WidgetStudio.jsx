import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { generateKey } from '@/lib/tenantUtils';
import { canAddSite } from '@/lib/planLimits';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { FileText, Plus, Globe, Check } from 'lucide-react';
import EmbedSnippet from '@/components/widget-studio/EmbedSnippet';
import PrivacyCenterPreview from '@/components/widget-studio/PrivacyCenterPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function WidgetStudio() {
  const { orgId, user } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: org } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const orgs = await base44.entities.Organization.filter({ id: orgId });
      return orgs[0] || null;
    },
    enabled: !!orgId,
  });
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [liveFormData, setLiveFormData] = useState(null);

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['sites', orgId],
    queryFn: () => orgId ? base44.entities.Site.filter({ organization: orgId }) : [],
    enabled: true,
  });

  const selectedSite = sites.find(s => s.id === selectedSiteId) || sites[0];
  const atSiteLimit = org ? !canAddSite(org.plan, sites.length) : false;

  const createSiteMutation = useMutation({
    mutationFn: (data) => base44.entities.Site.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setShowAddForm(false);
      setNewDomain('');
      toast.success('Site created');
    },
  });

  const updateSiteMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Site.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site updated');
    },
  });

  const handleCreateSite = async () => {
    if (!newDomain.trim()) return;

    let effectiveOrgId = orgId;

    // If user has no org yet, create one automatically
    if (!effectiveOrgId) {
      try {
        const newOrg = await base44.entities.Organization.create({
          name: user?.full_name ? `${user.full_name}'s Organization` : 'My Organization',
          plan: 'trial',
          billing_status: 'active',
        });
        await base44.auth.updateMe({ organization: newOrg.id });
        effectiveOrgId = newOrg.id;
        queryClient.invalidateQueries({ queryKey: ['organization'] });
      } catch (err) {
        toast.error('Could not create organization. Please try again.');
        return;
      }
    }

    createSiteMutation.mutate({
      organization: effectiveOrgId,
      domain: newDomain.trim(),
      site_key: generateKey('sk'),
      install_status: 'pending',
      enabled_drawers: ['cookies', 'privacy_rights'],
      honor_gpc: true,
      policy_version: '1.0',
    });
  };

  return (
    <div>
      <PageHeader
        title="Widget Studio"
        description="Configure privacy widgets for your sites"
        actions={
          <div className="flex items-center gap-2">
            {atSiteLimit && (
              <span className="text-[11px] text-amber-600">Site limit reached — upgrade to add more</span>
            )}
            <Button size="sm" className="h-9 text-sm" onClick={() => setShowAddForm(true)} disabled={atSiteLimit} title={atSiteLimit ? 'Site limit reached for your plan' : undefined}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Site
            </Button>
          </div>
        }
      />

      {showAddForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Domain</Label>
                <Input
                  placeholder="example.com"
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <Button size="sm" className="h-9" onClick={handleCreateSite}>Create</Button>
              <Button size="sm" variant="outline" className="h-9" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : sites.length === 0 ? (
        <EmptyState icon={Globe} title="No sites configured" description="Add a site to start configuring your privacy widget." />
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {/* Site list */}
          <div className="space-y-1">
            {sites.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSiteId(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors ${
                  selectedSite?.id === s.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <p className="truncate">{s.domain}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {s.install_status === 'active' ? '● Active' : '○ Pending'}
                </p>
              </button>
            ))}
          </div>

          {/* Site config form + embed + preview */}
          {selectedSite && (
            <div className="col-span-3 space-y-6">
              <SiteConfigForm site={selectedSite} onUpdate={updateSiteMutation.mutate} onFormChange={setLiveFormData} />
              <div className="border-t border-border pt-6 space-y-6">
                <EmbedSnippet site={selectedSite} />
                <PrivacyCenterPreview site={liveFormData || selectedSite} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SiteConfigForm({ site, onUpdate, onFormChange }) {
  const [form, setForm] = useState(site);

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      onFormChange?.(updated);
      return updated;
    });
  };

  const handleDrawerToggle = (drawer) => {
    const current = form.enabled_drawers || [];
    const updated = current.includes(drawer)
      ? current.filter(d => d !== drawer)
      : [...current, drawer];
    handleChange('enabled_drawers', updated);
  };

  const handleSave = () => {
    const { id, created_date, updated_date, created_by_id, ...data } = form;
    onUpdate({ id: site.id, data });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Domain" value={form.domain} onChange={v => handleChange('domain', v)} />
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Site Key</Label>
            <Input value={form.site_key || ''} readOnly className="h-9 text-sm bg-muted font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Install Status</Label>
            <Select value={form.install_status} onValueChange={v => handleChange('install_status', v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Widget Position</Label>
            <Select value={form.widget_position || 'bottom-right'} onValueChange={v => handleChange('widget_position', v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Widget Drawers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {['cookies', 'privacy_rights', 'accessibility'].map(d => (
            <div key={d} className="flex items-center gap-2">
              <Checkbox
                checked={(form.enabled_drawers || []).includes(d)}
                onCheckedChange={() => handleDrawerToggle(d)}
              />
              <span className="text-sm capitalize">{d.replace('_', ' ')}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Privacy Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Honor GPC</p>
              <p className="text-[11px] text-muted-foreground">Automatically respect Global Privacy Control signals</p>
            </div>
            <Switch checked={form.honor_gpc} onCheckedChange={v => handleChange('honor_gpc', v)} />
          </div>
          <FormField label="Privacy Policy URL" value={form.privacy_policy_url} onChange={v => handleChange('privacy_policy_url', v)} />
          <FormField label="Policy Version" value={form.policy_version} onChange={v => handleChange('policy_version', v)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Accessibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Accessibility Statement URL" value={form.accessibility_statement_url} onChange={v => handleChange('accessibility_statement_url', v)} />
          <FormField label="Barrier Report Email" value={form.barrier_report_email} onChange={v => handleChange('barrier_report_email', v)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Media</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="Intro Video URL" value={form.intro_video_url} onChange={v => handleChange('intro_video_url', v)} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="h-9 text-sm">
          <Check className="w-3.5 h-3.5 mr-1.5" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      <Input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ''}
        className="h-9 text-sm"
      />
    </div>
  );
}