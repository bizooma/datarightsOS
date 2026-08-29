import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import StatementBody from '@/components/marketing/StatementBody';
import {
  PRIVACY_POLICY_FALLBACK_HTML,
  FALLBACK_VERSION,
  FALLBACK_EFFECTIVE_DATE,
  FALLBACK_HEADING,
} from '@/components/marketing/privacyPolicyFallback';

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
          fallbackHeading={FALLBACK_HEADING}
          fallback={{
            html: PRIVACY_POLICY_FALLBACK_HTML,
            heading: FALLBACK_HEADING,
            version: FALLBACK_VERSION,
            effective_date: FALLBACK_EFFECTIVE_DATE,
          }}
        />
      </main>
      <MarketingFooter />
    </div>
  );
}