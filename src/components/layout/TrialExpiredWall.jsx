import { Link } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TrialExpiredWall() {
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
          <p className="text-2xl font-bold text-foreground">$49<span className="text-sm font-normal text-muted-foreground">/month</span></p>
          <ul className="text-sm text-muted-foreground space-y-1 mt-2">
            <li>✓ 3 sites</li>
            <li>✓ 5,000 consent records/mo</li>
            <li>✓ Full audit trail &amp; CSV export</li>
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link to="/settings">Upgrade Now</Link>
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