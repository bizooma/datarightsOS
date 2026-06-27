import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { LifeBuoy, Send, Loader2, CheckCircle2 } from 'lucide-react';

const CATEGORIES = [
  'General Question',
  'Widget / Installation',
  'Data Rights Requests',
  'Billing & Subscription',
  'Bug Report',
  'Feature Request',
];

export default function Support() {
  const { toast } = useToast();
  const [category, setCategory] = useState('General Question');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendSupportRequest', { category, subject, message });
      if (res?.data?.error) throw new Error(res.data.error);
      setSent(true);
      setSubject('');
      setMessage('');
      setCategory('General Question');
      toast({ title: 'Support request sent', description: 'Our team will get back to you shortly.' });
    } catch (err) {
      toast({ title: 'Could not send', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Support"
        description="Having an issue? Send us the details and our team will help you out."
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-primary" />
            Contact Support
          </CardTitle>
          <CardDescription className="text-xs">
            Your message goes straight to our support team along with your account details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent && (
            <div className="mb-4 flex items-start gap-2 rounded-md bg-primary/10 border border-primary/20 p-3 text-sm text-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>Thanks! We received your request and will reply by email soon. Need to send another?</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Topic</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Subject</Label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Brief summary of your issue"
                className="h-9 text-sm"
                required
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Describe the issue</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what's happening, what you expected, and any steps to reproduce it."
                rows={7}
                className="text-sm resize-y"
                required
              />
            </div>
            <Button type="submit" size="sm" className="h-9 text-sm gap-1.5" disabled={sending}>
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {sending ? 'Sending…' : 'Send Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}