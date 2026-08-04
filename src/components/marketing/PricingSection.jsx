import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: 'Free',
    period: '',
    description: 'Cookie consent for one site, free forever. No credit card.',
    cta: 'Start free trial',
    planKey: 'free',
    highlight: false,
    note: 'Trials that don\u2019t upgrade roll into the free plan automatically — your widget keeps working.',
    features: [
      '1 site / 1 domain',
      'Cookie consent with full GPC enforcement',
      'Both widget layouts',
      'Up to 10,000 consent records/month',
      '7 days of consent log history',
      'Community docs support',
      '"Powered by DataRightsOS" badge',
    ],
  },
  {
    name: 'Notice',
    price: '$39',
    period: '/mo',
    description: 'Publish your statements, capture and enforce cookie choices, and give visitors a way to report barriers and submit requests.',
    cta: 'Start Free Trial',
    planKey: 'notice',
    highlight: false,
    features: [
      'Everything in Free, plus:',
      '1 site / 1 domain',
      '1 team member',
      'Cookie consent with full GPC enforcement',
      'Accessibility statement + barrier reports',
      'AI use statement (incl. Spanish)',
      'All four legal statements in-widget',
      'Consent log (90 days of history)',
      'Privacy requests forwarded by email',
    ],
  },
  {
    name: 'Core',
    price: '$99',
    period: '/mo',
    description: 'For a single site that needs to track privacy requests and deadlines.',
    cta: 'Start Free Trial',
    planKey: 'core',
    highlight: false,
    features: [
      'Everything in Notice, plus:',
      'Data-rights request intake with identity verification',
      '45-day deadline tracking + alerts',
      'Per-request fulfillment checklists',
      'Audit trail (1-year retention)',
      'CSV export of your own records',
      '2 team members',
    ],
  },
  {
    name: 'Proof',
    price: '$299',
    period: '/mo',
    description: 'For firms and agencies running multiple client sites.',
    cta: 'Start Free Trial',
    planKey: 'proof',
    highlight: true,
    badge: 'Most popular',
    features: [
      'Up to 10 sites',
      'Everything in Core',
      'Unlimited audit trail retention',
      'Bulk & scheduled CSV export',
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
      'Full white-label — remove DataRightsOS branding',
      'Dedicated onboarding',
      'Unlimited team members',
      'SLA & MSA available',
    ],
  },
];

export default function PricingSection() {
  const navigate = useNavigate();

  // Everyone starts on the free 7-day trial. After creating an account they can
  // upgrade to a paid plan any time from Settings → Billing.
  const handleGetStarted = () => {
    navigate('/register');
  };

  return (
    <section id="pricing" className="bg-slate-50 border-t border-slate-100 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#14202b] mb-3">
            Simple, transparent pricing.
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto whitespace-nowrap">
            No per-request fees. No surprise overages. Cancel any time.
          </p>
        </div>

        {/* Free trial entry point — leads to registration, no card required */}
        <div className="mb-10 rounded-2xl border border-[#0d7d74]/20 bg-[#0d7d74]/5 p-6 text-center">
          <p className="text-sm font-semibold text-[#0d7d74] mb-1">Try it free for 7 days</p>
          <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
            Create your account and explore every feature. No credit card required — upgrade any time before your trial ends.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold py-2.5 px-6 rounded-lg bg-[#0d7d74] text-white hover:bg-[#0a6b63] transition-colors"
          >
            Start free trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 items-start">
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
                  href="mailto:joe@bizooma.com?subject=Agency%20plan%20inquiry"
                  className="w-full text-center text-sm font-semibold py-2.5 rounded-lg transition-colors border border-slate-200 text-[#14202b] hover:bg-slate-50"
                >
                  {plan.cta}
                </a>
              ) : (
                <button
                  onClick={handleGetStarted}
                  className={`w-full inline-flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg transition-colors ${
                    plan.highlight
                      ? 'bg-[#0d7d74] text-white hover:bg-[#0a6b63]'
                      : 'border border-slate-200 text-[#14202b] hover:bg-slate-50'
                  }`}
                >
                  {plan.cta}
                </button>
              )}
              {plan.note && (
                <p className="text-[10px] leading-snug text-slate-400 mt-2 text-center">{plan.note}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}