import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

export default function HeroSection() {
  return (
    <section
      className="relative pt-20 pb-24 px-6 bg-cover bg-center"
      style={{ backgroundImage: "url('https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/3f65e2111_Depositphotos_182848134_S.jpg')" }}
    >
      <div className="absolute inset-0 bg-[#14202b]/70" />
      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-[#0d7d74]/8 border border-[#0d7d74]/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0d7d74]" />
          Built for US state privacy law compliance
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold text-white leading-[1.1] tracking-tight mb-6">
          Consent, data rights,<br />
          and proof — in one widget.
        </h1>

        <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
          Drop one script tag onto any website. Data Rights OS handles cookie consent with GPC,
          consumer data-rights request intake, deadline tracking, and generates a court-ready audit
          trail — all under the US state privacy laws that apply to your clients.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[#0d7d74] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#0a6b63] transition-colors text-sm"
          >
            Start free trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-lg border border-white/30 hover:bg-white/10 transition-colors text-sm"
          >
            <Play className="w-3.5 h-3.5 text-[#0d7d74]" />
            See how it works
          </a>
        </div>

        {/* Widget mockup */}
        <div className="mt-16 max-w-sm mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-left">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#14202b] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">D</span>
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#14202b]">Privacy & Data Rights Center</p>
                <p className="text-[10px] text-slate-500">Manage cookies, your data, and access</p>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {['Your privacy rights', 'Cookie preferences', 'Accessibility', 'AI Use Disclosure'].map((label, i) => (
                <div key={i} className="border border-slate-100 rounded-lg px-3 py-2.5 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#14202b]">{label}</span>
                  <span className="text-slate-400 text-xs">›</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
              <p className="text-[10px] text-slate-400">Powered by Bizooma</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}