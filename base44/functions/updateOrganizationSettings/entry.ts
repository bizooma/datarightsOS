import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Whitelisted organization fields a member (owner/admin) is allowed to edit
// through the Settings UI. Anything not in this list — plan, billing_status,
// stripe_*, trial_*, referral_* — can NOT be written here, which closes the
// client-side free-upgrade vector (Organization RLS write is admin-only).
const ALLOWED_FIELDS = [
  'name',
  'white_label_product_name',
  'brand_logo_url',
  'brand_primary_color',
  'timezone',
  'business_name',
  'privacy_contact_email',
  'ack_email_subject',
  'ack_email_body',
  'completion_email_subject',
  'completion_email_body',
  'webhook_url',
  'webhook_enabled',
  'webhook_secret',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { organization_id, updates } = body || {};
    if (!organization_id || typeof organization_id !== 'string') {
      return Response.json({ error: 'organization_id is required' }, { status: 400 });
    }
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return Response.json({ error: 'updates object is required' }, { status: 400 });
    }

    // Super-admins (platform role 'admin') may edit any org. Everyone else must
    // (a) belong to the org they're editing, and (b) be an owner or admin of it.
    const isSuperAdmin = user.role === 'admin';
    if (!isSuperAdmin) {
      if (user.organization !== organization_id) {
        return Response.json({ error: 'Forbidden: not a member of this organization' }, { status: 403 });
      }
      if (user.role !== 'owner' && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: only owners and admins can edit organization settings' }, { status: 403 });
      }
    }

    // Strip to whitelisted fields only — silently drop plan/billing/stripe/etc.
    const safeUpdates = {};
    for (const key of ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        safeUpdates[key] = updates[key];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return Response.json({ error: 'No editable fields provided' }, { status: 400 });
    }

    const orgs = await base44.asServiceRole.entities.Organization.filter({ id: organization_id });
    if (!orgs[0]) {
      return Response.json({ error: 'Organization not found' }, { status: 404 });
    }

    const updated = await base44.asServiceRole.entities.Organization.update(organization_id, safeUpdates);
    return Response.json({ organization: updated });
  } catch (error) {
    console.error('updateOrganizationSettings failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});