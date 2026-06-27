import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import BizoomaSection from '@/components/marketing/BizoomaSection';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <img
          src="https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/1891e3f22_vault.png"
          alt="Vault"
          className="w-12 h-12 rounded-xl object-cover mb-6"
        />
        <h1 className="text-3xl font-bold text-foreground mb-6">About Data Rights OS</h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            Data Rights OS is privacy compliance infrastructure that helps businesses meet US state
            privacy laws without hiring a dedicated legal or engineering team. The platform combines a
            cookie consent widget with Global Privacy Control support, a data-rights request intake and
            fulfillment workflow, a tamper-evident audit trail, and white-label legal statement management —
            all in one place.
          </p>
          <p>
            The platform is built for law firms, digital agencies, and the client websites they protect.
            Agencies use it to offer privacy compliance as a managed service across many client sites, while
            in-house teams use it to handle consumer data-rights requests, document consent, and stay ahead
            of statutory deadlines. Every consent record and request action is logged so organizations can
            demonstrate compliance if a regulator ever comes knocking.
          </p>
          <p>
            Instead of stitching together separate tools for cookie banners, request handling, and
            record-keeping, Data Rights OS gives teams a single dashboard to configure widgets, respond to
            requests, and export regulatory-ready reports. Plans scale from a single site on the Core plan up
            to multi-site agency management.
          </p>
          <p>
            Data Rights OS is a Bizooma product, built and maintained by the Bizooma team. We focus on making
            privacy compliance approachable and affordable for the small and mid-sized businesses that need it
            most.
          </p>
        </div>
      </main>
      <BizoomaSection />
      <MarketingFooter />
    </div>
  );
}