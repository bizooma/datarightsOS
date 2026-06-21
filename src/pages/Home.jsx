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
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  // While checking auth, show nothing (avoid flash of marketing page for logged-in users)
  if (isLoadingAuth) {
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