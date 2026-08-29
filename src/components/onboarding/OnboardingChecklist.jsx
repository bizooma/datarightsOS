import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, X, Rocket, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'tessera_onboarding_dismissed';

// WHY THIS NO LONGER READS install_status: it used to mark "Paste the snippet on
// your site" complete as soon as install_status flipped to active — but that flag is
// set by a public config fetch, which any crawler, uptime monitor, or curious person
// reading the embed snippet can trigger. So the checklist would report setup finished
// when nothing had been installed, then hide itself once all steps read done.
//
// The only trustworthy evidence that the snippet is live on a real page is a consent
// record: the widget has to have actually rendered, to a real visitor, for one to
// exist. That is what step 2 keys off now.
//
// "Make it active" was also removed. Under the field split that is entitlement
// (service_status), set by billing and support — never a step a subscriber performs.
export default function OnboardingChecklist({ sites = [], orgId }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  // One record is all we need — proof the widget ran on a real page.
  const { data: liveEvidence = false } = useQuery({
    queryKey: ['onboarding-consent-evidence', orgId],
    queryFn: async () => {
      if (!orgId) return false;
      const rows = await base44.entities.ConsentRecord.filter({ organization: orgId }, '-created_date', 1);
      return (rows?.length || 0) > 0;
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const hasSite = sites.length > 0;

  const steps = [
    {
      label: 'Add your website',
      description: 'Open Widget Studio and enter your domain.',
      done: hasSite,
    },
    {
      label: 'Paste the snippet on your site',
      description: liveEvidence
        ? 'Confirmed — we have seen your widget running on a real visit.'
        : 'Copy the embed snippet into your site\'s <head>. This ticks once a real visitor loads it.',
      done: liveEvidence,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const allDone = completed === steps.length;

  if (dismissed || allDone) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  return (
    <Card className="mb-5 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Get your widget live</h3>
              <p className="text-[12px] text-muted-foreground">
                {completed} of {steps.length} steps complete — finish setup to start collecting consent.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss onboarding"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 rounded-lg border p-3 ${
                step.done ? 'border-primary/20 bg-primary/5' : 'border-border bg-white'
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  {i + 1}. {step.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Link to="/widget-studio">
            <Button size="sm" className="gap-1.5">
              Open Widget Studio
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}