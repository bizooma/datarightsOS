import { useAuth } from '@/lib/AuthContext';
import HeroSection from '@/components/marketing/HeroSection';
import ProblemSection from '@/components/marketing/ProblemSection';
import FeaturesSection from '@/components/marketing/FeaturesSection';
import AudienceSection from '@/components/marketing/AudienceSection';
import DifferentiatorSection from '@/components/marketing/DifferentiatorSection';
import PricingSection from '@/components/marketing/PricingSection';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import MarketingNav from '@/components/marketing/MarketingNav';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-white text-[#14202b]">
      <MarketingNav isAuthenticated={isAuthenticated} />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <AudienceSection />
      <DifferentiatorSection />
      <PricingSection />
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3443.794538479383!2d-81.6591862!3d30.3283615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88e5b7ba8c79c7b7%3A0x29d0d337ce7701c4!2sBizooma%20Digital%20Marketing%20Agency!5e0!3m2!1sen!2sus!4v1782250936214!5m2!1sen!2sus"
        width="100%"
        height="450"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <MarketingFooter />
    </div>
  );
}