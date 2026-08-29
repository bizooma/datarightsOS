import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import StatementBody from '@/components/marketing/StatementBody';

// This route stays at its current URL — it is the human-facing, branded policy page
// and is the URL registered with third parties (including the Google OAuth consent
// screen), so it is never redirected. The TEXT is no longer kept here: it is read
// from the published statement, so this page and the statement URL are one document.
export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <StatementBody
          slug="datarightsos-com"
          type="privacy_policy"
          fallbackHeading="DataRightsOS — Privacy Policy"
        />
      </main>
      <MarketingFooter />
    </div>
  );
}