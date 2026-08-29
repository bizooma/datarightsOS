import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { generateKey } from '@/lib/tenantUtils';
import { canAddSite, canHideBadge, canEditStatements, canServeStatementPages, canCustomLauncher } from '@/lib/planLimits';
import ServiceStatusPanel from '@/components/widget-studio/ServiceStatusPanel';
import UpgradePanel from '@/components/billing/UpgradePanel';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { FileText, Plus, Globe, Check, Trash2, Upload, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import EmbedSnippet from '@/components/widget-studio/EmbedSnippet';
import StatementLinksPanel from '@/components/widget-studio/StatementLinksPanel';
import PrivacyChoicesPanel from '@/components/widget-studio/PrivacyChoicesPanel';
import StatementsBlockedNotice from '@/components/statements/StatementsBlockedNotice';
import { statementBlockReason } from '@/lib/statementBlockReasons';
import DuplicateDocumentWarning from '@/components/widget-studio/DuplicateDocumentWarning';
import PrivacyCenterPreview from '@/components/widget-studio/PrivacyCenterPreview';
import LayoutPicker from '@/components/widget-studio/LayoutPicker';
import LauncherStyleSection from '@/components/widget-studio/LauncherStyleSection';
import LegalStatementsEditor from '@/components/widget-studio/LegalStatementsEditor';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  const { orgId, user, isSuperAdmin } = useCurrentUser();
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
  const [siteToDelete, setSiteToDelete] = useState(null);

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['sites', orgId],
    queryFn: () => orgId ? base44.entities.Site.filter({ organization: orgId }) : [],
    enabled: true,
  });

  const selectedSite = sites.find(s => s.id === selectedSiteId) || sites[0];
  const atSiteLimit = org ? !canAddSite(org.plan, sites.length) : false;

  // Backfill: sites created before statement URLs existed have no slug yet. Assigned
  // once, then never again — ensureSiteSlug returns the existing slug unchanged.
  useEffect(() => {
    if (!selectedSite || selectedSite.slug) return;
    let cancelled = false;
    base44.functions
      .invoke('ensureSiteSlug', { site_id: selectedSite.id })
      .then(() => { if (!cancelled) queryClient.invalidateQueries({ queryKey: ['sites'] }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selectedSite?.id, selectedSite?.slug, queryClient]);

  const createSiteMutation = useMutation({
    // The public slug is assigned server-side: uniqueness has to be checked against
    // sites this tenant can't read. A failure here is not fatal — the effect below
    // retries for any site still missing one.
    mutationFn: async (data) => {
      const created = await base44.entities.Site.create(data);
      try {
        await base44.functions.invoke('ensureSiteSlug', { site_id: created.id });
      } catch (err) {
        // Slug assignment is retried lazily; site creation itself succeeded.
      }
      return created;
    },
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

  const deleteSiteMutation = useMutation({
    mutationFn: (id) => base44.entities.Site.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      if (selectedSiteId === id) setSelectedSiteId(null);
      setSiteToDelete(null);
      toast.success('Site deleted');
    },
    onError: () => {
      setSiteToDelete(null);
      toast.error('Could not delete site. Please try again.');
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
          trial_started_at: new Date().toISOString(),
        });
        await base44.auth.updateMe({ organization: newOrg.id, role: 'owner' });
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
      // Installation is detected, not declared. service_status defaults to 'active'
      // (entity default) — a new site is entitled to service immediately.
      install_status: 'never_installed',
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
              <span className="text-[11px] text-amber-600">
                Site limit reached —{' '}
                <Link to="/settings?tab=plan" className="font-semibold underline hover:text-amber-700">upgrade to add more</Link>
              </span>
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
              <div
                key={s.id}
                className={`group flex items-center rounded-md transition-colors ${
                  selectedSite?.id === s.id
                    ? 'bg-primary/10'
                    : 'hover:bg-muted'
                }`}
              >
                <button
                  onClick={() => setSelectedSiteId(s.id)}
                  className={`flex-1 min-w-0 text-left px-3 py-2.5 text-sm ${
                    selectedSite?.id === s.id ? 'text-primary font-medium' : 'text-foreground'
                  }`}
                >
                  <p className="truncate">{s.domain}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    {/* Installation, not entitlement — a site awaiting its first load is
                        not a problem, so it is neutral, never red. */}
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        s.install_status === 'installed' ? 'bg-green-500' : 'bg-muted-foreground/40'
                      }`}
                    />
                    {s.install_status === 'installed' ? 'Installed' : 'Not seen yet'}
                  </p>
                </button>
                <button
                  onClick={() => setSiteToDelete(s)}
                  className="shrink-0 p-2 mr-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                  title="Delete site"
                  aria-label={`Delete ${s.domain}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Site config form + embed + preview */}
          {selectedSite && (
            <div className="col-span-3 space-y-6">
              {canServeStatementPages(org?.plan) && (
                <>
                  <StatementsBlockedNotice
                    reason={statementBlockReason({ site: selectedSite, org })}
                    orgId={orgId}
                    domain={selectedSite.domain}
                  />
                  <DuplicateDocumentWarning site={selectedSite} />
                </>
              )}
              <Tabs defaultValue="config">
                <TabsList className="h-9 mb-4">
                  <TabsTrigger value="config" className="text-xs">Widget Config</TabsTrigger>
                  <TabsTrigger value="legal" className="text-xs">Legal Statements</TabsTrigger>
                </TabsList>
                <TabsContent value="config">
                  <SiteConfigForm key={selectedSite.id} site={selectedSite} plan={org?.plan} isSuperAdmin={isSuperAdmin} onUpdate={updateSiteMutation.mutate} onFormChange={setLiveFormData} />
                  <div className="border-t border-border pt-6 mt-6 space-y-6">
                    <EmbedSnippet site={selectedSite} />
                    <StatementLinksPanel site={selectedSite} org={org} plan={org?.plan} />
                    <PrivacyChoicesPanel site={selectedSite} plan={org?.plan} />
                    <PrivacyCenterPreview site={liveFormData || selectedSite} />
                  </div>
                </TabsContent>
                <TabsContent value="legal">
                  {canEditStatements(org?.plan) ? (
                    <LegalStatementsEditor site={selectedSite} />
                  ) : (
                    <UpgradePanel
                      feature="statements"
                      title="Editing statements isn't included on the free plan"
                      description="Any statement you already published stays online at its existing web address — we don't take a live legal page offline. What the free plan pauses is writing and editing them, and showing them inside the widget. Upgrade to Notice to edit again."
                      adds={[
                        'Write and edit all four legal statements',
                        'Statements shown inside the widget',
                        'Accessibility statement + barrier reporting',
                        'AI use statement (incl. Spanish)',
                      ]}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!siteToDelete} onOpenChange={(open) => !open && setSiteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete site?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{siteToDelete?.domain}</span> and its widget configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => siteToDelete && deleteSiteMutation.mutate(siteToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SiteConfigForm({ site, plan, isSuperAdmin, onUpdate, onFormChange }) {
  const [form, setForm] = useState(site);
  const [uploading, setUploading] = useState(false);
  const allowHideBadge = canHideBadge(plan);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('brand_logo_url', file_url);
    } catch (err) {
      toast.error(err?.message || 'Could not upload the logo. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

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
    // slug is stripped deliberately: it is immutable once assigned, and every
    // published statement link depends on it staying put.
    //
    // install_status and service_status are stripped for a different reason: neither is
    // a setting. install_status is set one-way by the widget endpoints, and
    // service_status is entitlement — it may only change through the audited backend
    // writers, so this form must never carry a value for it.
    const {
      id, created_date, updated_date, created_by_id, slug,
      install_status, service_status,
      consent_cap_notice_month, consent_cap_notice_level,
      ...data
    } = form;
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
            <Label className="text-xs text-muted-foreground mb-1.5 block">Statement URL Slug</Label>
            <Input value={form.slug || 'assigning…'} readOnly className="h-9 text-sm bg-muted font-mono" />
            <p className="text-[11px] text-muted-foreground mt-1">
              Permanent — it appears in every published statement link, so it never changes,
              even if you edit the domain above. Changing it would break links already in
              footers and search results.
            </p>
          </div>
          <ServiceStatusPanel site={site} isSuperAdmin={isSuperAdmin} />
          <LayoutPicker
            value={form.widget_layout || 'floating'}
            accent={form.brand_primary_color || '#0d7d74'}
            onChange={v => handleChange('widget_layout', v)}
          />
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Widget Position</Label>
            <Select value={form.widget_position || 'bottom-right'} onValueChange={v => handleChange('widget_position', v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-center">Bottom Center</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-2 border-t border-border space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Launcher Position (when minimized)</Label>
              <Select value={form.launcher_position || 'bottom-right'} onValueChange={v => handleChange('launcher_position', v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-center">Bottom Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Distance from bottom of screen (px)</Label>
              <Input
                type="number"
                min="0"
                value={form.launcher_offset_bottom ?? 0}
                onChange={e => handleChange('launcher_offset_bottom', e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0"
                className="h-9 text-sm w-40"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Lifts the launcher (and the bottom-bar consent moment) above a host site's fixed bottom navigation. A site with a 72px bottom nav sets ~80. The iPhone home-indicator safe area is always cleared automatically.</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Mobile bottom distance override (px, optional)</Label>
              <Input
                type="number"
                min="0"
                value={form.launcher_offset_bottom_mobile ?? ''}
                onChange={e => handleChange('launcher_offset_bottom_mobile', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="inherits desktop value"
                className="h-9 text-sm w-56"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Many sites only have a bottom nav on mobile. Leave blank to reuse the value above on all screens.</p>
            </div>
          </div>
          <LauncherStyleSection form={form} canCustomize={canCustomLauncher(plan)} onChange={handleChange} />
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Widget Theme</Label>
            <Select value={form.widget_theme || 'dark'} onValueChange={v => handleChange('widget_theme', v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark (launcher &amp; panel dark)</SelectItem>
                <SelectItem value="light">Light (launcher &amp; panel white)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <p className="text-sm font-medium">Open by default</p>
              <p className="text-[11px] text-muted-foreground">
                {form.default_open === false
                  ? 'The widget stays collapsed — visitors see only the launcher button until they click it.'
                  : 'The widget panel opens automatically when a visitor lands on the site (desktop only; mobile always starts collapsed).'}
              </p>
            </div>
            <Switch
              checked={form.default_open !== false}
              onCheckedChange={v => handleChange('default_open', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Branding</CardTitle>
          <p className="text-[11px] text-muted-foreground">Specific to this site. Leave blank to inherit your organization's default branding.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Product Name" value={form.brand_product_name} onChange={v => handleChange('brand_product_name', v)} placeholder="e.g. Acme Privacy Center" />
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Logo</Label>
            <div className="flex items-center gap-3">
              {form.brand_logo_url && (
                <img src={form.brand_logo_url} alt="Logo preview" className="h-10 w-10 object-contain rounded border border-border bg-muted/40 p-0.5" onError={e => e.target.style.display = 'none'} />
              )}
              <label className="flex items-center gap-2 cursor-pointer h-9 px-3 rounded-md border border-border bg-white text-sm text-muted-foreground hover:bg-muted/40 transition-colors">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? 'Uploading…' : form.brand_logo_url ? 'Replace logo' : 'Upload logo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
              </label>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-muted-foreground shrink-0">or paste URL</span>
              <Input
                value={form.brand_logo_url || ''}
                onChange={e => handleChange('brand_logo_url', e.target.value)}
                placeholder="https://…/logo.png"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Primary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.brand_primary_color || '#0d7d74'}
                onChange={e => handleChange('brand_primary_color', e.target.value)}
                className="h-9 w-12 rounded-md border border-input bg-transparent cursor-pointer p-1"
              />
              <Input
                value={form.brand_primary_color || ''}
                onChange={e => handleChange('brand_primary_color', e.target.value)}
                placeholder="#0d7d74"
                className="h-9 text-sm font-mono flex-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <p className="text-sm font-medium">Hide "Powered by DataRightsOS" badge</p>
              <p className="text-[11px] text-muted-foreground">
                {allowHideBadge
                  ? 'Full white-label — removes the DataRightsOS badge from the widget footer.'
                  : 'Available on the Agency (white-label) plan. The badge stays visible on this plan.'}
              </p>
            </div>
            <Switch
              checked={allowHideBadge && !!form.hide_branding}
              disabled={!allowHideBadge}
              onCheckedChange={v => handleChange('hide_branding', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Widget Drawers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {['cookies', 'privacy_rights', 'accessibility', 'ai_disclosure'].map(d => (
            <div key={d} className="flex items-center gap-2">
              <Checkbox
                checked={(form.enabled_drawers || []).includes(d)}
                onCheckedChange={() => handleDrawerToggle(d)}
              />
              <span className="text-sm capitalize">{d === 'ai_disclosure' ? 'AI Use Statement' : d.replace('_', ' ')}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Privacy Settings</CardTitle>
          <p className="text-[11px] text-muted-foreground">Widget behavior and optional links. To write the actual policy text shown inside the widget, use the Legal Statements tab.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Honor GPC</p>
              <p className="text-[11px] text-muted-foreground">When on, the widget automatically respects visitors' Global Privacy Control browser signals (auto opt-out of data selling).</p>
            </div>
            <Switch checked={form.honor_gpc} onCheckedChange={v => handleChange('honor_gpc', v)} />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="pr-4">
              <p className="text-sm font-medium">Add statement links to my site's footer</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {plan === 'agency'
                  ? "Off by default on your plan: these links point at datarightsos.com, which would show our name in your client's footer. Turn it on only if that's acceptable — otherwise use the rewrite instructions below the embed snippet to serve the statements from your own domain."
                  : 'The widget adds plain links to your published statement pages at the bottom of your site. Search engines that run JavaScript will see them; crawlers that don\'t, won\'t — so for the strongest result also paste the static footer snippet shown below the embed snippet.'}
              </p>
            </div>
            <Switch
              checked={
                form.inject_footer_links === true || form.inject_footer_links === false
                  ? form.inject_footer_links
                  : plan !== 'agency'
              }
              onCheckedChange={v => handleChange('inject_footer_links', v)}
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="pr-4">
              <p className="text-sm font-medium">Add a "Your Privacy Choices" link to my site's footer</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                On by default for every plan, including Agency. This is the opt-out mechanism
                visitors use, not hosted content about you — the page states nothing about
                whether you sell or share data. Agency subscribers can serve it from their own
                domain using the same rewrite instructions as the statement pages.
              </p>
            </div>
            <Switch
              checked={
                form.inject_privacy_choices_link === true || form.inject_privacy_choices_link === false
                  ? form.inject_privacy_choices_link
                  : true
              }
              onCheckedChange={v => handleChange('inject_privacy_choices_link', v)}
            />
          </div>
          <FormField label="Privacy Policy URL" value={form.privacy_policy_url} onChange={v => handleChange('privacy_policy_url', v)} hint="Optional. Link to a privacy policy hosted on your own site. Leave blank if you write your policy in the Legal Statements tab." />
          <FormField label="Policy Version" value={form.policy_version} onChange={v => handleChange('policy_version', v)} hint="A version stamp (e.g. 1.0) recorded on every consent record, so you have proof of which policy version a visitor agreed to." />
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Intake Rate Limit (requests/hour)</Label>
            <Input
              type="number"
              min="1"
              value={form.intake_rate_limit_per_hour ?? 100}
              onChange={e => handleChange('intake_rate_limit_per_hour', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="100"
              className="h-9 text-sm w-40"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Max privacy requests accepted from this site's widget per hour before extra submissions are turned away and pointed to your privacy contact email. Protects email deliverability from abuse. Default 100. A separate cap of 3/hour per email address always applies.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Accessibility</CardTitle>
          <p className="text-[11px] text-muted-foreground">Optional links and contact. To write the accessibility statement shown inside the widget, use the Legal Statements tab.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Accessibility Statement URL" value={form.accessibility_statement_url} onChange={v => handleChange('accessibility_statement_url', v)} hint="Optional. Link to an accessibility statement hosted on your own site. Leave blank if you write it in the Legal Statements tab." />
          <FormField label="Barrier Report Email" value={form.barrier_report_email} onChange={v => handleChange('barrier_report_email', v)} hint="The inbox where accessibility barrier reports submitted through the widget are sent." />
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

function FormField({ label, value, onChange, placeholder, hint }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      <Input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ''}
        className="h-9 text-sm"
      />
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}