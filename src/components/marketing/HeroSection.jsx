import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

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

        <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-bold text-white leading-[1.1] tracking-tight mb-6 text-balance lg:whitespace-nowrap">
          Compliance You Can Actually Prove
        </h1>

        <p className="text-lg text-white max-w-2xl mx-auto leading-relaxed mb-10">
          Add it to any website with one line of code, auto generated in your dashboard. Every cookie
          choice and privacy request gets honored, tracked to its legal deadline, and recorded in an
          audit trail that holds up in court.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[#0d7d74] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#0a6b63] transition-colors text-sm"
          >
            Start free trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-sm text-white/80 max-w-xl mx-auto leading-relaxed mt-6">
          See that widget in the lower-left corner? That's the product — live on this very
          page. What you're experiencing right now is exactly what your visitors will get.
        </p>
      </div>
    </section>
  );
}