import { Cookie, Inbox, Shield } from 'lucide-react';

const features = [
  {
    icon: Cookie,
    color: '#0d7d74',
    title: 'Cookie consent with GPC',
    description:
      'Branded widget handles strictly-necessary, functional, analytics, and advertising cookies. Automatically honors the Global Privacy Control signal — a legal requirement in California and growing states.',
    details: ['Accept / reject all or by category', 'GPC auto-opt-out with audit log entry', 'Custom brand color and logo', 'Per-visitor consent receipt IDs'],
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
            Three focused modules, deployed with one embed snippet.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
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
              <ul className="space-y-2 mt-auto">
                {f.details.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-xs text-slate-500">
                    <span className="mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${f.color}15` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color }} />
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}