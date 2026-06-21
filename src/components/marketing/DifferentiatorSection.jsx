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

        {/* Right: audit log mockup */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 font-mono text-xs space-y-3">
          <p className="font-sans text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Audit trail — live preview</p>
          {[
            { time: '2026-06-21 09:14:02', actor: 'widget', event: 'request_received', type: 'deletion', color: '#0d7d74' },
            { time: '2026-06-21 09:14:02', actor: 'system', event: 'deadline_set', type: '45 days — 2026-08-05', color: '#b58a2e' },
            { time: '2026-06-21 11:30:44', actor: 'jane@firm.com', event: 'identity_verified', type: '', color: '#0d7d74' },
            { time: '2026-06-21 14:02:17', actor: 'jane@firm.com', event: 'status_changed', type: 'in_progress', color: '#14202b' },
            { time: '2026-06-22 10:05:59', actor: 'jane@firm.com', event: 'request_fulfilled', type: '', color: '#0d7d74' },
          ].map((row, i) => (
            <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-200 last:border-0 last:pb-0">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: row.color }} />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400">{row.time}</p>
                <p className="text-[11px] font-semibold text-[#14202b]">
                  {row.event}{row.type ? <span className="text-slate-500 font-normal"> — {row.type}</span> : ''}
                </p>
                <p className="text-[10px] text-slate-400">{row.actor}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}