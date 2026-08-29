import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X, ArrowRight } from 'lucide-react';

// Dismissible banner shown to orgs on the permanent Free plan (where an expired
// trial lands). NOT a blocking wall — the dashboard stays fully usable. Explains
// what was kept (all data, retained read-only) and what the free plan withholds,
// with an upgrade CTA. Dismissal is per-session so it doesn't nag on every page.
export default function FreePlanBanner({ org }) {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('dros_free_banner_dismissed') === '1'
  );
  if (dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem('dros_free_banner_dismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            You're on the free plan — your cookie consent widget is still live.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            Your widget keeps capturing and enforcing cookie consent on your site, and your published legal
            pages stay online at the same addresses. Privacy requests you already received stay fully
            manageable, with their deadlines and reminders, until you finish them. Everything else from your
            trial is <strong>kept and safe</strong>. The free plan pauses new privacy-request intake, editing
            your legal statements, showing them inside the widget, accessibility reporting, exports, and
            consent history beyond the last 7 days.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <Link
              to="/settings?tab=billing"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Upgrade to restore everything
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}