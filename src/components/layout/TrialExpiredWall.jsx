import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function TrialExpiredWall({ org }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (window.self !== window.top) {
      alert('Checkout only works from the published app. Please open your live site to upgrade.');
      return;
    }
    if (!org?.id) {
      alert('Could not start checkout. Please try again.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('createCheckoutSession', {
        plan: 'core',
        organization_id: org.id,
        success_url: `${window.location.origin}/dashboard?checkout=success`,
        cancel_url: `${window.location.origin}/settings?checkout=canceled`,
      });
      if (data?.url) window.location.href = data.url;
      else { alert('Could not start checkout. Please try again.'); setLoading(false); }
    } catch (e) {
      alert('Could not start checkout. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Your free trial has ended</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your 7-day free trial has expired. Upgrade to a paid plan to continue using Data Rights OS and keep your data, widgets, and consent records.
          </p>
        </div>
        <div className="bg-muted rounded-xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plans start at</p>
          <p className="text-2xl font-bold text-foreground">$99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
          <ul className="text-sm text-muted-foreground space-y-1 mt-2">
            <li>✓ Core — $99/mo: cookie consent widget, data-rights intake, 1-year audit trail</li>
            <li>✓ Proof — $299/mo: up to 10 sites, unlimited audit retention, CSV export, white-label</li>
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <Button className="w-full" onClick={handleUpgrade} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade Now'}
          </Button>
          <button
            onClick={() => { window.base44?.auth?.logout?.('/'); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Log out
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Need help? Contact <a href="mailto:support@bizooma.com" className="underline">support@bizooma.com</a>
        </p>
      </div>
    </div>
  );
}