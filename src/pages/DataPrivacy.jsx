import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Link } from 'react-router-dom';
import { Map, Clock, UserCheck, FileCheck, ArrowRight } from 'lucide-react';

const supportingPoints = [
  {
    icon: Map,
    title: 'One workflow for 20 states',
    body: 'Handles access, deletion, correction, and portability rights under CCPA/CPRA, Virginia, Colorado, Connecticut, Texas, and the rest.',
  },
  {
    icon: Clock,
    title: 'Beat the deadline',
    body: "Built around the CCPA's 45-day response obligation, with status tracking so nothing slips.",
  },
  {
    icon: UserCheck,
    title: 'Identity verification built in',
    body: 'Fulfill requests confidently without handing data to the wrong person.',
  },
  {
    icon: FileCheck,
    title: 'Proof you complied',
    body: 'Complete audit trail for every request — the evidence regulators expect after the $1.2M Sephora settlement and ongoing CCPA enforcement.',
  },
];

export default function DataPrivacy() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="bg-[#14202b] text-white">
          <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              When a customer asks you to delete their data, the clock is already running.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Automated intake, verification, and fulfillment of access, deletion, and correction
              requests across every state that grants them.
            </p>
            <div className="mt-9 flex items-center justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold bg-[#0d7d74] text-white px-6 py-3 rounded-lg hover:bg-[#0a6b63] transition-colors"
              >
                Start free trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="text-sm font-semibold text-white/90 px-6 py-3 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="max-w-3xl mx-auto px-6 py-16">
          <div className="space-y-5 text-muted-foreground leading-relaxed text-[15px]">
            <p>
              Twenty states now give consumers enforceable rights over their personal data — including
              the right to know what you've collected, the right to correct it, the right to take it
              elsewhere, and the right to have it deleted. Three more states, Indiana, Kentucky, and
              Rhode Island, switched their laws on in January 2026, and each grants the full slate of
              access, deletion, correction, and portability rights. These aren't suggestions: under the
              CCPA, a business generally has 45 days to respond to a verified consumer request, and
              missing that obligation carries real cost.
            </p>
            <p>
              Regulators have made the price of getting it wrong concrete. California's first major CCPA
              settlement required Sephora to pay $1.2 million, and the CCPA authorizes penalties of
              $2,500 per violation and $7,500 for each intentional one — multiplied across every affected
              consumer. The hard part for most businesses isn't willingness; it's the operational reality
              of receiving a request, verifying the requester's identity, finding the data across
              systems, and fulfilling it accurately within the deadline — every time, in every state,
              with proof.
            </p>
            <p className="text-foreground font-medium">
              DataRightsOS turns that scramble into a workflow. The widget gives consumers a clear,
              compliant request channel; verifies identity; routes the request through your systems; and
              keeps a complete, time-stamped audit trail — so a deletion request becomes a logged process
              instead of a fire drill.
            </p>
          </div>
        </section>

        {/* Supporting points */}
        <section className="bg-muted/40 border-y border-border">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="grid md:grid-cols-2 gap-5">
              {supportingPoints.map((point) => (
                <div
                  key={point.title}
                  className="bg-card border border-border rounded-xl p-6 flex gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <point.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{point.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {point.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Turn the next data request into a logged process, not a fire drill.
          </h2>
          <div className="mt-7">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-[#0d7d74] text-white px-6 py-3 rounded-lg hover:bg-[#0a6b63] transition-colors"
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}