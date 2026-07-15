import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import TrialExpiredWall from './TrialExpiredWall';
import TrialCountdownBanner from './TrialCountdownBanner';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { isTrialExpired } from '@/lib/planLimits';

export default function AppLayout() {
  const { user, orgId, loading, isSuperAdmin } = useCurrentUser();
  const [provisionedOrgId, setProvisionedOrgId] = useState(null);

  // First-time users have no organization yet. Auto-provision one on the free
  // trial so the dashboard works and the 7-day countdown starts immediately.
  useEffect(() => {
    if (loading || !user || orgId || isSuperAdmin || provisionedOrgId) return;
    base44.functions
      .invoke('ensureOrganization', {})
      .then((res) => {
        const newOrg = res?.data?.organization;
        if (newOrg?.id) setProvisionedOrgId(newOrg.id);
      })
      .catch(() => {});
  }, [loading, user, orgId, isSuperAdmin, provisionedOrgId]);

  const effectiveOrgId = orgId || provisionedOrgId;

  const { data: org } = useQuery({
    queryKey: ['organization', effectiveOrgId],
    queryFn: async () => {
      if (!effectiveOrgId) return null;
      const orgs = await base44.entities.Organization.filter({ id: effectiveOrgId });
      return orgs[0] || null;
    },
    enabled: !!effectiveOrgId,
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