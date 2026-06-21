import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useEffect } from 'react';
import HeroSection from '@/components/marketing/HeroSection';
import ProblemSection from '@/components/marketing/ProblemSection';
import FeaturesSection from '@/components/marketing/FeaturesSection';
import AudienceSection from '@/components/marketing/AudienceSection';
import DifferentiatorSection from '@/components/marketing/DifferentiatorSection';
import PricingSection from '@/components/marketing/PricingSection';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import MarketingNav from '@/components/marketing/MarketingNav';

export default function Home() {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoadingAuth && !isLoadingPublicSettings && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, isLoadingPublicSettings, navigate]);

  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-7 h-7 border-4 border-slate-200 border-t-[#0d7d74] rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white text-[#14202b]">
      <MarketingNav />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <AudienceSection />
      <DifferentiatorSection />
      <PricingSection />
      <MarketingFooter />
    </div>
  );
}