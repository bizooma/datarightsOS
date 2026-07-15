import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Send, Loader2, CheckCircle2, LifeBuoy } from 'lucide-react';

const CATEGORIES = [
  'General Question',
  'Widget / Installation',
  'Data Rights Requests',
  'Billing & Subscription',
  'Bug Report',
  'Feature Request',
];

export default function PublicSupport() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('General Question');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendPublicSupportRequest', {
        name, email, category, subject, message,
      });
      if (res?.data?.error) throw new Error(res.data.error);
      setSent(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setCategory('General Question');
      toast({ title: 'Support request sent', description: 'Our team will reply to your email shortly.' });
    } catch (err) {
      toast({ title: 'Could not send', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="bg-[#14202b] text-white">
          <div className="max-w-3xl mx-auto px-6 py-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0d7d74]/20 mb-4">
              <LifeBuoy className="w-6 h-6 text-[#0d7d74]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              How can we help?
            </h1>
            <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto">
              Send us your question and our team will get back to you by email. You can also reach us
              directly at <a href="mailto:support@bizooma.com" className="text-[#0d7d74] hover:underline">support@bizooma.com</a>.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="max-w-2xl mx-auto px-6 py-16">
          <Card>
            <CardContent className="pt-6">
              {sent && (
                <div className="mb-5 flex items-start gap-2 rounded-md bg-primary/10 border border-primary/20 p-3 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Thanks! We received your request and will reply by email soon.</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Your name</Label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="h-9 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-9 text-sm"
                      required
                    />
                  </div>
                </div>
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
                    placeholder="Brief summary of your question"
                    className="h-9 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Message</Label>
                  <Textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us what you need help with."
                    rows={7}
                    className="text-sm resize-y"
                    required
                  />
                </div>
                <Button type="submit" className="h-10 text-sm gap-1.5" disabled={sending}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending…' : 'Send Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}