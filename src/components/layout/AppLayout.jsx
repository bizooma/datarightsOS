import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import TrialExpiredWall from './TrialExpiredWall';
import TrialCountdownBanner from './TrialCountdownBanner';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { isTrialExpired } from '@/lib/planLimits';

export default function AppLayout() {
  const { orgId, isSuperAdmin } = useCurrentUser();

  const { data: org } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const orgs = await base44.entities.Organization.filter({ id: orgId });
      return orgs[0] || null;
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });

  // Super-admins are never blocked by trial expiry
  if (!isSuperAdmin && isTrialExpired(org)) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-60 min-h-screen flex items-center justify-center">
          <TrialExpiredWall org={org} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <TrialCountdownBanner org={org} />
          <Outlet />
        </div>
      </main>
    </div>
  );
}