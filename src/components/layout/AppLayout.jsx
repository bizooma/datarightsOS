import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import TrialCountdownBanner from './TrialCountdownBanner';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { getStoredReferral } from '@/lib/referral';
import FreePlanBanner from './FreePlanBanner';

export default function AppLayout() {
  const { user, loading, isSuperAdmin } = useCurrentUser();

  // Resolve the org through ensureOrganization for every (non-super-admin) user.
  // It returns the existing org or provisions a fresh trial one, and — crucially —
  // it runs with the service role, so it always returns the org data even when a
  // user-scoped Organization query would 403 right after a fresh Google sign-up.
  const { data: org } = useQuery({
    queryKey: ['organization', user?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke('ensureOrganization', {
        referral_source: getStoredReferral() || undefined,
      });
      return res?.data?.organization || null;
    },
    enabled: !loading && !!user && !isSuperAdmin,
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <TrialCountdownBanner org={org} />
          {org?.plan === 'free' && <FreePlanBanner org={org} />}
          <Outlet context={{ org }} />
        </div>
      </main>
    </div>
  );
}