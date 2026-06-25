import { Cookie, Inbox, Shield, Bot, Accessibility, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: Cookie,
    color: '#0d7d74',
    title: 'Cookie consent with GPC',
    description:
      'Branded widget handles strictly-necessary, functional, analytics, and advertising cookies. Automatically honors the Global Privacy Control signal — a legal requirement in California and growing states.',
    details: ['Accept / reject all or by category', 'GPC auto-opt-out with audit log entry', 'Custom brand color and logo', 'Per-visitor consent receipt IDs'],
    link: '/cookie-consent',
  },
  {
    icon: Inbox,
    color: '#0d7d74',
    title: 'Data-rights request intake',
    description:
      'Consumers submit access, deletion, correction, and opt-out requests directly through the widget. Each request lands in your dashboard with a 45-day statutory clock running from the moment of receipt.',
    details: ['Access, delete, correct, opt-out flows', '45-day deadline auto-calculated', 'Identity verification workflow', 'Assignable to team members'],
  },
  {
    icon: Shield,
    color: '#b58a2e',
    title: 'Immutable audit trail',
    description:
      'Every consent choice and every request event is written to a tamper-evident log. Export it as a timestamped CSV any time — your proof of compliance in a regulatory inquiry or litigation hold.',
    details: ['Timestamped event log per request', 'Consent receipt archive', 'CSV and report export', 'Organization-level isolation'],
  },
  {
    icon: Bot,
    color: '#0d7d74',
    title: 'AI use disclosure',
    description:
      "Tell visitors when and how you use artificial intelligence to interact with them. Required by the FTC's guidance against deceptive AI claims and California's AB 302 (Bolts Act, 2024), with similar bot-disclosure rules in California's B.O.T. Act (SB 1001) and the EU AI Act now in effect.",
    details: ['Plain-language AI use statement', 'Surfaced in the widget disclosure drawer', 'FTC & California AB 302 aligned', 'Versioned with effective dates'],
  },
  {
    icon: Accessibility,
    color: '#b58a2e',
    title: 'Web accessibility',
    description:
      'Continuous monitoring and remediation guidance aligned to WCAG 2.1 Level AA — the standard courts and the DOJ actually use. No false "fully compliant" overlay promises that invite the next ADA lawsuit.',
    details: ['WCAG 2.1 Level AA aligned', 'Continuous monitoring, not one-time scans', 'Barrier reporting built into the widget', 'Real remediation, no overlay snake oil'],
    link: '/web-accessibility',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-[#14202b] mb-3">
            Everything a compliant site needs. Nothing it doesn't.
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Four focused modules, deployed with one embed snippet.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${f.color}15`, border: `1px solid ${f.color}30` }}
              >
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <h3 className="font-semibold text-[#14202b] mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">{f.description}</p>
              <ul className="space-y-2">
                {f.details.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-xs text-slate-500">
                    <span className="mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${f.color}15` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color }} />
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
              {f.link && (
                <Link
                  to={f.link}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d7d74] hover:gap-2.5 transition-all"
                >
                  Learn more
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}