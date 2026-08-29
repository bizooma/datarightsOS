import { useState } from 'react';
import { Mail, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function EmailReportForm({ scan }) {
  const [email, setEmail] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy || sent) return;
    const addr = email.trim();
    if (!addr) return;
    setBusy(true);
    setError('');
    try {
      const res = await base44.functions.invoke('emailScanReport', {
        scan_id: scan.id,
        email: addr,
        opt_in: optIn,
      });
      if (res.data?.ok) setSent(true);
      else setError(res.data?.message || 'The report could not be emailed. Please try again.');
    } catch {
      setError('The report could not be emailed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-foreground">
          Sent. The report is on its way to <span className="font-medium">{email.trim()}</span> as a PDF
          attachment. If it doesn't arrive in a few minutes, check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Mail className="w-4 h-4 text-muted-foreground" />
        Email me this report
      </h3>

      <div className="flex flex-col sm:flex-row gap-2 mt-3">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="flex-1"
          disabled={busy}
        />
        <Button type="submit" disabled={busy} className="sm:w-auto">
          {busy ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>) : 'Send the report'}
        </Button>
      </div>

      <label className="flex items-start gap-2 mt-3 cursor-pointer">
        <Checkbox
          checked={optIn}
          onCheckedChange={(v) => setOptIn(v === true)}
          disabled={busy}
          className="mt-0.5"
        />
        <span className="text-xs text-foreground/80 leading-relaxed">
          Also send me occasional updates about privacy compliance. (Unsubscribe anytime.)
        </span>
      </label>

      <p className="text-xs text-muted-foreground mt-2">
        We'll email you this report as a PDF. We won't share your address.
      </p>

      {error && <p className="text-xs text-destructive mt-2" role="alert">{error}</p>}
    </form>
  );
}