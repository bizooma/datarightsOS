import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Check, AlertTriangle, Mail, Building2, Globe } from 'lucide-react';
import {
  DEFAULT_ACK_SUBJECT, DEFAULT_ACK_BODY,
  DEFAULT_COMPLETION_SUBJECT, DEFAULT_COMPLETION_BODY,
  MERGE_FIELDS,
} from '@/lib/requesterEmails';

export default function RequesterEmailsTab({ org, sites = [] }) {
  // scope = 'org' for organization defaults, or a site id for per-site overrides.
  const [scope, setScope] = useState('org');

  const activeSite = scope === 'org' ? null : sites.find(s => s.id === scope);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Scope picker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> Which settings are you editing?
          </CardTitle>
          <CardDescription className="text-xs">
            Organization defaults apply to every site. Each site can override them with its own sender identity and templates — anything left blank on a site falls back to your organization defaults.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-9 text-sm max-w-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="org">
                <span className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> Organization defaults</span>
              </SelectItem>
              {sites.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> {s.domain}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Editor — remounts per scope so the form reinitializes from the right record */}
      <RequesterEmailsForm
        key={scope}
        scope={scope}
        org={org}
        site={activeSite}
      />
    </div>
  );
}

function RequesterEmailsForm({ scope, org, site }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isOrg = scope === 'org';
  const source = isOrg ? org : site;

  // For org defaults, blank template fields show the hard-coded default text.
  // For a site, blank fields stay blank (they inherit the org value at send time).
  const [form, setForm] = useState({
    business_name: source?.business_name || '',
    privacy_contact_email: source?.privacy_contact_email || '',
    ack_email_subject: source?.ack_email_subject || (isOrg ? DEFAULT_ACK_SUBJECT : ''),
    ack_email_body: source?.ack_email_body || (isOrg ? DEFAULT_ACK_BODY : ''),
    completion_email_subject: source?.completion_email_subject || (isOrg ? DEFAULT_COMPLETION_SUBJECT : ''),
    completion_email_body: source?.completion_email_body || (isOrg ? DEFAULT_COMPLETION_BODY : ''),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updateMutation = useMutation({
    mutationFn: (data) => isOrg
      ? base44.functions.invoke('updateOrganizationSettings', { organization_id: org.id, updates: data })
      : base44.entities.Site.update(site.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast({
        title: 'Requester emails saved',
        description: isOrg
          ? 'Your organization sender identity and templates have been updated.'
          : `Settings for ${site.domain} have been updated.`,
      });
    },
  });

  // Effective contact used at send time (site value or org fallback).
  const orgContact = (org?.privacy_contact_email || '').trim();
  const effectiveContact = (form.privacy_contact_email.trim() || (isOrg ? '' : orgContact));
  const hasContact = !!effectiveContact;

  const orgBusinessPlaceholder = (org?.business_name || org?.name || 'Your business name');

  // Placeholders on a site show the inherited org value so users see what they'll get.
  const ph = (field, fallback) => (isOrg ? fallback : (org?.[field] || fallback));

  return (
    <div className="space-y-6">
      {!hasContact && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">
            {isOrg
              ? 'Set your privacy contact email to enable requester notifications.'
              : 'This site has no contact email and your organization default is also empty — requester notifications for this site will not be sent.'}
          </p>
        </div>
      )}

      {/* Sender identity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Sender Identity {!isOrg && <span className="text-[11px] font-normal text-muted-foreground">· {site.domain}</span>}
          </CardTitle>
          <CardDescription className="text-xs">
            Requester emails are sent under your business name, never from DataRightsOS. The contact email is shown to requesters as the reply destination.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Business Name (from-name)</Label>
            <Input
              value={form.business_name}
              onChange={e => set('business_name', e.target.value)}
              placeholder={isOrg ? orgBusinessPlaceholder : (org?.business_name || org?.name || orgBusinessPlaceholder)}
              className="h-9 text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              {isOrg
                ? `Shown as the sender. Falls back to “${org?.name}” if blank.`
                : `Leave blank to inherit “${org?.business_name || org?.name}” from your organization.`}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Privacy Contact Email (reply-to)</Label>
            <Input
              type="email"
              value={form.privacy_contact_email}
              onChange={e => set('privacy_contact_email', e.target.value)}
              placeholder={ph('privacy_contact_email', 'privacy@yourbusiness.com')}
              className={`h-9 text-sm ${!hasContact ? 'border-amber-400' : ''}`}
            />
            {!isOrg && orgContact && !form.privacy_contact_email.trim() && (
              <p className="text-[11px] text-muted-foreground mt-1">Inheriting “{orgContact}” from your organization.</p>
            )}
            {!hasContact && (
              <p className="text-[11px] text-amber-600 mt-1">Required — no requester emails are sent until this is set.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Merge field reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Merge Fields</CardTitle>
          <CardDescription className="text-xs">Insert any of these tokens; they’re replaced automatically when an email is sent.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {MERGE_FIELDS.map(f => (
              <code key={f} className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">{f}</code>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Acknowledgment template */}
      <TemplateCard
        title="Acknowledgment Email"
        description="Sent automatically when a request is submitted."
        inheritNote={!isOrg ? 'Leave blank to use your organization template.' : null}
        subject={form.ack_email_subject}
        body={form.ack_email_body}
        subjectPlaceholder={ph('ack_email_subject', DEFAULT_ACK_SUBJECT)}
        bodyPlaceholder={ph('ack_email_body', DEFAULT_ACK_BODY)}
        onSubject={v => set('ack_email_subject', v)}
        onBody={v => set('ack_email_body', v)}
        onReset={() => {
          set('ack_email_subject', isOrg ? DEFAULT_ACK_SUBJECT : '');
          set('ack_email_body', isOrg ? DEFAULT_ACK_BODY : '');
        }}
        resetLabel={isOrg ? 'Reset to default' : 'Clear (inherit org)'}
      />

      {/* Completion template */}
      <TemplateCard
        title="Completion Email"
        description="Sent automatically when a request is marked Complete. The line describing what was done is added based on the request type."
        inheritNote={!isOrg ? 'Leave blank to use your organization template.' : null}
        subject={form.completion_email_subject}
        body={form.completion_email_body}
        subjectPlaceholder={ph('completion_email_subject', DEFAULT_COMPLETION_SUBJECT)}
        bodyPlaceholder={ph('completion_email_body', DEFAULT_COMPLETION_BODY)}
        onSubject={v => set('completion_email_subject', v)}
        onBody={v => set('completion_email_body', v)}
        onReset={() => {
          set('completion_email_subject', isOrg ? DEFAULT_COMPLETION_SUBJECT : '');
          set('completion_email_body', isOrg ? DEFAULT_COMPLETION_BODY : '');
        }}
        resetLabel={isOrg ? 'Reset to default' : 'Clear (inherit org)'}
      />

      <Button size="sm" className="h-9 text-sm" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
        <Check className="w-3.5 h-3.5 mr-1.5" />
        {updateMutation.isPending ? 'Saving…' : isOrg ? 'Save Organization Defaults' : `Save Settings for ${site.domain}`}
      </Button>
    </div>
  );
}

function TemplateCard({ title, description, inheritNote, subject, body, subjectPlaceholder, bodyPlaceholder, onSubject, onBody, onReset, resetLabel }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <CardDescription className="text-xs">{description}{inheritNote && ` ${inheritNote}`}</CardDescription>
          </div>
          <button onClick={onReset} className="text-[11px] text-muted-foreground hover:text-foreground underline shrink-0 mt-0.5">
            {resetLabel || 'Reset to default'}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Subject</Label>
          <Input value={subject} onChange={e => onSubject(e.target.value)} placeholder={subjectPlaceholder} className="h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Body</Label>
          <Textarea value={body} onChange={e => onBody(e.target.value)} placeholder={bodyPlaceholder} rows={12} className="text-sm font-mono leading-relaxed" />
        </div>
      </CardContent>
    </Card>
  );
}