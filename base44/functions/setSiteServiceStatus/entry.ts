// Manual service suspend/restore — SUPER-ADMIN ONLY.
//
// This is the third and last legitimate writer of Site.service_status (the other
// two are checkSubscriptionStatus and stripeWebhook). It exists as a backend
// function rather than a UI entity write because Site RLS grants write to any
// member of the owning organization: a subscriber must never be able to restore
// their own service, so the platform-admin check has to happen server-side.
//
// Every change goes through applyServiceStatus, so it is audited with the acting
// admin's email.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { applyServiceStatus } from '../../shared/serviceStatus.ts';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Platform super-admin only. Org owners/admins are NOT sufficient here.
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: service status is managed by DataRightsOS support' }, { status: 403 });
    }

    const { site_id, service_status, reason } = await req.json();
    if (!site_id || (service_status !== 'active' && service_status !== 'suspended')) {
      return Response.json({ error: 'site_id and service_status ("active"|"suspended") are required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const sites = await svc.entities.Site.filter({ id: site_id });
    const site = sites[0];
    if (!site) return Response.json({ error: 'Site not found' }, { status: 404 });

    const changed = await applyServiceStatus(svc, {
      site,
      next: service_status,
      actor: user.email,
      reason: (reason && String(reason).slice(0, 300)) || `set to ${service_status} manually by support`,
    });

    return Response.json({ ok: true, changed, service_status });
  } catch (error) {
    console.error('setSiteServiceStatus failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});