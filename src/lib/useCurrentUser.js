import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const isSuperAdmin = user?.role === 'bizooma_superadmin';
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin';
  const isOwnerOrAdmin = isOwner || isAdmin || isSuperAdmin;
  const isStaff = user?.role === 'staff';

  // Super-admins can impersonate an org via sessionStorage
  const impersonateOrgId = typeof window !== 'undefined'
    ? sessionStorage.getItem('dros_impersonate_org')
    : null;
  const orgId = (isSuperAdmin && impersonateOrgId) ? impersonateOrgId : user?.organization;

  return { user, loading, isSuperAdmin, isOwner, isAdmin, isOwnerOrAdmin, isStaff, orgId };
}