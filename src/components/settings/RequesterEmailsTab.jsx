import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Check, AlertTriangle, Mail } from 'lucide-react';
import {
  DEFAULT_ACK_SUBJECT, DEFAULT_ACK_BODY,
  DEFAULT_COMPLETION_SUBJECT, DEFAULT_COMPLETION_BODY,
  MERGE_FIELDS,
} from '@/lib/requesterEmails';

export default function RequesterEmailsTab({ org }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    business_name: org.business_name || '',
    privacy_contact_email: org.privacy_contact_email || '',
    ack_email_subject: org.ack_email_subject || DEFAULT_ACK_SUBJECT,
    ack_email_body: org.ack_email_body || DEFAULT_ACK_BODY,
    completion_email_subject: org.completion_email_subject || DEFAULT_COMPLETION_SUBJECT,
    completion_email_body: org.completion_email_body || DEFAULT_COMPLETION_BODY,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Organization.update(org.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast({ title: 'Requester emails saved', description: 'Your sender identity and templates have been updated.' });
    },
  });

  const hasContact = !!form.privacy_contact_email.trim();

  return (
    <div className="space-y-6 max-w-2xl">
      {!hasContact && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">Set your privacy contact email to enable requester notifications.</p>
        </div>
      )}

      {/* Sender identity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Sender Identity
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
              placeholder={org.name || 'Your business name'}
              className="h-9 text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Shown as the sender. Falls back to “{org.name}” if blank.</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Privacy Contact Email (reply-to)</Label>
            <Input
              type="email"
              value={form.privacy_contact_email}
              onChange={e => set('privacy_contact_email', e.target.value)}
              placeholder="privacy@yourbusiness.com"
              className={`h-9 text-sm ${!hasContact ? 'border-amber-400' : ''}`}
            />
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
        subject={form.ack_email_subject}
        body={form.ack_email_body}
        onSubject={v => set('ack_email_subject', v)}
        onBody={v => set('ack_email_body', v)}
        onReset={() => { set('ack_email_subject', DEFAULT_ACK_SUBJECT); set('ack_email_body', DEFAULT_ACK_BODY); }}
      />

      {/* Completion template */}
      <TemplateCard
        title="Completion Email"
        description="Sent automatically when a request is marked Complete. The line describing what was done is added based on the request type."
        subject={form.completion_email_subject}
        body={form.completion_email_body}
        onSubject={v => set('completion_email_subject', v)}
        onBody={v => set('completion_email_body', v)}
        onReset={() => { set('completion_email_subject', DEFAULT_COMPLETION_SUBJECT); set('completion_email_body', DEFAULT_COMPLETION_BODY); }}
      />

      <Button size="sm" className="h-9 text-sm" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
        <Check className="w-3.5 h-3.5 mr-1.5" />
        {updateMutation.isPending ? 'Saving…' : 'Save Requester Emails'}
      </Button>
    </div>
  );
}

function TemplateCard({ title, description, subject, body, onSubject, onBody, onReset }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          <button onClick={onReset} className="text-[11px] text-muted-foreground hover:text-foreground underline shrink-0 mt-0.5">
            Reset to default
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Subject</Label>
          <Input value={subject} onChange={e => onSubject(e.target.value)} className="h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Body</Label>
          <Textarea value={body} onChange={e => onBody(e.target.value)} rows={12} className="text-sm font-mono leading-relaxed" />
        </div>
      </CardContent>
    </Card>
  );
}