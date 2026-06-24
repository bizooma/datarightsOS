import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, X, Rocket, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'tessera_onboarding_dismissed';

export default function OnboardingChecklist({ sites = [] }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  const hasSite = sites.length > 0;
  const hasActiveSite = sites.some((s) => s.install_status === 'active');

  const steps = [
    {
      label: 'Open Widget Studio',
      description: 'Head to Widget Studio to configure your privacy widget.',
      done: hasSite,
    },
    {
      label: 'Add a website',
      description: 'Click “Add a website” and enter your domain.',
      done: hasSite,
    },
    {
      label: 'Make it active',
      description: 'Mark your site as active once you’re ready to go live.',
      done: hasActiveSite,
    },
    {
      label: 'Paste the snippet on your site',
      description: 'Copy the embed snippet and paste it into your site’s <head>.',
      done: hasActiveSite,
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
                <p className={`text-[13px] font-medium ${step.done ? 'text-foreground' : 'text-foreground'}`}>
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