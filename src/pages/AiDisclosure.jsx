import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Link } from 'react-router-dom';
import { Eye, MessageSquare, Map, FileClock, ArrowRight } from 'lucide-react';

const supportingPoints = [
  {
    icon: Eye,
    title: '"Clear and conspicuous" by design',
    body: 'The standard regulators apply, met automatically instead of buried in your terms.',
  },
  {
    icon: MessageSquare,
    title: 'Chatbot disclosure handled',
    body: "Addresses requirements like California's SB 243 for telling users when they're interacting with AI, not a human.",
  },
  {
    icon: Map,
    title: "Ready for what's next",
    body: "Built to map to California (AB 2013, SB 942), Utah's AI Policy Act, and Colorado's 2027 AI Act as the patchwork grows.",
  },
  {
    icon: FileClock,
    title: 'Disclosure logging',
    body: 'A record of what you disclosed and when — your evidence of good-faith compliance.',
  },
];

export default function AiDisclosure() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="bg-[#14202b] text-white">
          <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              If AI touches your customer, you may be legally required to say so.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Clear, conspicuous AI disclosures that keep you ahead of a fast-moving wave of state
              transparency laws.
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
              AI transparency has moved from best practice to legal requirement, and 2026 is the year the
              rules took effect. In California, the Generative AI Training Data Transparency Act (AB 2013)
              became effective January 1, 2026, requiring developers of public-facing generative AI to
              publish information about their training data. The California AI Transparency Act (SB 942)
              follows on August 2, 2026, requiring large AI providers to disclose when content has been
              generated or modified by AI. And under SB 243, operators of "companion" chatbots must
              clearly tell users when they're talking to a machine rather than a person.
            </p>
            <p>
              The trend isn't confined to California. Utah's AI Policy Act already requires businesses to
              disclose generative-AI use in consumer interactions, and Colorado's AI Act — focused on AI
              that drives consequential decisions — is set to take effect in 2027. The common thread
              across all of them is a "clear and conspicuous" disclosure obligation whenever a reasonable
              person might not realize AI is involved. Vague footnotes and buried terms won't satisfy that
              standard.
            </p>
            <p className="text-foreground font-medium">
              DataRightsOS makes disclosure simple and consistent. The widget surfaces clear, conspicuous
              notices wherever AI is at work on your site — chat, content, recommendations — and logs what
              was disclosed and when, so you can show good-faith compliance as these laws expand state by
              state.
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
            Stay ahead of the AI transparency wave.
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