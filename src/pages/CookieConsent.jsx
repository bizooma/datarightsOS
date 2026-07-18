import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Link } from 'react-router-dom';
import { ShieldCheck, Tag, Gavel, FileClock, ArrowRight } from 'lucide-react';

const supportingPoints = [
  {
    icon: ShieldCheck,
    title: 'Honors Global Privacy Control out of the box',
    body: "Required by law in CA, CO, CT, TX, NJ, OR, and more — with California's \"Opt Me Out Act\" mandating browser-level opt-out signals (OOPS) in every browser by January 1, 2027.",
  },
  {
    icon: Tag,
    title: 'Tag-level enforcement, not just a banner',
    body: 'Prevents the #1 cited violation: a "consent honored" message while pixels keep firing in the background.',
  },
  {
    icon: Gavel,
    title: 'Built for the enforcement era',
    body: 'The CCPA authorizes penalties of $2,500 per violation, rising to $7,500 for each intentional violation — and there is no longer a guaranteed window to cure.',
  },
  {
    icon: FileClock,
    title: 'Audit-ready consent logs',
    body: 'Defensible, time-stamped records of every signal received and every choice honored.',
  },
];

export default function CookieConsent() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="bg-[#14202b] text-white">
          <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Your cookie banner is now a legal document. Treat it like one.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              One widget that honors opt-out signals, controls your tracking tags, and is built for
              twenty state privacy laws.
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
              The era of the decorative cookie banner is over. As of 2026, twenty states have
              comprehensive consumer privacy laws in effect, and regulators have shifted from writing
              the rules to enforcing them. The most common violation they're citing isn't a missing
              banner — it's a banner that says one thing while your tracking tags do another.
            </p>
            <p>
              At least a dozen states, including California, Colorado, Connecticut, Texas, New Jersey,
              and Oregon, now legally require businesses to recognize browser-based opt-out preference
              signals such as Global Privacy Control (GPC). When a visitor's browser broadcasts "do not
              sell or share my data," that signal carries the force of law. In a coordinated late-2025
              investigation, California, Colorado, and Connecticut went after companies that displayed
              an "opt-out honored" message while retargeting pixels kept firing in the background.
              California's privacy regulator ordered PlayOn Sports to pay $1.1 million for cookie-banner
              failures, including forcing users — minors among them — to click "Agree" with no real way
              to opt out.
            </p>
            <p className="text-foreground font-medium">
              DataRightsOS closes that gap. Our widget detects and honors GPC and other opt-out
              preference signals automatically, blocks non-essential tags until a choice is made, and
              gives you a defensible, time-stamped record that your "opt-out honored" message is
              actually true.
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
            Make your "opt-out honored" message actually true.
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