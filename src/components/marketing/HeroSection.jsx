import HeroScanForm from '@/components/marketing/HeroScanForm';
import SampleReport from '@/components/scan/SampleReport';

export default function HeroSection() {
  return (
    <section
      className="relative pt-10 pb-12 px-6 bg-cover bg-center"
      style={{ backgroundImage: "url('https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/3f65e2111_Depositphotos_182848134_S.jpg')" }}
    >
      <div className="absolute inset-0 bg-[#14202b]/85" />
      <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
        {/* LEFT — positioning, then the scan action */}
        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-[#0d7d74]/8 border border-[#0d7d74]/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0d7d74] shrink-0" />
            One widget · cookie consent, AI disclosure, accessibility, privacy requests
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-white leading-[1.1] tracking-tight mb-5 text-balance">
            Privacy Laws Have Deadlines. Prove You Met Them
          </h1>

          <p className="text-lg text-white max-w-xl mx-auto md:mx-0 leading-relaxed mb-8">
            Paste one line of code. One widget covers cookie consent, AI disclosure, accessibility,
            and privacy requests, and the dashboard behind it runs the response clock and records
            exactly how you answered, and when.
          </p>

          <div className="max-w-xl mx-auto md:mx-0 text-left">
            <HeroScanForm />
          </div>
        </div>

        {/* RIGHT — sample report excerpt, built from the real report components */}
        <div className="w-full min-w-0">
          <SampleReport />
        </div>
      </div>
    </section>
  );
}