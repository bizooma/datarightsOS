import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Mail, CheckCircle2, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Requester email status + manual send/resend on the request detail page.
 * Sends are routed through the sendRequesterEmail backend function (subscriber identity,
 * audit logging, duplicate guard). `force: true` allows resends.
 */
export default function RequesterEmailStatus({ request, org }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [sending, setSending] = useState(null); // 'acknowledgment' | 'completion' | null

  const hasContact = !!(org?.privacy_contact_email || '').trim();

  async function send(kind, force) {
    setSending(kind);
    try {
      const res = await base44.functions.invoke('sendRequesterEmail', {
        request_id: request.id,
        kind,
        force: !!force,
      });
      const data = res?.data || {};
      if (data.success) {
        toast({ title: 'Email sent', description: `${label(kind)} email sent to ${request.requester_email}.` });
      } else if (data.reason === 'no_contact_email') {
        toast({ title: 'Not sent', description: 'Set your privacy contact email in Settings first.', variant: 'destructive' });
      } else if (data.error) {
        toast({ title: 'Send failed', description: data.error, variant: 'destructive' });
      } else if (data.skipped) {
        toast({ title: 'Skipped', description: `Already sent.` });
      }
    } catch (e) {
      toast({ title: 'Send failed', description: e.message, variant: 'destructive' });
    }
    setSending(null);
    queryClient.invalidateQueries({ queryKey: ['request', request.id] });
    queryClient.invalidateQueries({ queryKey: ['audit-events', request.id] });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" /> Requester Emails
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasContact && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <p className="text-[12px]">Set your privacy contact email to enable requester notifications.</p>
          </div>
        )}

        <EmailRow
          label="Acknowledgment"
          sentAt={request.acknowledgment_sent_at}
          error={request.ack_email_error}
          hasContact={hasContact}
          sending={sending === 'acknowledgment'}
          onSend={(force) => send('acknowledgment', force)}
        />

        <EmailRow
          label="Completion"
          sentAt={request.completion_sent_at}
          error={request.completion_email_error}
          hasContact={hasContact}
          sending={sending === 'completion'}
          onSend={(force) => send('completion', force)}
        />
      </CardContent>
    </Card>
  );
}

function label(kind) {
  return kind === 'acknowledgment' ? 'Acknowledgment' : 'Completion';
}

function EmailRow({ label, sentAt, error, hasContact, sending, onSend }) {
  return (
    <div className="rounded-md border border-border px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-foreground">{label}</p>
          {sentAt ? (
            <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              Sent {format(new Date(sentAt), 'MMM d, yyyy')}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-0.5">Not sent yet</p>
          )}
        </div>
        <Button
          size="sm"
          variant={sentAt ? 'outline' : 'default'}
          className="h-7 text-[11px] shrink-0"
          disabled={sending || !hasContact}
          onClick={() => onSend(!!sentAt)}
          title={!hasContact ? 'Set your privacy contact email first' : undefined}
        >
          {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          {sentAt ? 'Resend' : `Send ${label.toLowerCase()}`}
        </Button>
      </div>
      {error && (
        <p className="text-[11px] text-destructive flex items-start gap-1 mt-1.5">
          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}