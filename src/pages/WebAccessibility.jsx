import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Link } from 'react-router-dom';
import { Scale, Gavel, Activity, ShieldOff, ArrowRight } from 'lucide-react';
import { useDocumentMeta } from '@/lib/seoMeta';

const supportingPoints = [
  {
    icon: Scale,
    title: 'Aligned to WCAG 2.1 Level AA',
    body: "The standard cited in court and referenced by DOJ's accessibility rulemaking.",
  },
  {
    icon: Gavel,
    title: 'Built on settled law',
    body: "Robles v. Domino's (9th Cir. 2019; Supreme Court declined review) confirmed the ADA reaches websites and apps.",
  },
  {
    icon: Activity,
    title: 'A visitor barrier-reporting channel',
    body: 'Visitors report accessibility problems straight from the widget, and you track and respond to each one from your dashboard.',
  },
  {
    icon: ShieldOff,
    title: 'No overlay snake oil',
    body: 'We give you a statement and a reporting channel — not the "fully compliant" overlay claims the FTC penalized accessiBe $1 million for making.',
  },
];

export default function WebAccessibility() {
  useDocumentMeta('/web-accessibility');
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="bg-[#14202b] text-white">
          <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              The fastest-growing lawsuit in America starts with your website.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              An accessibility statement referencing WCAG 2.1 AA — the standard courts actually use —
              plus a built-in way for visitors to report barriers.
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
              Web accessibility is now one of the most litigated areas of U.S. consumer law, and the
              trend line is steep. Federal lawsuits filed under Title III of the Americans with
              Disabilities Act over inaccessible websites reached 3,117 in 2025 — a 27% jump over the
              prior year — and counting state-court filings, total web accessibility lawsuits topped
              5,000. The barrier to filing keeps dropping: pro se (self-represented) ADA filings rose
              roughly 40% in 2025, with AI tools helping individuals draft and file complaints at scale.
            </p>
            <p>
              The legal foundation is settled. In Robles v. Domino's Pizza, the Ninth Circuit held that
              the ADA applies to a business's website and app, and in 2019 the Supreme Court declined to
              hear Domino's appeal — leaving that precedent in force. On remand, the court ordered
              Domino's to bring its site into conformance with the Web Content Accessibility Guidelines
              (WCAG). Though the ADA names no technical standard, WCAG 2.1 Level AA has become the de
              facto benchmark courts and the Department of Justice rely on. Critically, much of WCAG 2.1
              AA can't be verified by automated software alone — and overlay "quick fix" widgets are now
              a liability of their own: in 2025 the FTC finalized a $1 million order against accessiBe,
              barring it from claiming its AI overlay could make any site fully WCAG compliant.
            </p>
            <p className="text-foreground font-medium">
              DataRightsOS takes accessibility seriously instead of papering over it. Our widget
              publishes your accessibility statement referencing WCAG 2.1 AA and gives visitors a clear
              way to report the barriers they run into, which you track and respond to from your
              dashboard — no false "fully compliant" promises that invite the next lawsuit. The work of
              fixing your site, and compliance itself, remains yours.
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
            Get ahead of the next accessibility lawsuit.
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