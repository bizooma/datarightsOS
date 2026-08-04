import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { PLAN_LIMITS } from '@/lib/planLimits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';

// Free is the permanent floor, below Notice. Agency stays sales-assisted.
const UPGRADE_ORDER = ['free', 'trial', 'notice', 'core', 'proof', 'agency'];
// Plans that have a real annual Stripe price. Only Notice today — do not offer an
// annual option for plans without a price (Core/Proof annual don't exist yet).
const HAS_ANNUAL = { notice: true, core: true, proof: true };

export default function BillingTab({ org, siteCount, memberCount }) {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [billingInterval, setBillingInterval] = useState('monthly');

  async function handleUpgrade(plan) {
    if (window.self !== window.top) {
      alert('Checkout only works from the published app. Please open your live site to upgrade.');
      return;
    }
    setLoadingPlan(plan);
    try {
      // Only send annual when the chosen plan actually has an annual price; the
      // backend falls back to monthly otherwise, but keep the request honest.
      const interval = (billingInterval === 'annual' && HAS_ANNUAL[plan]) ? 'annual' : 'monthly';
      const { data } = await base44.functions.invoke('createCheckoutSession', {
        plan,
        billing_interval: interval,
        success_url: `${window.location.origin}/dashboard?checkout=success`,
        cancel_url: `${window.location.origin}/dashboard?checkout=canceled`,
      });
      if (data?.url) window.location.href = data.url;
      else { alert('Could not start checkout. Please try again.'); setLoadingPlan(null); }
    } catch (e) {
      alert('Could not start checkout. Please try again.');
      setLoadingPlan(null);
    }
  }

  const limits = PLAN_LIMITS[org.plan] || PLAN_LIMITS.trial;
  const isActive = org.billing_status === 'active';
  const isPastDue = org.billing_status === 'past_due';
  const isCanceled = org.billing_status === 'canceled';

  const siteUsagePct = limits.sites === Infinity ? 0 : (siteCount / limits.sites) * 100;
  const memberUsagePct = limits.teamMembers === Infinity ? 0 : (memberCount / limits.teamMembers) * 100;

  return (
    <div className="space-y-4">
      {/* Status banner */}
      {isPastDue && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Your payment is past due. Please update your payment method to avoid service interruption.
        </div>
      )}
      {isCanceled && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Your subscription has been canceled. Upgrade to restore full access.
        </div>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-white capitalize text-xs">{limits.label}</Badge>
              <span className="text-sm font-medium text-muted-foreground">{limits.price}</span>
              <Badge variant="outline" className={`text-[11px] ${
                isActive ? 'border-emerald-300 text-emerald-700' :
                isPastDue ? 'border-amber-300 text-amber-700' :
                'border-red-300 text-red-700'
              }`}>
                {isActive ? '● Active' : isPastDue ? '⚠ Past Due' : '✕ Canceled'}
              </Badge>
            </div>
            {org.stripe_customer_portal_url && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" asChild>
                <a href={org.stripe_customer_portal_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3" />
                  Manage Subscription
                </a>
              </Button>
            )}
          </div>

          {/* Usage meters */}
          <div className="space-y-3 pt-1">
            <UsageMeter
              label="Sites"
              used={siteCount}
              limit={limits.sites}
              pct={siteUsagePct}
            />
            <UsageMeter
              label="Team Members"
              used={memberCount}
              limit={limits.teamMembers}
              pct={memberUsagePct}
            />
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Plan Includes</p>
            <ul className="space-y-1">
              {limits.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-foreground">
                  <Check className="w-3 h-3 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade options */}
      {org.plan !== 'agency' && (
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">{org.plan === 'trial' ? 'Choose a Plan' : 'Change Plan'}</CardTitle>
            {/* Monthly / annual toggle. Annual applies only to plans that have an
                annual price (Notice); others always check out monthly. */}
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
              {['monthly', 'annual'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setBillingInterval(opt)}
                  className={`text-[11px] font-medium px-3 py-1 rounded-md capitalize transition-colors ${
                    billingInterval === opt ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {UPGRADE_ORDER.filter(p => p !== 'trial' && UPGRADE_ORDER.indexOf(p) !== UPGRADE_ORDER.indexOf(org.plan)).map(plan => {
                const pl = PLAN_LIMITS[plan];
                const showAnnual = billingInterval === 'annual' && HAS_ANNUAL[plan];
                const priceLabel = showAnnual ? (pl.priceAnnual || pl.price) : (pl.priceMonthly || pl.price);
                const isDowngrade = UPGRADE_ORDER.indexOf(plan) < UPGRADE_ORDER.indexOf(org.plan);
                // Free has no Stripe price — it's the floor. Show it as informational,
                // never as a purchasable checkout button.
                const isFree = plan === 'free';
                return (
                  <div key={plan} className="border border-border rounded-lg p-4 flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold">{pl.label}</p>
                      <p className="text-xs text-muted-foreground">{priceLabel}</p>
                      {billingInterval === 'annual' && !HAS_ANNUAL[plan] && plan !== 'agency' && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">Billed monthly</p>
                      )}
                    </div>
                    <ul className="space-y-1 flex-1">
                      {pl.features.slice(0, 5).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Check className="w-3 h-3 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {isFree ? (
                      <div className="h-8 flex items-center justify-center text-[11px] text-muted-foreground border border-dashed border-border rounded-md w-full">
                        Free forever
                      </div>
                    ) : plan === 'agency' ? (
                      <Button size="sm" variant="outline" className="h-8 text-xs w-full" asChild>
                        <a href="mailto:sales@datarightsos.com?subject=Agency%20Plan%20Inquiry">Contact Sales</a>
                      </Button>
                    ) : (
                      <Button size="sm" variant={isDowngrade ? 'outline' : 'default'} className="h-8 text-xs w-full" onClick={() => handleUpgrade(plan)} disabled={loadingPlan === plan}>
                        {loadingPlan === plan ? <Loader2 className="w-3 h-3 animate-spin" /> : `${isDowngrade ? 'Switch to' : 'Upgrade to'} ${pl.label}`}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              Changing plans redirects you to secure checkout; upgrades take effect immediately with prorated billing. The Agency plan is sales-assisted.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UsageMeter({ label, used, limit, pct }) {
  const isUnlimited = limit === Infinity;
  const isNearLimit = pct >= 80;
  const isAtLimit = pct >= 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-xs font-medium ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-foreground'}`}>
          {used} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-400' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}