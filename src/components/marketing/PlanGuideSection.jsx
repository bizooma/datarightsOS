const GUIDE = [
  {
    name: 'Free',
    body: 'You have a website and you want a cookie banner that genuinely enforces the choice. You aren’t receiving privacy requests today.',
  },
  {
    name: 'Notice',
    body: 'You want your accessibility statement and AI use statement published alongside consent, and a way for visitors to report a barrier or submit a request. You’ll handle the occasional request yourself by email.',
  },
  {
    name: 'Core',
    body: 'You’ve received a privacy request, or you expect to. This is where the 45-day clock, identity verification, the per-system checklist, and the audit trail start doing real work.',
  },
  {
    name: 'Proof',
    body: 'You run more than one site, or you manage sites for clients. You need unlimited history, bulk export, and room for a team.',
  },
  {
    name: 'Agency',
    body: 'You resell. Your product name, your branding, each client isolated in their own organization.',
  },
];

export default function PlanGuideSection() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-[#14202b] mb-3">
            Which plan do I need?
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
            The line between free and paid is simple. Free covers the banner. Paid covers what happens after a visitor asks you for something.
          </p>
        </div>

        <div className="space-y-4">
          {GUIDE.map((plan) => (
            <div
              key={plan.name}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex flex-col sm:flex-row sm:items-start gap-3"
            >
              <span className="shrink-0 inline-flex items-center text-sm font-semibold text-[#0d7d74] bg-[#0d7d74]/8 border border-[#0d7d74]/20 rounded-lg px-3 py-1 sm:w-24 justify-center">
                {plan.name}
              </span>
              <p className="text-sm text-slate-600 leading-relaxed">{plan.body}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-slate-500 leading-relaxed text-center mt-8 max-w-2xl mx-auto">
          Not sure? Start the 7-day trial — it’s the full product, and if you don’t upgrade you land on the free plan with your widget still running.
        </p>
      </div>
    </section>
  );
}