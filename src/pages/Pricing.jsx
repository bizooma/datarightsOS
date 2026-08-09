import { useAuth } from '@/lib/AuthContext';
import { useDocumentMeta } from '@/lib/seoMeta';
import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import PricingSection from '@/components/marketing/PricingSection';
import PlanGuideSection from '@/components/marketing/PlanGuideSection';
import FaqSection from '@/components/marketing/FaqSection';

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  useDocumentMeta('/pricing');

  return (
    <div className="bg-white min-h-screen">
      <MarketingNav isAuthenticated={isAuthenticated} />
      <PricingSection as="h1" />
      <PlanGuideSection />
      <FaqSection />
      <MarketingFooter />
    </div>
  );
}