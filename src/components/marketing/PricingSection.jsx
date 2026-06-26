import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const plans = [
  {
    name: 'Core',
    price: '$99',
    period: '/mo',
    description: 'For a single site that needs solid privacy compliance.',
    cta: 'Get started',
    planKey: 'core',
    highlight: false,
    features: [
      '1 site / 1 domain',
      'Cookie consent widget with GPC',
      'Data-rights request intake',
      '45-day deadline tracking',
      'Audit trail (90-day retention)',
      '2 team members',
    ],
  },
  {
    name: 'Proof',
    price: '$299',
    period: '/mo',
    description: 'For firms and agencies running multiple client sites.',
    cta: 'Get started',
    planKey: 'proof',
    highlight: true,
    badge: 'Most popular',
    features: [
      'Up to 10 sites',
      'Everything in Core',
      'Unlimited audit trail retention',
      'CSV export for regulatory responses',
      '10 team members',
      'Priority support',
    ],
  },
  {
    name: 'Agency',
    price: 'Custom',
    period: '',
    description: 'Resellers and large agencies with dozens of client organizations.',
    cta: 'Contact us',
    contact: true,
    highlight: false,
    features: [
      'Unlimited sites & organizations',
      'Everything in Proof',
      'Multi-tenant isolation',
      'Your own product name',
      'Dedicated onboarding',
      'Unlimited team members',
      'SLA & MSA available',
    ],
  },
];

export default function PricingSection() {
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleCheckout = async (planKey) => {
    if (window.self !== window.top) {
      alert('Checkout works only from the published app. Please open the live site in a new tab to subscribe.');
      return;
    }
    setLoadingPlan(planKey);
    try {
      const res = await base44.functions.invoke('createCheckoutSession', {
        plan: planKey,
        success_url: `${window.location.origin}/dashboard?checkout=success`,
        cancel_url: `${window.location.origin}/?checkout=canceled`,
      });
      const url = res?.data?.url || res?.url;
      if (url) {
        window.location.href = url;
      } else {
        console.error('No checkout URL in response', res);
        alert('Unable to start checkout. Please try again.');
        setLoadingPlan(null);
      }
    } catch (err) {
      console.error('Checkout error', err);
      alert('Unable to start checkout. Please try again.');
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="bg-slate-50 border-t border-slate-100 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#14202b] mb-3">
            Simple, transparent pricing.
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            No per-request fees. No surprise overages. Cancel any time.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-7 flex flex-col ${
                plan.highlight
                  ? 'bg-[#14202b] border-[#14202b] shadow-xl'
                  : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${plan.highlight ? 'text-white' : 'text-[#14202b]'}`}>
                  {plan.name}
                </span>
                {plan.badge && (
                  <span className="text-[10px] font-semibold bg-[#0d7d74] text-white px-2 py-0.5 rounded-full">
                    {plan.badge}
                  </span>
                )}
              </div>

              <div className="flex items-end gap-1 mb-2">
                <span className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-[#14202b]'}`}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={`text-sm pb-1 ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                    {plan.period}
                  </span>
                )}
              </div>

              <p className={`text-xs mb-6 leading-relaxed ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                {plan.description}
              </p>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${plan.highlight ? 'text-[#0d7d74]' : 'text-[#0d7d74]'}`} />
                    <span className={plan.highlight ? 'text-slate-300' : 'text-slate-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.contact ? (
                <a
                  href="mailto:sales@bizooma.com?subject=Agency%20plan%20inquiry"
                  className="w-full text-center text-sm font-semibold py-2.5 rounded-lg transition-colors border border-slate-200 text-[#14202b] hover:bg-slate-50"
                >
                  {plan.cta}
                </a>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.planKey)}
                  disabled={loadingPlan === plan.planKey}
                  className={`w-full inline-flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 ${
                    plan.highlight
                      ? 'bg-[#0d7d74] text-white hover:bg-[#0a6b63]'
                      : 'border border-slate-200 text-[#14202b] hover:bg-slate-50'
                  }`}
                >
                  {loadingPlan === plan.planKey && <Loader2 className="w-4 h-4 animate-spin" />}
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}