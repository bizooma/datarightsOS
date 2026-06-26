import UrgencyCarousel from './UrgencyCarousel';

export default function ProblemSection() {
  return (
    <section className="bg-[#14202b] py-20 px-6">
      <div className="max-w-6xl mx-auto">
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

        <UrgencyCarousel />
      </div>
    </section>
  );
}