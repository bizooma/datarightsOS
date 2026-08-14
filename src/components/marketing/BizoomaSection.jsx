import BizoomaNewsletter from './BizoomaNewsletter';

export default function BizoomaSection() {
  return (
    <section className="bg-[#f7f8fa] py-20 px-6 border-t border-slate-100">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="flex justify-center md:justify-start">
          <a href="https://bizooma.com" target="_blank" rel="noopener noreferrer">
            <img
              src="https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/4fde077dd_bizoomalogo.png"
              alt="Bizooma Creative Agency"
              className="w-full max-w-md h-auto"
            />
          </a>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0d7d74]">
            Why we built this
          </span>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[#14202b] leading-tight">
            Built by Bizooma, for the web that needs protecting
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            While building and managing websites for clients across every industry, the team at{' '}
            <a href="https://bizooma.com" target="_blank" rel="noopener noreferrer" className="text-[#0d7d74] font-medium hover:underline">
              Bizooma, LLC
            </a>{' '}
            kept running into the same uncomfortable truth: the overwhelming majority of websites are
            quietly exposed to litigation. Most have no real mechanism to honor data and privacy laws,
            no accessible way for visitors to exercise their rights, and no audit trail to prove
            compliance when it matters.
          </p>
          <p className="mt-4 text-slate-600 leading-relaxed">
            As privacy regulations, accessibility requirements, and AI disclosure rules spread across
            US states, that gap became a serious risk for the businesses we serve. So we created Data
            Rights OS — a single, installable layer that gives any website the consent management,
            data-rights workflows, and audit logging it needs to stay on the right side of the law.
          </p>
          <BizoomaNewsletter />
        </div>
      </div>
    </section>
  );
}