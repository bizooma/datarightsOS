import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section
      className="relative pt-16 pb-20 px-6 bg-cover bg-center"
      style={{ backgroundImage: "url('https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/3f65e2111_Depositphotos_182848134_S.jpg')" }}
    >
      <div className="absolute inset-0 bg-[#14202b]/85" />
      <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
        {/* LEFT — copy */}
        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-[#0d7d74]/8 border border-[#0d7d74]/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0d7d74] shrink-0" />
            One widget · cookie consent, AI disclosure, accessibility, privacy requests
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-white leading-[1.1] tracking-tight mb-5 text-balance">
            Compliance You Can Actually Prove
          </h1>

          <p className="text-lg text-white max-w-xl mx-auto md:mx-0 leading-relaxed mb-8">
            Paste one line of code. The widget handles cookie consent, AI disclosure, accessibility,
            and privacy requests — and the dashboard behind it documents exactly how you answered
            each one.
          </p>

          <div className="flex flex-col sm:flex-row items-center md:items-start md:justify-start justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-[#0d7d74] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#0a6b63] transition-colors text-sm"
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-sm text-white/80 max-w-xl mx-auto md:mx-0 leading-relaxed mt-6">
            That panel on the right isn't a mockup — it's running on this page right now. Click the
            pill in the lower-left corner and you'll get exactly what your visitors get.
          </p>
        </div>

        {/* RIGHT — expanded widget screenshot */}
        <div className="flex justify-center md:justify-end">
          <div className="w-full max-w-[340px] md:max-w-[380px] max-h-[300px] md:max-h-[520px] overflow-hidden rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-white/10">
            <img
              src="https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/378347495_widget1.png"
              alt="The DataRightsOS privacy widget open on a website, showing cookie consent choices, privacy rights request intake, accessibility reporting, and AI disclosure."
              className="w-full object-cover object-top"
            />
          </div>
        </div>
      </div>
    </section>
  );
}