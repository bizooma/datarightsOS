import { FileCheck, Clock, Lock } from 'lucide-react';

export default function DifferentiatorSection() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-14 items-center">
        {/* Left: text */}
        <div>
          <div className="inline-flex items-center gap-2 text-[#b58a2e] text-xs font-semibold bg-[#b58a2e]/8 border border-[#b58a2e]/20 px-3 py-1.5 rounded-full mb-6">
            <FileCheck className="w-3.5 h-3.5" />
            The audit trail is the product
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#14202b] mb-5 leading-tight">
            Other tools give you a banner.<br />
            We give you proof.
          </h2>
          <p className="text-slate-600 leading-relaxed mb-8">
            A cookie pop-up tells visitors about cookies. It does not prove you honored a deletion
            request within 45 days. It does not give you a timestamped record to hand a regulator.
            Data Rights OS writes every event to an immutable log the moment it happens —
            so when you need to demonstrate compliance, the evidence is already there.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: FileCheck,
                color: '#b58a2e',
                label: 'Court-ready audit export',
                sub: 'Timestamped CSV of every consent and request event.',
              },
              {
                icon: Clock,
                color: '#0d7d74',
                label: '45-day deadline tracking',
                sub: 'Auto-calculated from request receipt; visible to the whole team.',
              },
              {
                icon: Lock,
                color: '#14202b',
                label: 'Organization-level isolation',
                sub: "Each tenant's data is logically separated. No cross-contamination.",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${item.color}12`, border: `1px solid ${item.color}25` }}
                >
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#14202b]">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Sephora enforcement case study */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
          <img
            src="https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/0fad3965e_Sephora-767x633.jpg"
            alt="Sephora storefront"
            className="w-full h-56 object-cover"
          />
          <div className="p-6">
            <h3 className="text-lg font-bold text-[#14202b] mb-3 leading-snug">
              Sephora pays $1.2 million to settle a California suit.
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              SACRAMENTO — Sephora Inc., one of the world's largest cosmetics retailers, has settled
              a lawsuit claiming that the company sold customer information without proper notice in
              violation of California's landmark consumer privacy law, state Atty. Gen. Rob Bonta said
              Wednesday.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sephora failed to tell customers that it was selling their personal information, failed
              to allow customers to opt out of that sale, and didn't fix the problem within 30 days as
              required by the law even after it was notified of the violation, state officials said.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}