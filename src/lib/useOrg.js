import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';

// Fetch the current user's Organization record (plan, billing, branding).
// Centralizes the lookup so plan-gated pages don't each re-implement it.
export function useOrg() {
  const { orgId } = useCurrentUser();
  const { data: org, isLoading } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const rows = await base44.entities.Organization.filter({ id: orgId });
      return rows[0] || null;
    },
    enabled: !!orgId,
  });
  return { org, orgId, plan: org?.plan, isLoading };
}