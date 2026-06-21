import { AlertTriangle, TrendingUp, FileX } from 'lucide-react';

export default function ProblemSection() {
  return (
    <section className="bg-[#14202b] py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Privacy enforcement is no longer theoretical.
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Nineteen US states now have comprehensive consumer privacy laws. Regulators are issuing
            seven- and eight-figure settlements. Demand letters from consumer rights organizations
            are rising fast. Most websites are dangerously exposed.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center mb-4">
              <TrendingUp className="w-4.5 h-4.5 text-red-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">19 states, more coming</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              California, Texas, Virginia, Colorado, and 15 more states have enacted privacy laws.
              Each creates enforceable consumer data rights with 45-day response windows.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Settlements in the millions</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enforcement actions have produced settlements from six to nine figures. Every site that
              collects data is a potential target — regardless of company size.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="w-9 h-9 rounded-lg bg-slate-500/20 flex items-center justify-center mb-4">
              <FileX className="w-4.5 h-4.5 text-slate-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Cookie banners aren't enough</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Most sites have a consent pop-up. Almost none have a structured way to receive, track,
              fulfill, and <em className="text-white not-italic font-medium">prove</em> they handled a data-rights request on time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}